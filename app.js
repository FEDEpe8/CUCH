const API_URL = "https://script.google.com/macros/s/AKfycbwjHAaoMT5lzv8V6JF-2eAI8tb7MX6nSDF5-xh9jBy9kFYyaQW9iv5m1JyY4HvHFQ4m/exec"; 

// Guardamos el perfil del estudiante en memoria
let usuarioActual = {
    nombre: "",
    apellido: "",
    dni: ""
};

// 1. Inicializar OneSignal
window.OneSignalDeferred = window.OneSignalDeferred || [];
OneSignalDeferred.push(function(OneSignal) {
  OneSignal.init({
    appId: "c1945570-4b80-4939-99c1-b56ef9b7802a", 
  });
});

// 2. Registrar el Service Worker para la PWA
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js')
      .then(() => console.log('Service Worker registrado correctamente.'))
      .catch(err => console.error('Error al registrar SW:', err));
}

// 3. Lógica de validación e Ingreso 
function validarNombre_ApellidoDNI() {
    const nombre = document.getElementById('nombreInput').value.trim();
    const apellido = document.getElementById('apellidoInput').value.trim();
    const dni = document.getElementById('dniInput').value.trim();

    if(nombre !== "" && apellido !== "" && dni.length >= 7) {
        // Guardamos los datos en memoria
        usuarioActual = { nombre: nombre, apellido: apellido, dni: dni }; 
        
        document.getElementById('login-section').style.display = 'none';
        document.getElementById('viajes-section').style.display = 'block';
        
        cargarViajesDesdeAPI(); // Llamamos a la API para mostrar los viajes
    } else {
        alert("Por favor, completá tu Nombre, Apellido y un DNI válido.");
    }
}

// 4. Traer los viajes (Ahora le mandamos el DNI para saber si ya reservó)
async function cargarViajesDesdeAPI() {
    const contenedor = document.getElementById('lista-viajes');
    contenedor.innerHTML = '<p>Cargando viajes disponibles...</p>';

    try {
        // Fetch con el DNI en la URL
        const respuesta = await fetch(`${API_URL}?dni=${usuarioActual.dni}`);
        const viajesReales = await respuesta.json();
        renderizarViajes(viajesReales);
    } catch (error) {
        console.error("Error al cargar viajes:", error);
        contenedor.innerHTML = '<p>Error de conexión al cargar los viajes.</p>';
    }
}

// 5. Mostrar los viajes (Con límites de fechas)
function renderizarViajes(viajes) {
    const contenedor = document.getElementById('lista-viajes');
    contenedor.innerHTML = '';

    const ahora = new Date(); // Obtenemos la fecha y hora exacta de este momento

    viajes.forEach(viaje => {
        const card = document.createElement('div');
        card.className = 'viaje-card';
        
        let botonHTML = '';
        let estaAbierto = true;
        let mensajeBloqueo = "";

        // Verificamos si hay fecha de INICIO y si todavía no llegamos
        if (viaje.Inicio_Inscripcion) {
            const fechaInicio = new Date(viaje.Inicio_Inscripcion);
            if (ahora < fechaInicio) {
                estaAbierto = false;
                // Formateamos la fecha para que se lea linda en el botón
                mensajeBloqueo = "⏳ Abre el " + fechaInicio.toLocaleDateString('es-AR', {day: 'numeric', month: 'short', hour: '2-digit', minute:'2-digit'});
            }
        }

        // Verificamos si hay fecha de CIERRE y si ya nos pasamos
        if (viaje.Cierre_Inscripcion) {
            const fechaCierre = new Date(viaje.Cierre_Inscripcion);
            if (ahora > fechaCierre) {
                estaAbierto = false;
                mensajeBloqueo = "🔒 Inscripción Cerrada";
            }
        }
        
        // Lógica de los botones según el estado
        if (viaje.yaReservado) {
            // Si ya reservó, siempre le dejamos el botón de cancelar por si se arrepiente a último minuto
            botonHTML = `<button class="btn" style="background-color: #dc3545;" onclick="cancelarReserva(${viaje.ID})">❌ Cancelar Mi Reserva</button>`;
        } else if (!estaAbierto) {
            // Si la inscripción no está abierta (es futura o ya cerró), mostramos el botón gris desactivado
            botonHTML = `<button class="btn" disabled>${mensajeBloqueo}</button>`;
        } else {
            // Si estamos dentro de la fecha, comprobamos los cupos normalmente
            const hayLugar = viaje.Cupos_Disponibles > 0;
            const textoBoton = hayLugar ? 'Reservar Asiento' : 'Sin Cupo';
            botonHTML = `<button class="btn" ${!hayLugar ? 'disabled' : ''} onclick="reservar(${viaje.ID})">${textoBoton}</button>`;
        }
        
        card.innerHTML = `
            <h3>📅 Salida: ${viaje.Fecha}</h3>
            <p><strong>Regreso:</strong> ${viaje.Regreso}</p>
            <p><strong>Cupos disponibles:</strong> ${viaje.Cupos_Disponibles} de ${viaje.Cupos_Totales}</p>
            ${botonHTML}
        `;
        contenedor.appendChild(card);
    });
}

// 6. Enviar la reserva
async function reservar(idViaje) {
    alert("Procesando tu reserva, por favor esperá...");
    const datosReserva = { accion: 'reservar', idViaje: idViaje, dni: usuarioActual.dni, nombre: usuarioActual.nombre, apellido: usuarioActual.apellido };
    enviarPost(datosReserva, "¡Asiento reservado con éxito! Recordá cancelar si no vas a viajar.");
}

// 7. Cancelar la reserva
async function cancelarReserva(idViaje) {
    if(confirm("¿Estás seguro que querés cancelar tu viaje y liberar el asiento?")) {
        alert("Procesando cancelación...");
        const datosCancelacion = { accion: 'cancelar', idViaje: idViaje, dni: usuarioActual.dni };
        enviarPost(datosCancelacion, "Reserva cancelada. ¡Gracias por ceder tu lugar!");
    }
}

// 8. Función auxiliar para enviar peticiones POST al servidor
async function enviarPost(datos, mensajeExito) {
    try {
        const respuesta = await fetch(API_URL, {
            method: 'POST',
            body: JSON.stringify(datos)
        });
        const resultado = await respuesta.json();
        if(resultado.status === "éxito") {
            alert(mensajeExito);
            cargarViajesDesdeAPI(); // Recarga la pantalla para actualizar los botones y cupos
        }
    } catch (error) {
        console.error("Error:", error);
        alert("Hubo un error de conexión.");
    }
}

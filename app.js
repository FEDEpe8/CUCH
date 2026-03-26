// ATENCIÓN: Pegá tu URL de Google Apps Script acá
const API_URL = "https://script.google.com/macros/s/AKfycbx65xj0377gGxwfrWMS_Erv4IU2UnjBpbpnOFQJkuTUXaMBXP15IaxNM4KTXe8xoM0/exec"; 

let usuarioActual = {
    nombre: "",
    apellido: "",
    dni: "",
    telefono: ""
};

// 1. Inicializar OneSignal
window.OneSignalDeferred = window.OneSignalDeferred || [];
OneSignalDeferred.push(function(OneSignal) {
  OneSignal.init({
    appId: "c1945570-4b80-4939-99c1-b56ef9b7802a", 
  });
});

// 2. Registrar el Service Worker
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js')
      .then(() => console.log('Service Worker registrado.'))
      .catch(err => console.error('Error al registrar SW:', err));
}

// 3. Lógica de validación (Pide los 4 datos)
function validarDatos() {
    const nombre = document.getElementById('nombreInput').value.trim();
    const apellido = document.getElementById('apellidoInput').value.trim();
    const dni = document.getElementById('dniInput').value.trim();
    const telefono = document.getElementById('telefonoInput').value.trim();

    if(nombre !== "" && apellido !== "" && dni.length >= 7 && telefono.length >= 8) {
        usuarioActual = { nombre: nombre, apellido: apellido, dni: dni, telefono: telefono }; 
        
        document.getElementById('login-section').style.display = 'none';
        document.getElementById('viajes-section').style.display = 'block';
        cargarViajesDesdeAPI(); 
    } else {
        alert("Por favor, completá todos tus datos correctamente (DNI y Teléfono válidos).");
    }
}

// 4. Traer los viajes
async function cargarViajesDesdeAPI() {
    const contenedor = document.getElementById('lista-viajes');
    contenedor.innerHTML = '<p>Cargando viajes disponibles...</p>';

    try {
        const respuesta = await fetch(`${API_URL}?dni=${usuarioActual.dni}`);
        const viajesReales = await respuesta.json();
        renderizarViajes(viajesReales);
    } catch (error) {
        console.error("Error al cargar viajes:", error);
        contenedor.innerHTML = '<p>Error de conexión al cargar los viajes.</p>';
    }
}

// 5. Mostrar los viajes (Bloquea cancelaciones si ya cerró)
function renderizarViajes(viajes) {
    const contenedor = document.getElementById('lista-viajes');
    contenedor.innerHTML = '';

    const ahora = new Date();

    viajes.forEach(viaje => {
        const card = document.createElement('div');
        card.className = 'viaje-card';
        
        let botonHTML = '';
        let estaAbierto = true;
        let yaCerro = false; 
        let mensajeBloqueo = "";

        if (viaje.Inicio_Inscripcion) {
            const fechaInicio = new Date(viaje.Inicio_Inscripcion);
            if (ahora < fechaInicio) {
                estaAbierto = false;
                mensajeBloqueo = "⏳ Abre el " + fechaInicio.toLocaleDateString('es-AR', {day: 'numeric', month: 'short', hour: '2-digit', minute:'2-digit'});
            }
        }

        if (viaje.Cierre_Inscripcion) {
            const fechaCierre = new Date(viaje.Cierre_Inscripcion);
            if (ahora > fechaCierre) {
                estaAbierto = false;
                yaCerro = true; 
                mensajeBloqueo = "🔒 Inscripción Cerrada";
            }
        }
        
        if (viaje.yaReservado) {
            if (yaCerro) {
                // Bloqueamos la cancelación
                botonHTML = `<button class="btn" disabled style="background-color: #6c757d;">🔒 Viaje Cerrado (No se puede cancelar)</button>`;
            } else {
                botonHTML = `<button class="btn" style="background-color: #dc3545;" onclick="cancelarReserva(${viaje.ID})">❌ Cancelar Mi Reserva</button>`;
            }
        } else if (!estaAbierto) {
            botonHTML = `<button class="btn" disabled>${mensajeBloqueo}</button>`;
        } else {
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
    const datosReserva = { 
        accion: 'reservar', 
        idViaje: idViaje, 
        dni: usuarioActual.dni, 
        nombre: usuarioActual.nombre, 
        apellido: usuarioActual.apellido,
        telefono: usuarioActual.telefono 
    };
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

// 8. Peticiones POST 
async function enviarPost(datos, mensajeExito) {
    try {
        const respuesta = await fetch(API_URL, {
            method: 'POST',
            body: JSON.stringify(datos)
        });
        const resultado = await respuesta.json();
        
        if (resultado.status === "éxito") {
            alert(mensajeExito);
            cargarViajesDesdeAPI(); 
        } else if (resultado.status === "error") {
            alert("⚠️ " + resultado.mensaje); 
            cargarViajesDesdeAPI(); 
        }
    } catch (error) {
        console.error("Error:", error);
        alert("Hubo un error de conexión.");
    }
}

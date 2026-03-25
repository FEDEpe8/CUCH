const API_URL = "https://script.google.com/macros/s/AKfycbwP2oBTiNHc5_OQYKWWNAMFBkzk3TlrVSTtVeDa5baVvrHFYTdvb1P11XfElDCAQb_V/exec"; 

// Guardamos el perfil
let usuarioActual = {
    nombre: "",
    apellido: "",
    dni: ""
};

// 1. Inicializar OneSignal (Debe ir suelto, arriba de todo)
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

// 4. Traer los viajes desde Google Sheets (GET)
async function cargarViajesDesdeAPI() {
    const contenedor = document.getElementById('lista-viajes');
    contenedor.innerHTML = '<p>Cargando viajes disponibles...</p>';

    try {
        const respuesta = await fetch(API_URL);
        const viajesReales = await respuesta.json();
        renderizarViajes(viajesReales);
    } catch (error) {
        console.error("Error al cargar viajes:", error);
        contenedor.innerHTML = '<p>Error de conexión al cargar los viajes.</p>';
    }
}

// 5. Mostrar los viajes en pantalla
function renderizarViajes(viajes) {
    const contenedor = document.getElementById('lista-viajes');
    contenedor.innerHTML = '';

    viajes.forEach(viaje => {
        const card = document.createElement('div');
        card.className = 'viaje-card';
        
        const hayLugar = viaje.Cupos_Disponibles > 0;
        const textoBoton = hayLugar ? 'Reservar Asiento' : 'Sin Cupo';
        
        card.innerHTML = `
            <h3>📅 Salida: ${viaje.Fecha}</h3>
            <p><strong>Regreso:</strong> ${viaje.Regreso}</p>
            <p><strong>Cupos disponibles:</strong> ${viaje.Cupos_Disponibles} de ${viaje.Cupos_Totales}</p>
            <button class="btn" ${!hayLugar ? 'disabled' : ''} 
                onclick="reservar(${viaje.ID})">${textoBoton}</button>
        `;
        contenedor.appendChild(card);
    });
}

// 6. Enviar la reserva a Google Sheets (POST)
async function reservar(idViaje) {
    alert("Procesando tu reserva, por favor esperá...");
    
    const datosReserva = {
        idViaje: idViaje,
        dni: usuarioActual.dni,
        nombre: usuarioActual.nombre,
        apellido: usuarioActual.apellido
    };

    try {
        const respuesta = await fetch(API_URL, {
            method: 'POST',
            body: JSON.stringify(datosReserva)
        });
        
        const resultado = await respuesta.json();
        if(resultado.status === "éxito") {
            alert("¡Asiento reservado con éxito! Recordá cancelar si no vas a viajar.");
            cargarViajesDesdeAPI(); // Recarga la lista
        }
    } catch (error) {
        console.error("Error al guardar reserva:", error);
        alert("Hubo un error al reservar. Revisa tu conexión a internet.");
    }
}

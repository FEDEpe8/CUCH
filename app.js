// ATENCIÓN: Reemplazá esta URL por la que te dio Google Apps Script en el paso anterior
const API_URL = "https://script.google.com/macros/s/AKfycbytD9KLzEIcI0TgGMwp0xehuIn3kZ8b6MrXpSZ0DAmaEo4Tj5x4spE5GlALVBxPc-7J/exec"; 

let dniUsuarioActual = "";

// 1. Registrar el Service Worker para la PWA
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js')
      .then(() => console.log('Service Worker registrado correctamente.'))
      .catch(err => console.error('Error al registrar SW:', err));
}

// 2. Solicitar permisos de notificación (Alertas)
function pedirPermisoNotificaciones() {
    if ('Notification' in window && navigator.serviceWorker) {
        Notification.requestPermission().then(permission => {
            if (permission === 'granted') {
                console.log('¡Permiso de notificaciones concedido!');
                // suscribirUsuarioAPush(); // Esto lo activaremos cuando armemos el backend de notificaciones
            }
        });
    }
}

// 3. Lógica de validación e Ingreso
function validarDNI() {
    const dni = document.getElementById('dniInput').value;
    if(dni.length >= 7) {
        dniUsuarioActual = dni; // Guardamos el DNI en memoria
        document.getElementById('login-section').style.display = 'none';
        document.getElementById('viajes-section').style.display = 'block';
        
        pedirPermisoNotificaciones(); // Pedimos permiso para alertas al entrar
        cargarViajesDesdeAPI(); // Buscamos los viajes reales en Sheets
    } else {
        alert("Por favor, ingresá un DNI válido.");
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
        dni: dniUsuarioActual
    };

    try {
        const respuesta = await fetch(API_URL, {
            method: 'POST',
            body: JSON.stringify(datosReserva)
        });
        
        const resultado = await respuesta.json();
        if(resultado.status === "éxito") {
            alert("¡Asiento reservado con éxito! Recordá cancelar si no vas a viajar.");
            cargarViajesDesdeAPI(); // Recarga la lista para actualizar los cupos visualmente
        }
    } catch (error) {
        console.error("Error al guardar reserva:", error);
        alert("Hubo un error al reservar. Revisa tu conexión a internet.");
    }
}
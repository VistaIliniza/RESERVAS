// =========================================
// INICIO.JS - LÓGICA DEL DASHBOARD
// =========================================

document.addEventListener('DOMContentLoaded', () => {

    // 🔴 URL OFICIAL DE LA BASE DE DATOS DEL LODGE CONFIGURADA
    const API_URL = "https://script.google.com/macros/s/AKfycbyHiMKRmedyeaNDs6JEHotpe2Q00Svw_HZg6tHNQwROHz5rz5zCTspoBwoP6A4TFnuk/exec";

    // 1. Mostrar la fecha actual
    const dateBadge = document.getElementById('current-date');
    if (dateBadge) {
        const opcionesFecha = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        const fechaActual = new Date().toLocaleDateString('es-ES', opcionesFecha);
        dateBadge.textContent = fechaActual.charAt(0).toUpperCase() + fechaActual.slice(1);
    }

    // 2. Conectar a Google Sheets para contar clientes reales
    const statClientes = document.getElementById('stat-clientes');

    async function cargarEstadisticas() {
        try {
            const respuesta = await fetch(API_URL);
            const datos = await respuesta.json();
            
            // Si la base de datos está vacía o no es una lista válida, ponemos 0
            if (!Array.isArray(datos) || datos.length === 0) {
                statClientes.textContent = "0";
                return;
            }

            // Filtramos para asegurar que no cuente filas vacías
            const clientesValidos = datos.filter(cliente => cliente.nombres && cliente.nombres !== "Sin dato" && cliente.nombres !== "");
            
            statClientes.textContent = clientesValidos.length;

        } catch (error) {
            console.error("Error descargando datos del dashboard:", error);
            // Si no hay internet o falla, muestra 0 en lugar de "Error"
            statClientes.textContent = "0";
        }
    }

    if (statClientes) {
        cargarEstadisticas();
    }
});
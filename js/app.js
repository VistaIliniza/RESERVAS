// =========================================
// 1. EL CANDADO GLOBAL (SEGURIDAD)
// =========================================
if (sessionStorage.getItem('sesion_activa') !== 'true') {
    window.location.href = "login.html";
}

// =========================================
// APP.JS - LÓGICA GLOBAL DE NOTIFICACIONES Y SESIÓN
// =========================================
document.addEventListener('DOMContentLoaded', () => {
    
    const btnNotif = document.getElementById('btn-notificaciones');
    const panelNotif = document.getElementById('panel-notificaciones');
    const badgeNotif = document.getElementById('notif-badge');
    const listaNotif = document.getElementById('notif-lista');

    // 🔴 TU URL NUEVA EXACTA PARA BUSCAR NOTIFICACIONES (CUENTA DEL LODGE)
    const API_URL = "https://script.google.com/macros/s/AKfycbyHiMKRmedyeaNDs6JEHotpe2Q00Svw_HZg6tHNQwROHz5rz5zCTspoBwoP6A4TFnuk/exec";

    // Variable global para saber cuántas reservas hay en total ahorita
    let totalAlertasActuales = 0;

    // FASE DE DESCARGA: LEER LAS RESPUESTAS REALES
    async function cargarNotificacionesDesdeExcel() {
        try {
            const respuesta = await fetch(API_URL);
            const datos = await respuesta.json();

            if (!Array.isArray(datos) || datos.length === 0) {
                if (listaNotif) listaNotif.innerHTML = '<div style="padding: 20px; text-align: center; color: var(--text-muted); font-size: 0.85rem;">No hay alertas pendientes.</div>';
                if (badgeNotif) badgeNotif.style.display = 'none';
                return;
            }

            const alertasReales = datos.filter(reserva => reserva.nombres && reserva.nombres !== "Sin dato" && reserva.nombres !== "");
            totalAlertasActuales = alertasReales.length;

            if (totalAlertasActuales === 0) {
                if (listaNotif) listaNotif.innerHTML = '<div style="padding: 20px; text-align: center; color: var(--text-muted); font-size: 0.85rem;">No hay alertas pendientes.</div>';
                if (badgeNotif) badgeNotif.style.display = 'none';
                return;
            }

            // =========================================
            // LÓGICA INTELIGENTE DE "LEÍDAS" CON MEMORIA
            // =========================================
            let leidasGuardadas = parseInt(localStorage.getItem('notificaciones_leidas_total')) || 0;
            
            // Si tú borras un cliente manualmente, el total baja. Ajustamos la memoria para que no se trabe el conteo.
            if (totalAlertasActuales < leidasGuardadas) {
                leidasGuardadas = totalAlertasActuales;
                localStorage.setItem('notificaciones_leidas_total', leidasGuardadas);
            }

            let notificacionesNuevas = totalAlertasActuales - leidasGuardadas;

            if (badgeNotif) {
                if (notificacionesNuevas > 0) {
                    badgeNotif.style.display = 'flex';
                    badgeNotif.textContent = notificacionesNuevas > 9 ? '+9' : notificacionesNuevas;
                } else {
                    badgeNotif.style.display = 'none';
                }
            }

            const ultimasAlertas = alertasReales.slice(-3).reverse();

            if (listaNotif) {
                listaNotif.innerHTML = '';
                
                ultimasAlertas.forEach(alerta => {
                    const fechaIngreso = alerta.ingreso || 'N/A';
                    const fechaSalida = alerta.salida || 'N/A';

                    let html = `
                        <div style="padding: 15px 20px; border-bottom: 1px solid var(--border); display: flex; gap: 15px; align-items: flex-start; cursor: pointer; transition: background 0.2s;">
                            <div style="font-size: 1.5rem;">📅</div>
                            <div style="flex: 1;">
                                <h5 style="font-size: 0.85rem; color: var(--text-dark); margin-bottom: 3px; font-weight: 800;">¡Nueva Reserva Detectada!</h5>
                                <p style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 5px; line-height: 1.4;">
                                    <strong>${alerta.nombres}</strong> registró una estadía en <strong>${alerta.cabana || 'Cabaña'}</strong>.
                                </p>
                                <div style="font-size: 0.75rem; color: #27462A; font-weight: 700; background: #f8fafc; padding: 3px 8px; border-radius: 4px; display: inline-block;">
                                    🗓️ ${fechaIngreso} al ${fechaSalida}
                                </div>
                            </div>
                        </div>
                    `;
                    listaNotif.insertAdjacentHTML('beforeend', html);
                });
            }

        } catch (error) {
            console.error("Error al sincronizar las notificaciones:", error);
            if (listaNotif) listaNotif.innerHTML = '<div style="padding: 20px; text-align: center; color: #ef4444; font-size: 0.85rem;">Error al conectar con las alertas.</div>';
        }
    }

    // ABRIR Y CERRAR EL PANEL DE NOTIFICACIONES
    if (btnNotif && panelNotif) {
        btnNotif.addEventListener('click', (e) => {
            e.stopPropagation(); 
            panelNotif.classList.toggle('active');
        });
        
        document.addEventListener('click', (e) => {
            if (!panelNotif.contains(e.target) && e.target !== btnNotif && !btnNotif.contains(e.target)) {
                panelNotif.classList.remove('active');
            }
        });
    }

    // BOTÓN MARCAR LEÍDAS - CON LOCALSTORAGE
    const btnMarcarLeidas = document.querySelector('.mark-read');
    if (btnMarcarLeidas) {
        btnMarcarLeidas.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            // Guardamos el total actual como "ya visto"
            localStorage.setItem('notificaciones_leidas_total', totalAlertasActuales);
            
            if (badgeNotif) badgeNotif.style.display = 'none';
            panelNotif.classList.remove('active');
        });
    }

    // ARREGLO: ENLACE "VER HISTORIAL"
    const linkHistorial = document.querySelector('.notif-footer a');
    if (linkHistorial) {
        linkHistorial.href = "clientes.html";
    }

    cargarNotificacionesDesdeExcel();

    // =========================================
    // 2. NUEVO BOTÓN DE CERRAR SESIÓN (DISEÑO PREMIUM)
    // =========================================
    const btnLogout = document.querySelector('.logout-btn');
    if (btnLogout) {
        const modalHTML = `
            <div id="modal-logout-premium" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); backdrop-filter: blur(4px); z-index: 9999; display: flex; align-items: center; justify-content: center; opacity: 0; visibility: hidden; transition: all 0.3s;">
                <div class="modal-content-logout" style="background: white; padding: 30px; border-radius: 20px; width: 90%; max-width: 400px; text-align: center; transform: translateY(20px); transition: all 0.3s; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1); font-family: 'Montserrat', sans-serif;">
                    <div style="font-size: 3.5rem; margin-bottom: 10px;">🚪</div>
                    <h3 style="margin-bottom: 10px; color: #0f172a; font-weight: 800;">¿Cerrar Sesión?</h3>
                    <p style="color: #64748b; font-size: 0.9rem; margin-bottom: 25px;">Tendrás que volver a ingresar tus credenciales para acceder al panel.</p>
                    <div style="display: flex; gap: 15px; justify-content: center;">
                        <button id="btn-cancelar-logout" style="padding: 12px 20px; border-radius: 12px; border: 1px solid #e2e8f0; font-weight: 700; color: #64748b; background: white; cursor: pointer; transition: background 0.2s;">Cancelar</button>
                        <button id="btn-confirmar-logout" style="padding: 12px 20px; border-radius: 12px; border: none; font-weight: 700; color: white; background: #ef4444; box-shadow: 0 8px 15px -6px rgba(239, 68, 68, 0.4); cursor: pointer; transition: transform 0.2s;">Sí, Salir</button>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);

        const modalLogout = document.getElementById('modal-logout-premium');
        const btnCancelar = document.getElementById('btn-cancelar-logout');
        const btnConfirmar = document.getElementById('btn-confirmar-logout');
        const contentLogout = modalLogout.querySelector('.modal-content-logout');

        btnLogout.addEventListener('click', (e) => {
            e.preventDefault();
            modalLogout.style.opacity = '1';
            modalLogout.style.visibility = 'visible';
            contentLogout.style.transform = 'translateY(0)';
        });

        btnCancelar.addEventListener('click', () => {
            modalLogout.style.opacity = '0';
            modalLogout.style.visibility = 'hidden';
            contentLogout.style.transform = 'translateY(20px)';
        });

        btnConfirmar.addEventListener('click', () => {
            btnConfirmar.textContent = "Saliendo...";
            sessionStorage.removeItem('sesion_activa'); 
            window.location.href = "login.html"; 
        });
    }
});
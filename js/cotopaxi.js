// =========================================
// COTOPAXI.JS - LÓGICA DE OVERLAP AVANZADA Y ALERTA VISUAL DE RECAMBIO
// =========================================

document.addEventListener('DOMContentLoaded', () => {
    
    const API_URL = 'https://script.google.com/macros/s/AKfycbz4pFHwCfKEhodnpHwDAe8ZiPjp6fTMKnD_0WWdV7aXKL7p8Zw_ruuxYP_0l_7HGEMsLw/exec?action=admin';
    
    // Inyección de estilos CSS dinámicos
    const estiloCalendario = document.createElement('style');
    estiloCalendario.innerHTML = `
        /* Días normales a la mitad */
        .cal-day.checkout-day { background: linear-gradient(to right, #ef4444 50%, #f8fafc 50%); color: #0f172a; border: 1px solid #e2e8f0; }
        .cal-day.checkin-day { background: linear-gradient(to right, #f8fafc 50%, #ef4444 50%); color: #0f172a; border: 1px solid #e2e8f0; }
        
        /* Día totalmente ocupado */
        .cal-day.full-day { background: #ef4444; color: white; border: none; }
        
        /* 🔥 NUEVO: DÍA COMPARTIDO (CRUCE DE HORARIOS) VISUALMENTE DISTINTO 🔥 */
        .cal-day.split-day { 
            background: linear-gradient(to right, #ef4444 50%, #10b981 50%); 
            color: white; 
            font-weight: 900; 
            border: 2px solid #0f172a; 
            box-shadow: 0 4px 6px rgba(0,0,0,0.2);
            position: relative;
            z-index: 2;
        }
        
        /* Estilos para la notificación de recambio (Cruce de clientes) */
        .toast-cruce { width: 350px !important; padding: 15px !important; display: block !important; }
        .cruce-header { font-size: 0.9rem; font-weight: 800; color: #d97706; margin-bottom: 12px; display: flex; align-items: center; gap: 8px; border-bottom: 1px solid #fde68a; padding-bottom: 8px; }
        .cruce-body { display: flex; gap: 10px; }
        .cruce-box { flex: 1; padding: 10px; border-radius: 8px; }
        .cruce-out { background: #fee2e2; border: 1px solid #fca5a5; }
        .cruce-in { background: #d1fae5; border: 1px solid #6ee7b7; }
        .cruce-label { font-size: 0.65rem; font-weight: 800; text-transform: uppercase; margin-bottom: 4px; }
        .cruce-out .cruce-label { color: #ef4444; }
        .cruce-in .cruce-label { color: #10b981; }
        .cruce-name { font-size: 0.85rem; font-weight: 700; color: #0f172a; line-height: 1.2; }
    `;
    document.head.appendChild(estiloCalendario);

    const gridDays = document.getElementById('calendar-grid-days');
    const monthYearTitle = document.getElementById('calendar-month-year');
    const btnPrev = document.getElementById('prev-month');
    const btnNext = document.getElementById('next-month');
    
    const inputCheckin = document.getElementById('checkin-input');
    const inputCheckout = document.getElementById('checkout-input');

    if (!gridDays) return;

    let dateObj = new Date();
    let currentMonth = dateObj.getMonth();
    let currentYear = dateObj.getFullYear();
    let checkinDateStr = ""; 
    let checkoutDateStr = "";
    
    let diasEstado = {}; 
    let infoFechasOcupadas = {}; 

    function renderCalendar() {
        gridDays.innerHTML = '';
        const firstDay = new Date(currentYear, currentMonth, 1).getDay();
        const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
        const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
        monthYearTitle.textContent = `${monthNames[currentMonth]} ${currentYear}`;

        for (let i = 0; i < firstDay; i++) {
            const emptyDiv = document.createElement('div');
            emptyDiv.className = 'cal-day empty';
            gridDays.appendChild(emptyDiv);
        }

        for (let i = 1; i <= daysInMonth; i++) {
            const dayDiv = document.createElement('div');
            const dateString = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
            dayDiv.textContent = i;
            dayDiv.dataset.date = dateString;

            const estado = diasEstado[dateString];

            if (estado) {
                dayDiv.className = `cal-day occupied ${estado}-day`;
                dayDiv.style.cursor = 'pointer';
                dayDiv.addEventListener('click', () => handleDayClick(dateString));
            } else {
                dayDiv.className = 'cal-day available';
                dayDiv.addEventListener('click', () => handleDayClick(dateString));
            }

            if (dateString === checkinDateStr || dateString === checkoutDateStr) dayDiv.classList.add('selected');
            if (checkinDateStr && checkoutDateStr && dateString > checkinDateStr && dateString < checkoutDateStr) dayDiv.classList.add('in-range');

            gridDays.appendChild(dayDiv);
        }
    }

    async function cargarReservas() {
        try {
            const respuesta = await fetch(API_URL);
            const datos = await respuesta.json();
            
            const reservasCabaña = datos.filter(reserva => String(reserva.cabana).toLowerCase().includes("cotopaxi"));
            const listaTarjetas = document.getElementById('lista-tarjetas-clientes');
            
            reservasCabaña.forEach(reserva => {
                if(reserva.ingreso && reserva.salida) {
                    let dIngreso = new Date(reserva.ingreso + 'T12:00:00');
                    let dSalida = new Date(reserva.salida + 'T12:00:00');
                    
                    let strIngreso = dIngreso.toISOString().split('T')[0];
                    let strSalida = dSalida.toISOString().split('T')[0];

                    diasEstado[strIngreso] = (diasEstado[strIngreso] === 'checkout') ? 'split' : 'checkin';
                    infoFechasOcupadas[strIngreso] = infoFechasOcupadas[strIngreso] || [];
                    infoFechasOcupadas[strIngreso].push({ tipo: 'ingreso', data: reserva });

                    let current = new Date(dIngreso);
                    current.setDate(current.getDate() + 1);
                    while(current < dSalida) {
                        let strCurrent = current.toISOString().split('T')[0];
                        diasEstado[strCurrent] = 'full';
                        infoFechasOcupadas[strCurrent] = infoFechasOcupadas[strCurrent] || [];
                        infoFechasOcupadas[strCurrent].push({ tipo: 'estadia', data: reserva });
                        current.setDate(current.getDate() + 1);
                    }

                    if (diasEstado[strSalida] === 'checkin') {
                        diasEstado[strSalida] = 'split';
                    } else if (diasEstado[strSalida] !== 'full' && diasEstado[strSalida] !== 'split') {
                        diasEstado[strSalida] = 'checkout';
                    }
                    infoFechasOcupadas[strSalida] = infoFechasOcupadas[strSalida] || [];
                    infoFechasOcupadas[strSalida].push({ tipo: 'salida', data: reserva });
                }
                
                if(listaTarjetas && reserva.nombres) {
                    let celularMostrar = String(reserva.celular).replace(/^'/, "");
                    celularMostrar = (celularMostrar.length === 9 && celularMostrar.startsWith("9")) ? "0" + celularMostrar : celularMostrar;

                    const htmlTarjeta = `
                        <div class="client-card">
                            <div class="client-info">
                                <h4>${reserva.nombres}</h4>
                                <p>C.I: ${reserva.cedula} | 📞 ${celularMostrar}</p>
                                <p>✉️ ${reserva.correo || 'N/A'}</p>
                                <div class="client-dates">🗓️ ${reserva.ingreso} / ${reserva.salida}</div>
                            </div>
                            <a href="https://wa.me/593${celularMostrar.substring(1)}?text=Hola%20${reserva.nombres}..." target="_blank" class="btn-whatsapp">WhatsApp</a>
                        </div>
                    `;
                    listaTarjetas.insertAdjacentHTML('beforeend', htmlTarjeta);
                }
            });
            renderCalendar(); 
        } catch (error) {
            console.error("Error leyendo BD:", error);
        }
    }

    function mostrarNotificacionCruce(clienteSalida, clienteIngreso) {
        let container = document.querySelector('.toast-container');
        if (!container) {
            container = document.createElement('div');
            container.className = 'toast-container';
            document.body.appendChild(container);
        }
        const toast = document.createElement('div');
        toast.className = 'custom-toast toast-cruce';
        toast.innerHTML = `
            <div class="cruce-header">
                ⚠️ Atención: Día de Recambio
            </div>
            <div class="cruce-body">
                <div class="cruce-box cruce-out">
                    <div class="cruce-label">⬅️ Sale en la mañana</div>
                    <div class="cruce-name">${clienteSalida.nombres}</div>
                </div>
                <div class="cruce-box cruce-in">
                    <div class="cruce-label">➡️ Entra en la tarde</div>
                    <div class="cruce-name">${clienteIngreso.nombres}</div>
                </div>
            </div>
        `;
        container.appendChild(toast);
        setTimeout(() => toast.classList.add('show'), 10);
        setTimeout(() => { toast.classList.remove('show'); setTimeout(() => toast.remove(), 400); }, 5500); 
    }

    function mostrarNotificacionEstandar(titulo, mensaje) {
        let container = document.querySelector('.toast-container');
        if (!container) {
            container = document.createElement('div');
            container.className = 'toast-container';
            document.body.appendChild(container);
        }
        const toast = document.createElement('div');
        toast.className = 'custom-toast';
        toast.innerHTML = `<div class="toast-icon">✅</div><div class="toast-content"><h4>${titulo}</h4><p>${mensaje}</p></div>`;
        container.appendChild(toast);
        setTimeout(() => toast.classList.add('show'), 10);
        setTimeout(() => { toast.classList.remove('show'); setTimeout(() => toast.remove(), 400); }, 4000); 
    }

    function handleDayClick(dateString) {
        const estado = diasEstado[dateString];
        const registros = infoFechasOcupadas[dateString] || [];

        if (registros.length > 0) {
            const ingresos = registros.filter(r => r.tipo === 'ingreso');
            const salidas = registros.filter(r => r.tipo === 'salida');
            const estadias = registros.filter(r => r.tipo === 'estadia');

            if (salidas.length > 0 && ingresos.length > 0) {
                mostrarNotificacionCruce(salidas[0].data, ingresos[0].data);
            } 
            else {
                let mensajeNotif = "";
                registros.forEach(reg => {
                    let nombre = reg.data.nombres || "Sin nombre";
                    if (reg.tipo === 'ingreso') mensajeNotif += `Llegada (Tarde): ${nombre}. `;
                    if (reg.tipo === 'salida') mensajeNotif += `Salida (Mañana): ${nombre}. `;
                    if (reg.tipo === 'estadia') mensajeNotif += `Ocupado por: ${nombre}. `;
                });
                mostrarNotificacionEstandar("Información del día", mensajeNotif);
            }
        }

        if (!checkinDateStr || (checkinDateStr && checkoutDateStr)) {
            if (estado === 'checkin' || estado === 'full' || estado === 'split') {
                if (registros.length === 0) mostrarNotificacionEstandar("Fecha bloqueada", "La tarde de este día ya está reservada.");
                return;
            }
            checkinDateStr = dateString;
            checkoutDateStr = "";
        } else if (checkinDateStr && !checkoutDateStr) {
            if (dateString > checkinDateStr) {
                if (estado === 'checkout' || estado === 'full' || estado === 'split') {
                    if (registros.length === 0) mostrarNotificacionEstandar("Fecha bloqueada", "La mañana de este día está reservada.");
                    return;
                }

                let tieneBloqueo = false;
                let startCheck = new Date(checkinDateStr + 'T12:00:00');
                let endCheck = new Date(dateString + 'T12:00:00');
                startCheck.setDate(startCheck.getDate() + 1);

                while (startCheck < endCheck) {
                    let dStr = startCheck.toISOString().split('T')[0];
                    if (diasEstado[dStr]) {
                        tieneBloqueo = true;
                        break;
                    }
                    startCheck.setDate(startCheck.getDate() + 1);
                }

                if (tieneBloqueo) {
                    mostrarNotificacionEstandar("Rango inválido", "No puedes seleccionar fechas pasando por encima de una reserva existente.");
                    return;
                }

                checkoutDateStr = dateString;
            } else if (dateString < checkinDateStr) {
                if (estado === 'checkin' || estado === 'full' || estado === 'split') {
                    if (registros.length === 0) mostrarNotificacionEstandar("Fecha bloqueada", "La tarde de este día ya está reservada.");
                    return;
                }
                checkinDateStr = dateString;
            } else {
                checkinDateStr = "";
                checkoutDateStr = "";
            }
        }

        if(inputCheckin) inputCheckin.value = checkinDateStr;
        if(inputCheckout) inputCheckout.value = checkoutDateStr;
        renderCalendar();
    }

    inputCheckin.addEventListener('change', (e) => { checkinDateStr = e.target.value; if(checkoutDateStr && checkinDateStr > checkoutDateStr) checkoutDateStr = ""; renderCalendar(); });
    inputCheckout.addEventListener('change', (e) => { checkoutDateStr = e.target.value; if(checkinDateStr && checkoutDateStr < checkinDateStr) checkinDateStr = checkoutDateStr; renderCalendar(); });
    btnPrev.addEventListener('click', () => { currentMonth--; if (currentMonth < 0) { currentMonth = 11; currentYear--; } renderCalendar(); });
    btnNext.addEventListener('click', () => { currentMonth++; if (currentMonth > 11) { currentMonth = 0; currentYear++; } renderCalendar(); });
    
    renderCalendar();
    cargarReservas();

    const formReserva = document.getElementById('form-reserva');
    const btnGuardar = document.getElementById('btn-guardar');
    const btnText = document.getElementById('btn-text');

    formReserva.addEventListener('submit', async (e) => {
        e.preventDefault(); 
        if(!checkinDateStr || !checkoutDateStr) { 
            mostrarNotificacionEstandar("Faltan fechas", "Por favor selecciona fechas en el calendario.");
            return; 
        }

        const nombre = document.getElementById('cliente-nombre').value;
        const cedula = document.getElementById('cliente-cedula').value;
        const correo = document.getElementById('cliente-correo').value;
        const celular = "'" + document.getElementById('cliente-celular').value; 

        btnGuardar.disabled = true; 
        btnText.textContent = "Guardando..."; 
        btnGuardar.style.opacity = "0.7";

        const reservaData = {
            action: "create", nombres: nombre, cedula: cedula, correo: correo || "",
            celular: celular, cabana: "Vista Cotopaxi", ingreso: checkinDateStr, salida: checkoutDateStr
        };

        try {
            await fetch(API_URL, {
                method: "POST", mode: "no-cors", headers: { "Content-Type": "application/json" },
                body: JSON.stringify(reservaData)
            });

            setTimeout(() => { window.location.reload(); }, 1500);
            mostrarNotificacionEstandar("Reserva confirmada", "Registro guardado exitosamente. Actualizando el calendario.");

        } catch (error) { 
            console.error(error);
        } finally { 
            btnGuardar.disabled = false; 
            btnText.textContent = "Confirmar Reserva"; 
            btnGuardar.style.opacity = "1"; 
        }
    });
});
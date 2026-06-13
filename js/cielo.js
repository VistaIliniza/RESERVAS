// =========================================
// CIELO.JS - DETECCIÓN DE FECHAS OCUPADAS AL TOCAR
// =========================================

document.addEventListener('DOMContentLoaded', () => {
    
    // 🔴 NUEVA URL DE LA BASE DE DATOS REAL
    const API_URL = "https://script.google.com/macros/s/AKfycbyHiMKRmedyeaNDs6JEHotpe2Q00Svw_HZg6tHNQwROHz5rz5zCTspoBwoP6A4TFnuk/exec";

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
    
    let fechasOcupadas = []; 
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

            if (fechasOcupadas.includes(dateString)) {
                dayDiv.className = 'cal-day occupied';
                dayDiv.style.cursor = 'pointer';
                dayDiv.addEventListener('click', () => {
                    const datosCliente = infoFechasOcupadas[dateString];
                    
                    // MEJORA: Protección por si el cliente no tiene nombre o número en el Excel
                    let nombreMostrar = datosCliente.nombres || "Sin nombre";
                    let celFormateado = String(datosCliente.celular || "");
                    
                    if(celFormateado.startsWith("'")) celFormateado = celFormateado.substring(1);
                    if(celFormateado.length === 9) celFormateado = "0" + celFormateado;
                    if(celFormateado === "") celFormateado = "Sin número";

                    mostrarNotificacion("Día Reservado 🔒", `Ocupado por: ${nombreMostrar} | Cel: ${celFormateado}`);
                });
            } else {
                dayDiv.className = 'cal-day available';
                if (dateString === checkinDateStr || dateString === checkoutDateStr) dayDiv.classList.add('selected');
                if (checkinDateStr && checkoutDateStr && dateString > checkinDateStr && dateString < checkoutDateStr) dayDiv.classList.add('in-range');
                dayDiv.addEventListener('click', () => handleDayClick(dateString));
            }
            gridDays.appendChild(dayDiv);
        }
    }

    async function cargarReservas() {
        try {
            const respuesta = await fetch(API_URL);
            const datos = await respuesta.json();
            
            const reservasCabaña = datos.filter(reserva => 
                String(reserva.cabana).toLowerCase().includes("cielo")
            );
            
            const listaTarjetas = document.getElementById('lista-tarjetas-clientes');
            
            reservasCabaña.forEach(reserva => {
                if(reserva.ingreso && reserva.salida) {
                    let current = new Date(reserva.ingreso + 'T12:00:00');
                    let end = new Date(reserva.salida + 'T12:00:00');
                    while(current <= end) {
                        let dStr = current.toISOString().split('T')[0];
                        fechasOcupadas.push(dStr);
                        infoFechasOcupadas[dStr] = reserva; 
                        current.setDate(current.getDate() + 1);
                    }
                }
                
                if(listaTarjetas && reserva.nombres) {
                    let celularMostrar = String(reserva.celular);
                    if (celularMostrar.startsWith("'")) celularMostrar = celularMostrar.substring(1);
                    if (celularMostrar.length === 9 && celularMostrar.startsWith("9")) celularMostrar = "0" + celularMostrar;

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

    function handleDayClick(dateString) {
        if (!checkinDateStr || (checkinDateStr && checkoutDateStr)) {
            checkinDateStr = dateString; checkoutDateStr = "";
        } else if (checkinDateStr && !checkoutDateStr) {
            if (dateString > checkinDateStr) { checkoutDateStr = dateString; } 
            else if (dateString < checkinDateStr) { checkoutDateStr = checkinDateStr; checkinDateStr = dateString; } 
            else { checkinDateStr = dateString; }
        }
        inputCheckin.value = checkinDateStr; inputCheckout.value = checkoutDateStr;
        renderCalendar();
    }

    inputCheckin.addEventListener('change', (e) => { checkinDateStr = e.target.value; if(checkoutDateStr && checkinDateStr > checkoutDateStr) checkoutDateStr = ""; renderCalendar(); });
    inputCheckout.addEventListener('change', (e) => { checkoutDateStr = e.target.value; if(checkinDateStr && checkoutDateStr < checkinDateStr) checkinDateStr = checkoutDateStr; renderCalendar(); });
    btnPrev.addEventListener('click', () => { currentMonth--; if (currentMonth < 0) { currentMonth = 11; currentYear--; } renderCalendar(); });
    btnNext.addEventListener('click', () => { currentMonth++; if (currentMonth > 11) { currentMonth = 0; currentYear++; } renderCalendar(); });
    
    renderCalendar();
    cargarReservas();

    function mostrarNotificacion(titulo, mensaje) {
        let container = document.querySelector('.toast-container');
        if (!container) {
            container = document.createElement('div');
            container.className = 'toast-container';
            document.body.appendChild(container);
        }
        
        const toast = document.createElement('div');
        toast.className = 'custom-toast';
        toast.innerHTML = `
            <div class="toast-icon">✅</div>
            <div class="toast-content">
                <h4>${titulo}</h4>
                <p>${mensaje}</p>
            </div>
        `;
        
        container.appendChild(toast);
        
        setTimeout(() => toast.classList.add('show'), 10);
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 400);
        }, 4000); 
    }

    const formReserva = document.getElementById('form-reserva');
    const btnGuardar = document.getElementById('btn-guardar');
    const btnText = document.getElementById('btn-text');

    formReserva.addEventListener('submit', async (e) => {
        e.preventDefault(); 
        if(!checkinDateStr || !checkoutDateStr) { 
            mostrarNotificacion("Faltan fechas", "Por favor selecciona fechas en el calendario.");
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
            action: "create",
            nombres: nombre,
            cedula: cedula,
            correo: correo || "",
            celular: celular,
            cabana: "Vista Cielo",
            ingreso: checkinDateStr,
            salida: checkoutDateStr
        };

        try {
            await fetch(API_URL, {
                method: "POST", mode: "no-cors", headers: { "Content-Type": "application/json" },
                body: JSON.stringify(reservaData)
            });

            let celularMostrar = celular.substring(1);
            if (celularMostrar.length === 9 && celularMostrar.startsWith("9")) celularMostrar = "0" + celularMostrar;

            const htmlTarjeta = `
                <div class="client-card">
                    <div class="client-info">
                        <h4>${nombre}</h4>
                        <p>C.I: ${cedula} | 📞 ${celularMostrar}</p>
                        <p>✉️ ${correo || 'N/A'}</p>
                        <div class="client-dates">🗓️ ${checkinDateStr} / ${checkoutDateStr}</div>
                    </div>
                    <a href="https://wa.me/593${celularMostrar.substring(1)}?text=Hola%20${nombre}..." target="_blank" class="btn-whatsapp">WhatsApp</a>
                </div>
            `;
            document.getElementById('lista-tarjetas-clientes').insertAdjacentHTML('afterbegin', htmlTarjeta);

            let current = new Date(checkinDateStr + 'T12:00:00');
            let end = new Date(checkoutDateStr + 'T12:00:00');
            while(current <= end) {
                let dStr = current.toISOString().split('T')[0];
                fechasOcupadas.push(dStr);
                infoFechasOcupadas[dStr] = {nombres: nombre, celular: celular}; 
                current.setDate(current.getDate() + 1);
            }

            formReserva.reset(); 
            checkinDateStr = ""; 
            checkoutDateStr = ""; 
            renderCalendar(); 
            
            mostrarNotificacion("¡Reserva Confirmada!", `El cliente ${nombre} ha sido guardado exitosamente.`);

        } catch (error) { 
            console.error(error);
        } finally { 
            btnGuardar.disabled = false; 
            btnText.textContent = "Confirmar Reserva"; 
            btnGuardar.style.opacity = "1"; 
        }
    });
});
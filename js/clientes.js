// =========================================
// CLIENTES.JS - EDICIÓN DE FECHAS Y MODALES REALES
// =========================================

document.addEventListener('DOMContentLoaded', () => {

    // 🔴 URL OFICIAL DEL LODGE CONFIGURADA
const API_URL = "https://script.google.com/macros/s/AKfycbyHiMKRmedyeaNDs6JEHotpe2Q00Svw_HZg6tHNQwROHz5rz5zCTspoBwoP6A4TFnuk/exec";
    const tablaBody = document.getElementById('tabla-clientes-body');
    const inputBuscador = document.getElementById('buscador-clientes');
    const emptyState = document.getElementById('empty-state');
    
    const modalEditar = document.getElementById('modal-editar');
    const btnCancelarEdit = document.getElementById('btn-cancelar-edit');
    const formEditar = document.getElementById('form-editar');
    
    const modalBorrar = document.getElementById('modal-borrar');
    const btnCancelarBorrar = document.getElementById('btn-cancelar-borrar');
    const btnConfirmarBorrar = document.getElementById('btn-confirmar-borrar');

    let clientesSistema = [];
    let cedulaABorrar = null;

    // Alertas Flotantes Premium (Toasts)
    function mostrarNotificacion(titulo, mensaje, esError = false) {
        let container = document.querySelector('.toast-container');
        if (!container) {
            container = document.createElement('div');
            container.className = 'toast-container';
            document.body.appendChild(container);
        }
        const toast = document.createElement('div');
        toast.className = 'custom-toast';
        if (esError) {
            toast.style.borderLeftColor = "#ef4444";
            toast.innerHTML = `<div class="toast-icon">🗑️</div><div class="toast-content"><h4>${titulo}</h4><p>${mensaje}</p></div>`;
        } else {
            toast.innerHTML = `<div class="toast-icon">✅</div><div class="toast-content"><h4>${titulo}</h4><p>${mensaje}</p></div>`;
        }
        container.appendChild(toast);
        setTimeout(() => toast.classList.add('show'), 10);
        setTimeout(() => { toast.classList.remove('show'); setTimeout(() => toast.remove(), 400); }, 3500);
    }

    function obtenerIniciales(nombre) {
        if(!nombre || nombre === "Sin dato") return "CL";
        let partes = String(nombre).trim().split(' ');
        if (partes.length >= 2) return (partes[0][0] + partes[1][0]).toUpperCase();
        return partes[0][0].toUpperCase();
    }

    function renderizarTabla(clientes) {
        tablaBody.innerHTML = '';
        if (clientes.length === 0) {
            emptyState.style.display = 'block';
            emptyState.innerHTML = '<p>No se encontraron clientes o está cargando...</p>';
        } else {
            emptyState.style.display = 'none';
            let clientesInvertidos = [...clientes].reverse();

            clientesInvertidos.forEach(cliente => {
                if(!cliente.nombres || cliente.nombres === "") return;
                
                // Formateo estricto del cero a la izquierda
                let celularMostrar = String(cliente.celular);
                if (celularMostrar.startsWith("'")) celularMostrar = celularMostrar.substring(1);
                if (celularMostrar.length === 9 && celularMostrar.startsWith("9")) {
                    celularMostrar = "0" + celularMostrar;
                }

                let tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>
                        <div class="client-profile">
                            <div class="client-avatar">${obtenerIniciales(cliente.nombres)}</div>
                            <div class="client-name">${cliente.nombres}</div>
                        </div>
                    </td>
                    <td class="client-id">${cliente.cedula}</td>
                    <td>
                        <div class="client-name">${celularMostrar}</div>
                        <div class="client-id">${cliente.correo || 'Sin correo'}</div>
                    </td>
                    <td>
                        <div class="client-name">${cliente.cabana}</div>
                        <div class="client-id">${cliente.ingreso} a ${cliente.salida}</div>
                    </td>
                    <td>
                        <div class="action-buttons">
                            <a href="https://wa.me/593${celularMostrar.substring(1)}?text=Hola%20${cliente.nombres},%20nos%20comunicamos%20de%20Vista%20Iliniza..." target="_blank" class="btn-action btn-wsp">WhatsApp</a>
                            <button class="btn-action btn-edit" onclick="abrirModalEditar('${cliente.cedula}')">Editar</button>
                            <button class="btn-action btn-delete" onclick="prepararBorrado('${cliente.cedula}')">Borrar</button>
                        </div>
                    </td>
                `;
                tablaBody.appendChild(tr);
            });
        }
    }

    async function cargarClientesDesdeGoogle() {
        try {
            emptyState.innerHTML = '<p>⏳ Conectando con la base de datos...</p>';
            emptyState.style.display = 'block';
            const respuesta = await fetch(API_URL);
            const datos = await respuesta.json();
            clientesSistema = datos;
            renderizarTabla(clientesSistema);
        } catch (error) {
            emptyState.innerHTML = '<p>❌ Error de conexión. Revisa tu internet.</p>';
        }
    }

    window.prepararBorrado = function(cedula) {
        cedulaABorrar = String(cedula);
        modalBorrar.classList.add('active');
    };

    btnCancelarBorrar.addEventListener('click', () => modalBorrar.classList.remove('active'));
    btnCancelarEdit.addEventListener('click', () => modalEditar.classList.remove('active'));

    btnConfirmarBorrar.addEventListener('click', async () => {
        if(!cedulaABorrar) return;
        
        btnConfirmarBorrar.textContent = "Borrando...";
        btnConfirmarBorrar.disabled = true;

        clientesSistema = clientesSistema.filter(c => String(c.cedula) !== cedulaABorrar);
        renderizarTabla(clientesSistema);
        modalBorrar.classList.remove('active');
        
        try {
            await fetch(API_URL, {
                method: "POST", mode: "no-cors", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "delete", cedula: cedulaABorrar })
            });
            mostrarNotificacion("Cliente Eliminado", "Se borró exitosamente de la base de datos.", true);
        } catch (error) {
            console.error("Error al borrar en BD.");
        } finally {
            btnConfirmarBorrar.textContent = "Sí, Eliminar";
            btnConfirmarBorrar.disabled = false;
            cedulaABorrar = null;
        }
    });

    window.abrirModalEditar = function(cedula) {
        const cliente = clientesSistema.find(c => String(c.cedula) === String(cedula));
        if(cliente) {
            let celularMostrar = String(cliente.celular);
            if (celularMostrar.startsWith("'")) celularMostrar = celularMostrar.substring(1);
            if (celularMostrar.length === 9 && celularMostrar.startsWith("9")) celularMostrar = "0" + celularMostrar;

            document.getElementById('edit-cedula').value = cliente.cedula;
            document.getElementById('edit-nombre').value = cliente.nombres;
            document.getElementById('edit-celular').value = celularMostrar;
            document.getElementById('edit-correo').value = cliente.correo;
            
            // Inyección de fechas al Modal
            document.getElementById('edit-ingreso').value = cliente.ingreso;
            document.getElementById('edit-salida').value = cliente.salida;

            modalEditar.classList.add('active');
        }
    };

    formEditar.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btnSubmit = formEditar.querySelector('button[type="submit"]');
        btnSubmit.textContent = "Guardando...";
        btnSubmit.disabled = true;

        const cedula = document.getElementById('edit-cedula').value;
        const nombreNuevo = document.getElementById('edit-nombre').value;
        const celularNuevo = "'" + document.getElementById('edit-celular').value; 
        const correoNuevo = document.getElementById('edit-correo').value;
        const ingresoNuevo = document.getElementById('edit-ingreso').value;
        const salidaNuevo = document.getElementById('edit-salida').value;

        const datosActualizados = {
            action: "update",
            cedula: cedula,
            nombres: nombreNuevo,
            celular: celularNuevo,
            correo: correoNuevo,
            ingreso: ingresoNuevo,
            salida: salidaNuevo
        };

        try {
            await fetch(API_URL, {
                method: "POST", mode: "no-cors", headers: { "Content-Type": "application/json" },
                body: JSON.stringify(datosActualizados)
            });

            let index = clientesSistema.findIndex(c => String(c.cedula) === String(cedula));
            if(index !== -1) {
                clientesSistema[index].nombres = nombreNuevo;
                clientesSistema[index].celular = celularNuevo;
                clientesSistema[index].correo = correoNuevo;
                clientesSistema[index].ingreso = ingresoNuevo;
                clientesSistema[index].salida = salidaNuevo;
                renderizarTabla(clientesSistema);
            }
            
            modalEditar.classList.remove('active');
            mostrarNotificacion("¡Actualizado!", "Cambios guardados en Excel de forma permanente.");

        } catch(error) {
            mostrarNotificacion("Error", "No se pudo guardar en el Excel.", true);
        } finally {
            btnSubmit.textContent = "Guardar Cambios";
            btnSubmit.disabled = false;
        }
    });

    inputBuscador.addEventListener('input', (e) => {
        const termino = e.target.value.toLowerCase();
        const filtrados = clientesSistema.filter(c => 
            String(c.nombres).toLowerCase().includes(termino) || String(c.cedula).toLowerCase().includes(termino) || 
            String(c.celular).toLowerCase().includes(termino) || String(c.cabana).toLowerCase().includes(termino)
        );
        renderizarTabla(filtrados);
    });

    cargarClientesDesdeGoogle();
});
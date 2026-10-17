// =========================================
// CLIENTES.JS - EDICIÓN, MODALES Y FICHA DE HUÉSPED
// =========================================

document.addEventListener('DOMContentLoaded', () => {

    const API_URL = 'https://script.google.com/macros/s/AKfycbz4pFHwCfKEhodnpHwDAe8ZiPjp6fTMKnD_0WWdV7aXKL7p8Zw_ruuxYP_0l_7HGEMsLw/exec?action=admin';
    
    const tablaBody = document.getElementById('tabla-clientes-body');
    const inputBuscador = document.getElementById('buscador-clientes');
    const emptyState = document.getElementById('empty-state');
    
    const modalEditar = document.getElementById('modal-editar');
    const btnCancelarEdit = document.getElementById('btn-cancelar-edit');
    const formEditar = document.getElementById('form-editar');
    
    const modalBorrar = document.getElementById('modal-borrar');
    const btnCancelarBorrar = document.getElementById('btn-cancelar-borrar');
    const btnConfirmarBorrar = document.getElementById('btn-confirmar-borrar');

    const modalFicha = document.getElementById('modal-ficha');
    const btnCerrarFicha = document.getElementById('btn-cerrar-ficha');
    const btnCerrarFichaAbajo = document.getElementById('btn-cerrar-ficha-abajo');

    let clientesOriginales = [];
    let clientesFiltrados = [];
    let cedulaABorrar = null;

    // Alertas Flotantes
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
        if (!tablaBody) return;
        tablaBody.innerHTML = '';
        clientesFiltrados = clientes;

        if (!clientes || clientes.length === 0) {
            if (emptyState) {
                emptyState.style.display = 'block';
                emptyState.innerHTML = '<p>No se encontraron clientes.</p>';
            }
        } else {
            if (emptyState) emptyState.style.display = 'none';

            clientes.forEach((cliente, index) => {
                if(!cliente.nombres || cliente.nombres === "") return;
                
                let celularMostrar = String(cliente.celular || '');
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
                    <td class="client-id">${cliente.cedula || '-'}</td>
                    <td>
                        <div class="client-name">${celularMostrar || 'Sin celular'}</div>
                        <div class="client-id">${cliente.correo || 'Sin correo'}</div>
                    </td>
                    <td>
                        <div class="client-name">${cliente.cabana || 'Sin cabaña'}</div>
                        <div class="client-id">${cliente.ingreso || '-'} a ${cliente.salida || '-'}</div>
                    </td>
                    <td>
                        <div class="action-buttons">
                            <button type="button" class="btn-action btn-ficha" data-idx="${index}" title="Ver Ficha Completa">👁️ Ficha</button>
                            <a href="https://wa.me/593${celularMostrar.startsWith('0') ? celularMostrar.substring(1) : celularMostrar}?text=Hola%20${encodeURIComponent(cliente.nombres)},%20nos%20comunicamos%20de%20Vista%20Iliniza..." target="_blank" class="btn-action btn-wsp">WhatsApp</a>
                            <button type="button" class="btn-action btn-edit" data-cedula="${cliente.cedula}">Editar</button>
                            <button type="button" class="btn-action btn-delete" data-cedula="${cliente.cedula}">Borrar</button>
                        </div>
                    </td>
                `;
                tablaBody.appendChild(tr);
            });
        }
    }

    async function cargarClientesDesdeGoogle() {
        try {
            if (emptyState) {
                emptyState.innerHTML = '<p>⏳ Conectando con la base de datos...</p>';
                emptyState.style.display = 'block';
            }
            const respuesta = await fetch(API_URL);
            const datos = await respuesta.json();
            // Los más recientes primero
            clientesOriginales = Array.isArray(datos) ? [...datos].reverse() : [];
            renderizarTabla(clientesOriginales);
        } catch (error) {
            console.error('Error al cargar clientes:', error);
            if (emptyState) {
                emptyState.innerHTML = '<p>❌ Error de conexión al cargar la lista.</p>';
            }
        }
    }

    // ==========================================
    // DETECCIÓN DE CLICS EN LA TABLA
    // ==========================================
    if (tablaBody) {
        tablaBody.addEventListener('click', (e) => {
            const btnFicha = e.target.closest('.btn-ficha');
            const btnEdit = e.target.closest('.btn-edit');
            const btnDelete = e.target.closest('.btn-delete');

            if (btnFicha) {
                const idx = parseInt(btnFicha.getAttribute('data-idx'), 10);
                abrirFichaModal(idx);
            } else if (btnEdit) {
                const ced = btnEdit.getAttribute('data-cedula');
                abrirModalEditar(ced);
            } else if (btnDelete) {
                const ced = btnDelete.getAttribute('data-cedula');
                prepararBorrado(ced);
            }
        });
    }

    // ABRIR FICHA DEL HUÉSPED
    function abrirFichaModal(idx) {
        const c = clientesFiltrados[idx];
        if (!c || !modalFicha) return;

        let cel = String(c.celular || '');
        if (cel.startsWith("'")) cel = cel.substring(1);
        if (cel.length === 9 && cel.startsWith("9")) cel = "0" + cel;

        document.getElementById('ficha-nombre').textContent = c.nombres || 'Sin nombre';
        document.getElementById('ficha-subtitulo').textContent = 'Doc: ' + (c.cedula || 'Sin dato');
        document.getElementById('ficha-cabana').textContent = c.cabana || 'No asignada';
        document.getElementById('ficha-hora').textContent = c.horaLlegada || 'No especificada';
        document.getElementById('ficha-fechas').textContent = `${c.ingreso || '-'} hasta ${c.salida || '-'}`;
        document.getElementById('ficha-contacto').textContent = `WhatsApp: ${cel || '-'} | Email: ${c.correo || '-'}`;
        document.getElementById('ficha-adultos').textContent = c.adultos || 'Ninguno adicional';
        document.getElementById('ficha-menores').textContent = c.menores || 'Sin menores';
        document.getElementById('ficha-vehiculo').textContent = c.vehiculo || 'No aplica';
        document.getElementById('ficha-mascota').textContent = c.mascota || 'No';

        modalFicha.classList.add('active');
    }

    function cerrarModalFicha() {
        if (modalFicha) modalFicha.classList.remove('active');
    }

    if (btnCerrarFicha) btnCerrarFicha.addEventListener('click', cerrarModalFicha);
    if (btnCerrarFichaAbajo) btnCerrarFichaAbajo.addEventListener('click', cerrarModalFicha);
    if (modalFicha) {
        modalFicha.addEventListener('click', (e) => {
            if (e.target === modalFicha) cerrarModalFicha();
        });
    }

    // ==========================================
    // BORRADO Y EDICIÓN
    // ==========================================
    function prepararBorrado(cedula) {
        cedulaABorrar = String(cedula);
        if (modalBorrar) modalBorrar.classList.add('active');
    }

    if (btnCancelarBorrar) btnCancelarBorrar.addEventListener('click', () => modalBorrar && modalBorrar.classList.remove('active'));
    if (btnCancelarEdit) btnCancelarEdit.addEventListener('click', () => modalEditar && modalEditar.classList.remove('active'));

    if (btnConfirmarBorrar) {
        btnConfirmarBorrar.addEventListener('click', async () => {
            if(!cedulaABorrar) return;
            
            btnConfirmarBorrar.textContent = "Borrando...";
            btnConfirmarBorrar.disabled = true;

            clientesOriginales = clientesOriginales.filter(c => String(c.cedula) !== cedulaABorrar);
            renderizarTabla(clientesOriginales);
            if (modalBorrar) modalBorrar.classList.remove('active');
            
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
    }

    function abrirModalEditar(cedula) {
        const cliente = clientesOriginales.find(c => String(c.cedula).trim() === String(cedula).trim());
        if(cliente && modalEditar) {
            let celularMostrar = String(cliente.celular || '');
            if (celularMostrar.startsWith("'")) celularMostrar = celularMostrar.substring(1);
            if (celularMostrar.length === 9 && celularMostrar.startsWith("9")) celularMostrar = "0" + celularMostrar;

            document.getElementById('edit-cedula').value = cliente.cedula || '';
            document.getElementById('edit-nombre').value = cliente.nombres || '';
            document.getElementById('edit-celular').value = celularMostrar;
            document.getElementById('edit-correo').value = cliente.correo || '';
            document.getElementById('edit-ingreso').value = cliente.ingreso || '';
            document.getElementById('edit-salida').value = cliente.salida || '';

            modalEditar.classList.add('active');
        }
    }

    if (formEditar) {
        formEditar.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btnSubmit = formEditar.querySelector('button[type="submit"]');
            if (btnSubmit) {
                btnSubmit.textContent = "Guardando...";
                btnSubmit.disabled = true;
            }

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

                let index = clientesOriginales.findIndex(c => String(c.cedula).trim() === String(cedula).trim());
                if(index !== -1) {
                    clientesOriginales[index].nombres = nombreNuevo;
                    clientesOriginales[index].celular = celularNuevo;
                    clientesOriginales[index].correo = correoNuevo;
                    clientesOriginales[index].ingreso = ingresoNuevo;
                    clientesOriginales[index].salida = salidaNuevo;
                    renderizarTabla(clientesOriginales);
                }
                
                if (modalEditar) modalEditar.classList.remove('active');
                mostrarNotificacion("¡Actualizado!", "Cambios guardados en Excel de forma permanente.");

            } catch(error) {
                mostrarNotificacion("Error", "No se pudo guardar en el Excel.", true);
            } finally {
                if (btnSubmit) {
                    btnSubmit.textContent = "Guardar Cambios";
                    btnSubmit.disabled = false;
                }
            }
        });
    }

    if (inputBuscador) {
        inputBuscador.addEventListener('input', (e) => {
            const termino = e.target.value.toLowerCase();
            const filtrados = clientesOriginales.filter(c => 
                String(c.nombres || '').toLowerCase().includes(termino) || 
                String(c.cedula || '').toLowerCase().includes(termino) || 
                String(c.celular || '').toLowerCase().includes(termino) || 
                String(c.cabana || '').toLowerCase().includes(termino)
            );
            renderizarTabla(filtrados);
        });
    }

    cargarClientesDesdeGoogle();
});

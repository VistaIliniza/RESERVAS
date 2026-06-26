// =========================================
// LOGIN.JS - CONTROL DE ACCESO SEGURO VÍA GET
// =========================================

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const errorAlert = document.getElementById('error-alert');
    const btnSubmit = document.querySelector('.btn-login');

    // Nueva URL de la implementación configurada
    const API_URL = "https://script.google.com/macros/s/AKfycbz4pFHwCfKEhodnpHwDAe8ZiPjp6fTMKnD_0WWdV7aXKL7p8Zw_ruuxYP_0l_7HGEMsLw/exec";

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const userIn = document.getElementById('username').value.trim();
            const passIn = document.getElementById('password').value.trim();

            const originalText = btnSubmit.textContent;
            btnSubmit.textContent = "Verificando...";
            btnSubmit.disabled = true;
            errorAlert.style.display = "none";

            // armamos la url con los datos para mandarlos por GET y evitar el bloqueo cors
            const urlLogin = `${API_URL}?action=login&usuario=${encodeURIComponent(userIn)}&password=${encodeURIComponent(passIn)}`;

            try {
                const response = await fetch(urlLogin, {
                    method: "GET"
                });

                const result = await response.json();

                if (result.status === "success") {
                    sessionStorage.setItem('sesion_activa', 'true');
                    window.location.href = "index.html";
                } else {
                    errorAlert.textContent = "Usuario o contraseña incorrectos.";
                    errorAlert.style.display = "block";
                    document.getElementById('password').value = "";
                }
            } catch (error) {
                console.error("Error en la conexión:", error);
                errorAlert.textContent = "Problema de conexión con el servidor. Intenta de nuevo.";
                errorAlert.style.display = "block";
            } finally {
                btnSubmit.textContent = originalText;
                btnSubmit.disabled = false;
            }
        });
    }
});
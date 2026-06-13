// =========================================
// LOGIN.JS - CONTROL DE ACCESO DE SEGURIDAD
// =========================================

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const errorAlert = document.getElementById('error-alert');

    // AQUÍ DEFINIMOS TUS CREDENCIALES EXACTAS
    const USUARIO_VALIDO = "administracion";
    const CONTRASEÑA_VALIDA = "iliniza2026";

    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            // Evita que la página se recargue al darle al botón
            e.preventDefault();

            // Capturamos lo que el usuario escribió quitando espacios en blanco a los lados
            const userIn = document.getElementById('username').value.trim();
            const passIn = document.getElementById('password').value.trim();

            // Comparamos si es exactamente igual
            if (userIn === USUARIO_VALIDO && passIn === CONTRASEÑA_VALIDA) {
                
                // ¡Éxito! Guardamos un "token" en la memoria temporal del navegador
                // Esto es lo que usaremos luego para saber si el usuario de verdad inició sesión
                sessionStorage.setItem('sesion_activa', 'true');
                
                // Lo enviamos a la página principal del sistema
                window.location.href = "index.html";
                
            } else {
                // ¡Error! Mostramos el mensaje rojo que estaba oculto
                errorAlert.style.display = "block";
                
                // Borramos la contraseña para que tenga que escribirla de nuevo
                document.getElementById('password').value = "";
            }
        });
    }
});
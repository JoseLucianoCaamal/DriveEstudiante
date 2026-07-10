const URL_API = 'https://expressed-anna-brian-seattle.trycloudflare.com/api';
let currentPath = '/';

function getToken() { return localStorage.getItem('akkoToken') || ''; }
function isLoggedIn() { return !!getToken(); }

function getHeaders(esUpload = false) {
    const headers = { 'x-admin-token': getToken() };
    if (!esUpload) headers['Content-Type'] = 'application/json';
    return headers;
}

window.onpopstate = function(event) {
    cargarArchivos(event.state ? event.state.path : '/', false);
};

// Función para mostrar/ocultar botones dependiendo del Login
function actualizarUI() {
    const btn = document.getElementById('loginBtn');
    const privacyControl = document.getElementById('privacyControl');
    
    if (isLoggedIn()) {
        if (btn) btn.innerText = "Cerrar Sesión";
        // Mostramos el switch de privacidad
        if (privacyControl) privacyControl.style.display = "flex";
    } else {
        if (btn) btn.innerText = "Login AKKO";
        // Ocultamos el switch de privacidad
        if (privacyControl) privacyControl.style.display = "none";
        
        // Reseteamos el switch a "Público" por seguridad al cerrar sesión
        const toggle = document.getElementById('privacyToggle');
        if(toggle) toggle.checked = false;
    }
}

async function init() {
    actualizarUI();
    cargarArchivos('/', true);
}

async function toggleLogin() {
    if (isLoggedIn()) {
        localStorage.removeItem('akkoToken');
        actualizarUI();
        alert("Sesión cerrada en este dispositivo");
    } else {
        const username = prompt("Usuario:");
        const password = prompt("Contraseña:");
        if (!username || !password) return;
        
        const res = await fetch(`${URL_API}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        const data = await res.json();
        
        if (data.success) {
            localStorage.setItem('akkoToken', data.token);
            actualizarUI();
            alert("Bienvenido AKKO");
        } else { alert("Acceso denegado"); }
    }
    cargarArchivos(currentPath);
}

async function cargarArchivos(ruta = '/', pushHistory = true) {
    currentPath = ruta;
    if (pushHistory) history.pushState({ path: ruta }, '', '');

    const lista = document.getElementById('fileList');
    lista.innerHTML = '<li>Cargando...</li>';
    try {
        const res = await fetch(`${URL_API}/files?ruta=${encodeURIComponent(ruta)}&t=${Date.now()}`, {
            headers: getHeaders()
        });
        const archivos = await res.json();
        lista.innerHTML = '';

        if (ruta !== '/') {
            lista.innerHTML += `<li onclick="cargarArchivos('/')" style="cursor:pointer; color:#6366f1;">⬅️ Volver a la raíz</li>`;
        }

        archivos.forEach(a => {
            const li = document.createElement('li');
            const icon = a.esCarpeta ? '📁' : '📄';
            
            const urlDescarga = `${URL_API.replace('/api', '')}/uploads/${encodeURIComponent(a.nombre)}`;
            const urlZip = `${URL_API}/download-folder?nombre=${encodeURIComponent(a.nombre)}`;

            const nombreElement = a.esCarpeta 
                ? `<span onclick="cargarArchivos('${a.nombre}')" style="cursor:pointer; font-weight: 600;">${a.nombre}</span>`
                : `<a href="${urlDescarga}" target="_blank" style="color:white; text-decoration:none;"><div class="file-name">${a.nombre}</div></a>`;

            li.innerHTML = `
                <span style="font-size: 20px; margin-right: 15px;">${icon}</span>
                <div style="flex-grow: 1; overflow: hidden;">${nombreElement}</div>
                <div style="display: flex; gap: 8px;">
                    ${a.esCarpeta ? `<a href="${urlZip}"><button class="btn-zip">⬇️ ZIP</button></a>` : `<a href="${urlDescarga}" download><button class="btn-icon">⬇️</button></a>`}
                    ${isLoggedIn() ? `
                        <button class="btn-icon" onclick="renombrar(${a.id}, '${a.nombre.replace(/'/g, "\\'")}')">✏️</button>
                        <button class="btn-icon" onclick="borrar(${a.id})">🗑️</button>
                    ` : ''}
                </div>
            `;
            lista.appendChild(li);
        });
    } catch (e) { lista.innerHTML = '<li>Error de conexión</li>'; }
}

async function subirArchivo() {
    const fileInput = document.getElementById('fileInput');
    const statusDiv = document.getElementById('status');
    if (fileInput.files.length === 0) return alert('Selecciona archivos.');
    if (statusDiv) statusDiv.innerText = 'Subiendo...';
    
    // Leemos silenciosamente la posición del Switch
    const toggle = document.getElementById('privacyToggle');
    const esPrivada = (isLoggedIn() && toggle && toggle.checked);
    
    for (let i = 0; i < fileInput.files.length; i++) {
        const formData = new FormData();
        formData.append('archivoEstudiante', fileInput.files[i]);
        formData.append('rutaPadre', currentPath);
        formData.append('esPrivada', esPrivada ? '1' : '0'); 
        
        await fetch(`${URL_API}/upload`, { 
            method: 'POST', 
            headers: getHeaders(true), 
            body: formData 
        });
    }
    
    fileInput.value = '';
    if (statusDiv) statusDiv.innerText = '';
    cargarArchivos(currentPath);
}

async function crearCarpeta() {
    const nombre = prompt("Nombre de la carpeta:");
    if (!nombre) return;
    
    // Leemos silenciosamente la posición del Switch
    const toggle = document.getElementById('privacyToggle');
    const esPrivada = (isLoggedIn() && toggle && toggle.checked);
    
    await fetch(`${URL_API}/create-folder`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ nombre, rutaPadre: currentPath, esPrivada: esPrivada ? 1 : 0 })
    });
    cargarArchivos(currentPath);
}

async function borrar(id) {
    if(confirm('¿Borrar definitivamente?')) {
        await fetch(`${URL_API}/delete/${id}`, { method: 'DELETE', headers: getHeaders() });
        cargarArchivos(currentPath);
    }
}

async function renombrar(id, actual) {
    const nuevo = prompt("Nuevo nombre:", actual);
    if (nuevo) {
        await fetch(`${URL_API}/rename/${id}`, { 
            method: 'PATCH', headers: getHeaders(),
            body: JSON.stringify({ nuevoNombre: nuevo }) 
        });
        cargarArchivos(currentPath);
    }
}

init();
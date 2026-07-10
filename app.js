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

function mostrarAlerta(mensaje) {
    document.getElementById('alertMessage').innerText = mensaje;
    document.getElementById('alertModal').style.display = 'flex';
}

function actualizarUI() {
    const btn = document.getElementById('loginBtn');
    if (isLoggedIn()) {
        if (btn) btn.innerText = "Cerrar Sesión";
    } else {
        if (btn) btn.innerText = "Login";
    }
}

async function init() {
    actualizarUI();
    cargarArchivos('/', true);
}

function toggleLogin() {
    if (isLoggedIn()) {
        localStorage.removeItem('akkoToken');
        actualizarUI();
        mostrarAlerta("Sesión cerrada en este dispositivo"); 
        cargarArchivos(currentPath);
    } else {
        document.getElementById('loginModal').style.display = 'flex';
        document.getElementById('usernameInput').value = '';
        document.getElementById('passwordInput').value = '';
        document.getElementById('usernameInput').focus();
    }
}

function cerrarModalLogin() { document.getElementById('loginModal').style.display = 'none'; }

async function procesarLogin() {
    const username = document.getElementById('usernameInput').value;
    const password = document.getElementById('passwordInput').value;
    if (!username || !password) return;
    document.getElementById('confirmLoginBtn').innerText = '...';
    const res = await fetch(`${URL_API}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
    });
    const data = await res.json();
    document.getElementById('confirmLoginBtn').innerText = 'Aceptar';
    if (data.success) {
        localStorage.setItem('akkoToken', data.token);
        cerrarModalLogin();
        actualizarUI();
        cargarArchivos(currentPath);
    } else { mostrarAlerta("Acceso denegado"); }
}

async function cargarArchivos(ruta = '/', pushHistory = true) {
    currentPath = ruta;
    if (pushHistory) history.pushState({ path: ruta }, '', '');
    const lista = document.getElementById('fileList');
    lista.innerHTML = '<li>Cargando...</li>';
    try {
        const res = await fetch(`${URL_API}/files?ruta=${encodeURIComponent(ruta)}&t=${Date.now()}`, { headers: getHeaders() });
        const archivos = await res.json();
        lista.innerHTML = '';
        if (ruta !== '/') {
            lista.innerHTML += `<li onclick="cargarArchivos('/')" style="cursor:pointer; color:#6366f1; padding: 5px 0;">⬅️ Volver a la raíz</li>`;
        }
        archivos.forEach(a => {
            const li = document.createElement('li');
            li.style.display = 'flex'; li.style.flexWrap = 'wrap'; li.style.alignItems = 'center'; li.style.justifyContent = 'space-between'; li.style.gap = '10px';
            const icon = a.esCarpeta ? '📁' : '📄';
            const urlDescarga = `${URL_API.replace('/api', '')}/uploads/${encodeURIComponent(a.nombre)}`;
            const urlZip = `${URL_API}/download-folder?nombre=${encodeURIComponent(a.nombre)}`;
            const nombreElement = a.esCarpeta 
                ? `<span onclick="cargarArchivos('${a.nombre}')" style="cursor:pointer; font-weight: 600; word-break: break-word;">${a.nombre}</span>`
                : `<a href="${urlDescarga}" target="_blank" style="color:white; text-decoration:none; word-break: break-word;"><div class="file-name">${a.nombre}</div></a>`;
            const btnPrivacidad = isLoggedIn() ? `
                <label class="switch" style="transform: scale(0.65); margin: 0 -8px;" title="${a.esPrivada ? 'Hacer Público' : 'Hacer Privado'}">
                    <input type="checkbox" ${a.esPrivada ? 'checked' : ''} onchange="cambiarPrivacidad(${a.id}, ${a.esPrivada})">
                    <span class="slider round"></span>
                </label>` : '';
            li.innerHTML = `
                <div style="display: flex; align-items: center; flex: 1; min-width: 120px;">
                    <span style="font-size: 20px; margin-right: 15px;">${icon}</span>
                    <div style="flex-grow: 1; overflow: hidden;">${nombreElement}</div>
                </div>
                <div style="display: flex; gap: 6px; align-items: center; flex-wrap: wrap; justify-content: flex-end;">
                    ${btnPrivacidad}
                    ${a.esCarpeta ? `<a href="${urlZip}"><button class="btn-zip">⬇️ ZIP</button></a>` : `<a href="${urlDescarga}" download><button class="btn-icon">⬇️</button></a>`}
                    ${isLoggedIn() ? `
                        <button class="btn-icon" onclick="renombrar(${a.id}, '${a.nombre.replace(/'/g, "\\'")}')">✏️</button>
                        <button class="btn-icon" onclick="borrar(${a.id})">🗑️</button>` : ''}
                </div>`;
            lista.appendChild(li);
        });
    } catch (e) { lista.innerHTML = '<li>Error de conexión</li>'; }
}

function crearCarpeta() {
    document.getElementById('folderModal').style.display = 'flex';
    document.getElementById('folderNameInput').value = '';
    document.getElementById('folderNameInput').focus();
}

async function procesarCrearCarpeta() {
    const nombre = document.getElementById('folderNameInput').value;
    if (!nombre) return;
    document.getElementById('folderModal').style.display = 'none';
    await fetch(`${URL_API}/create-folder`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ nombre, rutaPadre: currentPath, esPrivada: 0 }) 
    });
    cargarArchivos(currentPath);
}

async function subirArchivo() {
    const fileInput = document.getElementById('fileInput');
    const statusDiv = document.getElementById('status');
    if (fileInput.files.length === 0) return mostrarAlerta('Selecciona archivos.');
    if (statusDiv) statusDiv.innerText = 'Subiendo...';
    for (let i = 0; i < fileInput.files.length; i++) {
        const formData = new FormData();
        formData.append('archivoEstudiante', fileInput.files[i]);
        formData.append('rutaPadre', currentPath);
        formData.append('esPrivada', '0'); 
        await fetch(`${URL_API}/upload`, { method: 'POST', headers: getHeaders(true), body: formData });
    }
    fileInput.value = '';
    if (statusDiv) statusDiv.innerText = '';
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
        await fetch(`${URL_API}/rename/${id}`, { method: 'PATCH', headers: getHeaders(), body: JSON.stringify({ nuevoNombre: nuevo }) });
        cargarArchivos(currentPath);
    }
}

async function cambiarPrivacidad(id, estadoActual) {
    const nuevoEstado = estadoActual ? 0 : 1; 
    await fetch(`${URL_API}/toggle-privacy/${id}`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify({ esPrivada: nuevoEstado })
    });
    cargarArchivos(currentPath); 
}

init();
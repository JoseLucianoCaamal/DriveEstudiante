const URL_API = 'https://expressed-anna-brian-seattle.trycloudflare.com/api';
let currentPath = '/';

function getToken() { return localStorage.getItem('akkoToken') || ''; }
function getUsername() { return localStorage.getItem('akkoUser') || ''; }
function isLoggedIn() { return !!getToken(); }

function getHeaders(esUpload = false) {
    const headers = { 
        'x-admin-token': getToken(),
        'x-username': getUsername() 
    };
    if (!esUpload) headers['Content-Type'] = 'application/json';
    return headers;
}

window.onpopstate = function(event) {
    cargarArchivos(event.state ? event.state.path : '/', false);
};

function mostrarAlerta(m) { document.getElementById('alertMessage').innerText = m; document.getElementById('alertModal').style.display = 'flex'; }

function actualizarUI() {
    const btn = document.getElementById('loginBtn');
    const adminBtn = document.getElementById('adminBtn');
    const token = getToken();
    
    if (isLoggedIn()) {
        btn.innerText = "Cerrar Sesión";
        adminBtn.style.display = (token === "TOKEN_AKKO_PRO_2026") ? "block" : "none";
    } else {
        btn.innerText = "Login";
        adminBtn.style.display = "none";
    }
}

// --- GESTIÓN DE USUARIOS (ADMIN) ---
async function abrirAdmin() {
    document.getElementById('adminModal').style.display = 'flex';
    const res = await fetch(`${URL_API}/usuarios`, { headers: getHeaders() });
    const users = await res.json();
    document.getElementById('userList').innerHTML = users.map(u => `
        <li style="display:flex; justify-content:space-between; margin-bottom: 8px;">
            ${u.username} <button onclick="eliminarUsuario(${u.id})" class="btn-icon">🗑️</button>
        </li>`).join('');
}

async function crearUsuario() {
    const username = document.getElementById('newUsername').value;
    const password = document.getElementById('newPassword').value;
    await fetch(`${URL_API}/usuarios/crear`, {
        method: 'POST', headers: getHeaders(),
        body: JSON.stringify({ username, password })
    });
    abrirAdmin();
}

async function eliminarUsuario(id) {
    await fetch(`${URL_API}/usuarios/${id}`, { method: 'DELETE', headers: getHeaders() });
    abrirAdmin();
}

// --- LOGIN Y SESIÓN ---
function toggleLogin() {
    if (isLoggedIn()) {
        localStorage.removeItem('akkoToken');
        localStorage.removeItem('akkoUser');
        actualizarUI();
        mostrarAlerta("Sesión cerrada");
        cargarArchivos('/');
    } else { document.getElementById('loginModal').style.display = 'flex'; }
}

function cerrarModalLogin() { document.getElementById('loginModal').style.display = 'none'; }

async function procesarLogin() {
    const username = document.getElementById('usernameInput').value;
    const password = document.getElementById('passwordInput').value;
    const res = await fetch(`${URL_API}/login`, { 
        method: 'POST', 
        headers: {'Content-Type': 'application/json'}, 
        body: JSON.stringify({ username, password })
    });
    const data = await res.json();
    
    if (data.success) {
        localStorage.setItem('akkoToken', data.token);
        localStorage.setItem('akkoUser', username);
        cerrarModalLogin();
        actualizarUI();
        cargarArchivos('/');
    } else { mostrarAlerta("Acceso denegado"); }
}

// --- ARCHIVOS Y CARPETAS ---
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
            li.style.display = 'flex'; li.style.alignItems = 'center'; li.style.justifyContent = 'space-between';
            const icon = a.esCarpeta ? '📁' : '📄';
            const urlDescarga = `${URL_API.replace('/api', '')}/uploads/${encodeURIComponent(a.nombre)}`;
            
            const btnPrivacidad = isLoggedIn() ? `
                <label class="switch" style="transform: scale(0.65); margin: 0 -8px;" title="${a.esPrivada ? 'Hacer Público' : 'Hacer Privado'}">
                    <input type="checkbox" ${a.esPrivada ? 'checked' : ''} onchange="cambiarPrivacidad(${a.id}, ${a.esPrivada})">
                    <span class="slider round"></span>
                </label>` : '';

            li.innerHTML = `
                <div style="display: flex; align-items: center; flex: 1;">
                    <span style="font-size: 20px; margin-right: 10px;">${icon}</span>
                    <span onclick="cargarArchivos('${a.nombre}')" style="cursor:pointer;">${a.nombre}</span>
                </div>
                <div style="display: flex; align-items: center; gap: 5px;">
                    ${btnPrivacidad}
                    <a href="${urlDescarga}" download><button class="btn-icon">⬇️</button></a>
                    <button class="btn-icon" onclick="renombrar(${a.id}, '${a.nombre.replace(/'/g, "\\'")}')">✏️</button>
                    <button class="btn-icon" onclick="borrar(${a.id})">🗑️</button>
                </div>`;
            lista.appendChild(li);
        });
    } catch (e) { lista.innerHTML = '<li>Error de conexión</li>'; }
}

async function crearCarpeta() {
    document.getElementById('folderModal').style.display = 'flex';
}

async function procesarCrearCarpeta() {
    const nombre = document.getElementById('folderNameInput').value;
    if (!nombre) return;
    document.getElementById('folderModal').style.display = 'none';
    await fetch(`${URL_API}/create-folder`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ nombre, rutaPadre: currentPath }) 
    });
    cargarArchivos(currentPath);
}

async function subirArchivo() {
    const fileInput = document.getElementById('fileInput');
    if (fileInput.files.length === 0) return mostrarAlerta('Selecciona archivos.');
    for (let i = 0; i < fileInput.files.length; i++) {
        const formData = new FormData();
        formData.append('archivoEstudiante', fileInput.files[i]);
        formData.append('rutaPadre', currentPath);
        await fetch(`${URL_API}/upload`, { method: 'POST', headers: getHeaders(true), body: formData });
    }
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

async function init() {
    actualizarUI();
    cargarArchivos('/', true);
}

init();
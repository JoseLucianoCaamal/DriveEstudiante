const URL_API = 'https://expressed-anna-brian-seattle.trycloudflare.com/api';
let currentPath = '/';
let isLoggedIn = false;

// 1. Navegación en el celular (Evita que se cierre la app)
window.onpopstate = function(event) {
    cargarArchivos(event.state ? event.state.path : '/', false);
};

// 2. Estado de Sesión Inicial
async function init() {
    try {
        const res = await fetch(`${URL_API}/check-session`);
        const data = await res.json();
        isLoggedIn = data.loggedIn;
        const btn = document.getElementById('loginBtn');
        if (btn) btn.innerText = isLoggedIn ? "Cerrar Sesión" : "Login";
    } catch (e) { console.error("Servidor offline"); }
    cargarArchivos('/', true);
}

// 3. Botón Login/Logout
async function toggleLogin() {
    const btn = document.getElementById('loginBtn');
    if (isLoggedIn) {
        await fetch(`${URL_API}/logout`, { method: 'POST' });
        isLoggedIn = false;
        btn.innerText = "Login";
        alert("Sesión cerrada");
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
            isLoggedIn = true;
            btn.innerText = "Cerrar Sesión";
            alert("Bienvenido");
        } else { alert("Acceso denegado"); }
    }
    cargarArchivos(currentPath);
}

// 4. Renderizado Completo de Archivos
async function cargarArchivos(ruta = '/', pushHistory = true) {
    currentPath = ruta;
    if (pushHistory) history.pushState({ path: ruta }, '', '');

    const lista = document.getElementById('fileList');
    lista.innerHTML = '<li>Cargando...</li>';
    try {
        const res = await fetch(`${URL_API}/files?ruta=${encodeURIComponent(ruta)}&t=${Date.now()}`);
        const archivos = await res.json();
        lista.innerHTML = '';

        if (ruta !== '/') {
            lista.innerHTML += `<li onclick="cargarArchivos('/')" style="cursor:pointer; color:#6366f1;">⬅️ Volver a la raíz</li>`;
        }

        archivos.forEach(a => {
            const li = document.createElement('li');
            const icon = a.esCarpeta ? '📁' : '📄';
            
            // URLs restauradas para descargas y visualización
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
                    ${isLoggedIn ? `
                        <button class="btn-icon" onclick="renombrar(${a.id}, '${a.nombre.replace(/'/g, "\\'")}')">✏️</button>
                        <button class="btn-icon" onclick="borrar(${a.id})">🗑️</button>
                    ` : ''}
                </div>
            `;
            lista.appendChild(li);
        });
    } catch (e) { lista.innerHTML = '<li>Error de conexión</li>'; }
}

// 5. Acciones Completas
async function subirArchivo() {
    const fileInput = document.getElementById('fileInput');
    const statusDiv = document.getElementById('status');
    if (fileInput.files.length === 0) return alert('Selecciona archivos.');
    if (statusDiv) statusDiv.innerText = 'Subiendo...';
    
    for (let i = 0; i < fileInput.files.length; i++) {
        const formData = new FormData();
        formData.append('archivoEstudiante', fileInput.files[i]);
        formData.append('rutaPadre', currentPath);
        await fetch(`${URL_API}/upload`, { method: 'POST', body: formData });
    }
    
    fileInput.value = '';
    if (statusDiv) statusDiv.innerText = '';
    cargarArchivos(currentPath);
}

async function crearCarpeta() {
    const nombre = prompt("Nombre de la carpeta:");
    if (!nombre) return;
    
    let esPrivada = false;
    // Solo permitimos hacer privada si estás logueado
    if (isLoggedIn) {
        esPrivada = confirm("¿Hacer esta carpeta PRIVADA (solo para AKKO)?");
    }
    
    await fetch(`${URL_API}/create-folder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre, rutaPadre: currentPath, esPrivada: esPrivada ? 1 : 0 })
    });
    cargarArchivos(currentPath);
}

async function borrar(id) {
    if(confirm('¿Borrar definitivamente?')) {
        await fetch(`${URL_API}/delete/${id}`, { method: 'DELETE' });
        cargarArchivos(currentPath);
    }
}

async function renombrar(id, actual) {
    const nuevo = prompt("Nuevo nombre:", actual);
    if (nuevo) {
        await fetch(`${URL_API}/rename/${id}`, { 
            method: 'PATCH', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nuevoNombre: nuevo }) 
        });
        cargarArchivos(currentPath);
    }
}

// Inicializar la app
init();
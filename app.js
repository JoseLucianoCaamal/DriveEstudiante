const URL_API = 'https://requiring-andrews-inherited-stuffed.trycloudflare.com/api';
const MI_TOKEN = "AKKO_BOSS_2026";
let currentPath = '/';

// Permisos y Navegación
async function fetchConToken(url, options = {}) {
    options.headers = { ...options.headers, 'x-admin-token': MI_TOKEN };
    return await fetch(url, options);
}

window.onpopstate = function(event) {
    cargarArchivos(event.state ? event.state.path : '/', false);
};

async function cargarArchivos(ruta = '/', pushHistory = true) {
    currentPath = ruta;
    if (pushHistory) history.pushState({ path: ruta }, '', '');
    
    const lista = document.getElementById('fileList');
    lista.innerHTML = '<li>Cargando...</li>';
    
    try {
        const res = await fetchConToken(`${URL_API}/files?ruta=${encodeURIComponent(ruta)}&t=${Date.now()}`);
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
                    <button class="btn-icon" onclick="renombrar(${a.id}, '${a.nombre.replace(/'/g, "\\'")}')">✏️</button>
                    <button class="btn-icon" onclick="borrar(${a.id})">🗑️</button>
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
    statusDiv.innerText = 'Subiendo...';
    for (let i = 0; i < fileInput.files.length; i++) {
        const formData = new FormData();
        formData.append('archivoEstudiante', fileInput.files[i]);
        formData.append('rutaPadre', currentPath);
        await fetchConToken(`${URL_API}/upload`, { method: 'POST', body: formData });
    }
    fileInput.value = ''; statusDiv.innerText = ''; cargarArchivos(currentPath);
}

async function borrar(id) {
    if(confirm('¿Borrar?')) {
        await fetchConToken(`${URL_API}/delete/${id}`, { method: 'DELETE' });
        cargarArchivos(currentPath);
    }
}

async function renombrar(id, actual) {
    const nuevo = prompt("Nuevo nombre:", actual);
    if (nuevo) {
        await fetchConToken(`${URL_API}/rename/${id}`, { 
            method: 'PATCH', headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ nuevoNombre: nuevo }) 
        });
        cargarArchivos(currentPath);
    }
}

async function crearCarpeta() {
    const nombre = prompt("Nombre de la carpeta:");
    if (!nombre) return;
    await fetchConToken(`${URL_API}/create-folder`, {
        method: 'POST', headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ nombre, rutaPadre: currentPath })
    });
    cargarArchivos(currentPath);
}

cargarArchivos('/');
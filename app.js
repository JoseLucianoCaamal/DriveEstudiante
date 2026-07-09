const URL_API = 'https://requiring-andrews-inherited-stuffed.trycloudflare.com/api';
let currentPath = '/';

async function cargarArchivos(ruta = '/') {
    currentPath = ruta;
    const lista = document.getElementById('fileList');
    lista.innerHTML = '<li>Cargando...</li>';
    
    try {
        // Se añade &t=${Date.now()} para evitar caché en móviles
        const res = await fetch(`${URL_API}/files?ruta=${encodeURIComponent(ruta)}&t=${Date.now()}`, { cache: 'no-store' });
        const archivos = await res.json();
        lista.innerHTML = '';
        
        if (ruta !== '/') {
            lista.innerHTML += `<li onclick="cargarArchivos('/')" style="cursor:pointer; color:#6366f1;">⬅️ Volver a la raíz</li>`;
        }

        archivos.forEach(a => {
            const li = document.createElement('li');
            const icon = a.esCarpeta ? '📁' : '📄';
            
            // Estructura moderna con clases CSS btn-icon y btn-zip
            li.innerHTML = `
                <span style="font-size: 20px; margin-right: 15px;">${icon}</span>
                <div style="flex-grow: 1;">
                    <span onclick="${a.esCarpeta ? `cargarArchivos('${a.nombre}')` : ''}" 
                          style="cursor:pointer; font-weight: 600;">${a.nombre}</span>
                </div>
                <div style="display: flex; gap: 8px;">
                    ${a.esCarpeta ? 
                        `<a href="${URL_API.replace('/api', '')}/download-folder/${encodeURIComponent(a.nombre)}"><button class="btn-zip">⬇️ ZIP</button></a>` : 
                        `<a href="${URL_API.replace('/api', '')}/uploads/${encodeURIComponent(a.nombre)}" download><button class="btn-icon">⬇️</button></a>`
                    }
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
        await fetch(`${URL_API}/upload`, { method: 'POST', body: formData });
    }
    
    fileInput.value = ''; 
    fileInput.type = 'text'; 
    fileInput.type = 'file'; 
    statusDiv.innerText = ''; 
    cargarArchivos(currentPath);
}

async function crearCarpeta() {
    const nombre = prompt("Nombre de la carpeta:");
    if (!nombre) return;
    await fetch(`${URL_API}/create-folder`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ nombre, rutaPadre: currentPath })
    });
    cargarArchivos(currentPath);
}

async function borrar(id) {
    if(confirm('¿Borrar este elemento?')) {
        await fetch(`${URL_API}/delete/${id}`, { method: 'DELETE' });
        cargarArchivos(currentPath);
    }
}

async function renombrar(id, actual) {
    const nuevo = prompt("Nuevo nombre:", actual);
    if (nuevo) {
        await fetch(`${URL_API}/rename/${id}`, { 
            method: 'PATCH', 
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ nuevoNombre: nuevo }) 
        });
        cargarArchivos(currentPath);
    }
}

cargarArchivos('/');
const URL_API = 'https://requiring-andrews-inherited-stuffed.trycloudflare.com/api';
let currentPath = '/';

async function cargarArchivos(ruta = '/') {
    currentPath = ruta;
    const lista = document.getElementById('fileList');
    lista.innerHTML = '<li>Cargando...</li>';
    
    try {
        const res = await fetch(`${URL_API}/files?ruta=${encodeURIComponent(ruta)}`, { cache: 'no-store' });
        const archivos = await res.json();
        lista.innerHTML = '';
        
        if (ruta !== '/') {
            lista.innerHTML += `<li onclick="cargarArchivos('/')" style="cursor:pointer; color:red;">⬅️ Volver a la raíz</li>`;
        }

        archivos.forEach(a => {
            const li = document.createElement('li');
            if (a.esCarpeta) {
                li.innerHTML = `📁 <span onclick="cargarArchivos('${a.nombre}')" style="cursor:pointer; color:blue;">${a.nombre}</span>`;
            } else {
                const urlDescarga = URL_API.replace('/api', '') + '/uploads/' + encodeURIComponent(a.nombre);
                li.innerHTML = `📄 ${a.nombre} 
                    <a href="${urlDescarga}" download style="margin-left:10px;">
                        <button style="padding:5px; background:#dbeafe; cursor:pointer;">⬇️ Descargar</button>
                    </a>`;
            }
            
            li.innerHTML += `
                <div style="margin-left: auto;">
                    <button onclick="renombrar(${a.id}, '${a.nombre.replace(/'/g, "\\'")}')" style="padding:5px; margin-right:5px;">✏️</button>
                    <button onclick="borrar(${a.id})" style="padding:5px; background:#fee2e2;">🗑️</button>
                </div>`;
            lista.appendChild(li);
        });
    } catch (e) { lista.innerHTML = '<li>Error de conexión</li>'; }
}

async function subirArchivo() {
    const fileInput = document.getElementById('fileInput');
    const statusDiv = document.getElementById('status');
    if (fileInput.files.length === 0) return alert('Selecciona al menos un archivo.');
    
    statusDiv.innerText = 'Subiendo...';
    
    // Subida múltiple
    for (let i = 0; i < fileInput.files.length; i++) {
        const formData = new FormData();
        formData.append('archivoEstudiante', fileInput.files[i]);
        formData.append('rutaPadre', currentPath);
        
        await fetch(`${URL_API}/upload`, { method: 'POST', body: formData });
    }
    
    // Limpieza
    fileInput.value = ''; 
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
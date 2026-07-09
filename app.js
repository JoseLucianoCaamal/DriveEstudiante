// URL de tu túnel - Asegúrate de que coincida con tu terminal
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
                // Función abrirArchivo para visualizar o descargar
                li.innerHTML = `📄 <span onclick="abrirArchivo('${a.nombre}')" style="cursor:pointer; color:blue; font-weight:bold;">${a.nombre}</span>`;
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

// Nueva función: Visualizar o Descargar
function abrirArchivo(nombre) {
    const url = URL_API.replace('/api', '') + '/uploads/' + encodeURIComponent(nombre);
    window.open(url, '_blank');
}

async function subirArchivo() {
    const fileInput = document.getElementById('fileInput');
    if (fileInput.files.length === 0) return alert('Selecciona al menos un archivo.');
    
    // Subida múltiple: procesa cada archivo seleccionado
    for (let i = 0; i < fileInput.files.length; i++) {
        const formData = new FormData();
        formData.append('archivoEstudiante', fileInput.files[i]);
        formData.append('rutaPadre', currentPath);
        
        await fetch(`${URL_API}/upload`, { method: 'POST', body: formData });
    }
    
    fileInput.value = ''; // Limpia el input tras subir
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
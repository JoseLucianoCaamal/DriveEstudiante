const URL_API = 'https://requiring-andrews-inherited-stuffed.trycloudflare.com/api';
let currentPath = '/';

async function cargarArchivos(ruta = '/') {
    currentPath = ruta;
    const lista = document.getElementById('fileList');
    lista.innerHTML = '<li>Cargando...</li>';
    
    try {
        // cache: 'no-store' asegura que siempre traiga datos frescos
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
                li.innerHTML = `📄 <a href="${urlDescarga}" target="_blank">${a.nombre}</a>`;
            }
            lista.appendChild(li);
        });
    } catch (e) { lista.innerHTML = '<li>Error de conexión</li>'; }
}

async function subirArchivo() {
    const fileInput = document.getElementById('fileInput');
    if (fileInput.files.length === 0) return alert('Selecciona un archivo.');
    
    const formData = new FormData();
    formData.append('archivoEstudiante', fileInput.files[0]);
    formData.append('rutaPadre', currentPath);
    
    await fetch(`${URL_API}/upload`, { method: 'POST', body: formData });
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

cargarArchivos('/');
const URL_API = 'https://lead-now-analysts-director.trycloudflare.com/api';

async function subirArchivo() {
    const fileInput = document.getElementById('fileInput');
    if (fileInput.files.length === 0) return alert('Selecciona un archivo.');
    const formData = new FormData();
    formData.append('archivoEstudiante', fileInput.files[0]);
    
    try {
        const res = await fetch(`${URL_API}/upload`, { method: 'POST', body: formData });
        if (res.ok) { 
            alert('¡Subido!'); 
            fileInput.value = ''; 
            cargarArchivos(); 
        } else alert('Error al subir');
    } catch (e) { alert('Error de conexión'); }
}

async function crearCarpeta() {
    const nombre = prompt("Nombre de la carpeta:");
    if (!nombre) return;
    await fetch(`${URL_API}/create-folder`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ nombre })
    });
    cargarArchivos();
}

async function cargarArchivos() {
    const lista = document.getElementById('fileList');
    const res = await fetch(`${URL_API}/files`);
    const archivos = await res.json();
    lista.innerHTML = archivos.length === 0 ? '<li>La nube está vacía.</li>' : '';
    archivos.forEach(a => {
        const li = document.createElement('li');
        const icono = a.esCarpeta ? '📁' : '📄';
        li.innerHTML = `${icono} ${a.nombre} 
            <div style="margin-left: auto;">
                <button onclick="renombrar(${a.id}, '${a.nombre}')">✏️</button>
                <button onclick="borrar(${a.id})">🗑️</button>
            </div>`;
        lista.appendChild(li);
    });
}

async function borrar(id) {
    if(confirm('¿Borrar?')) {
        await fetch(`${URL_API}/delete/${id}`, { method: 'DELETE' });
        cargarArchivos();
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
        cargarArchivos();
    }
}

cargarArchivos();
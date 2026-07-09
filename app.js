// ¡IMPORTANTE!: Pega aquí la URL exacta de tu terminal actual
const URL_API = 'https://lead-now-analysts-director.trycloudflare.com/api';

async function subirArchivo() {
    const fileInput = document.getElementById('fileInput');
    const statusDiv = document.getElementById('status');
    if (fileInput.files.length === 0) return alert('Selecciona un archivo.');
    
    const formData = new FormData();
    formData.append('archivoEstudiante', fileInput.files[0]);

    statusDiv.innerText = 'Subiendo...';
    try {
        const res = await fetch(`${URL_API}/upload`, { method: 'POST', body: formData });
        if (res.ok) { 
            statusDiv.innerText = '¡Éxito! Archivo guardado.';
            fileInput.value = ''; 
            cargarArchivos(); 
        } else {
            const err = await res.text();
            statusDiv.innerText = 'Error: ' + err;
        }
    } catch (e) { statusDiv.innerText = 'Error de red: ' + e.message; }
}

async function crearCarpeta() {
    const nombre = prompt("Nombre de la nueva carpeta:");
    if (!nombre) return;
    try {
        const res = await fetch(`${URL_API}/create-folder`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ nombre })
        });
        if (!res.ok) alert('Error al crear: ' + await res.text());
        cargarArchivos();
    } catch (e) { alert('Error de red: ' + e.message); }
}

async function cargarArchivos() {
    const lista = document.getElementById('fileList');
    lista.innerHTML = '<li>Cargando...</li>';
    try {
        const res = await fetch(`${URL_API}/files`);
        if (!res.ok) throw new Error('No se pudo conectar');
        
        const archivos = await res.json();
        lista.innerHTML = archivos.length === 0 ? '<li>La nube está vacía.</li>' : '';
        archivos.forEach(a => {
            const li = document.createElement('li');
            const icono = a.esCarpeta ? '📁' : '📄';
            li.innerHTML = `${icono} ${a.nombre} 
                <div style="margin-left: auto;">
                    <button onclick="renombrar(${a.id}, '${a.nombre.replace(/'/g, "\\'")}')">✏️</button>
                    <button onclick="borrar(${a.id})" style="background: #fee2e2;">🗑️</button>
                </div>`;
            lista.appendChild(li);
        });
    } catch (e) { 
        lista.innerHTML = '<li style="color: red;">Error: ' + e.message + '</li>';
    }
}

async function borrar(id) {
    if(confirm('¿Borrar?')) {
        try {
            await fetch(`${URL_API}/delete/${id}`, { method: 'DELETE' });
            cargarArchivos();
        } catch (e) { alert('Error: ' + e.message); }
    }
}

async function renombrar(id, actual) {
    const nuevo = prompt("Nuevo nombre:", actual);
    if (nuevo) {
        try {
            await fetch(`${URL_API}/rename/${id}`, { 
                method: 'PATCH', 
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ nuevoNombre: nuevo }) 
            });
            cargarArchivos();
        } catch (e) { alert('Error: ' + e.message); }
    }
}

cargarArchivos();
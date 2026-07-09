const URL_API = 'https://requiring-andrews-inherited-stuffed.trycloudflare.com/api';

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
        } else {
            // Capturamos el error detallado del servidor
            const errorMsg = await res.text();
            alert('Error al subir: ' + errorMsg);
        }
    } catch (e) { alert('Error de red al subir: ' + e.message); }
}

async function crearCarpeta() {
    const nombre = prompt("Nombre de la carpeta:");
    if (!nombre) return;
    try {
        const res = await fetch(`${URL_API}/create-folder`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ nombre })
        });
        if (!res.ok) {
            const errorMsg = await res.text();
            alert('Errores al crear carpeta: ' + errorMsg);
        }
        cargarArchivos();
    } catch (e) { alert('Error de red al crear carpeta: ' + e.message); }
}

async function cargarArchivos() {
    const lista = document.getElementById('fileList');
    try {
        const res = await fetch(`${URL_API}/files`);
        if (!res.ok) throw new Error('Error al obtener lista: ' + res.status);
        
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
    } catch (e) { 
        lista.innerHTML = '<li style="color: red;">Error: ' + e.message + '</li>';
    }
}

async function borrar(id) {
    if(confirm('¿Borrar?')) {
        try {
            const res = await fetch(`${URL_API}/delete/${id}`, { method: 'DELETE' });
            if (!res.ok) alert('Error al borrar');
            cargarArchivos();
        } catch (e) { alert('Error de red: ' + e.message); }
    }
}

async function renombrar(id, actual) {
    const nuevo = prompt("Nuevo nombre:", actual);
    if (nuevo) {
        try {
            const res = await fetch(`${URL_API}/rename/${id}`, { 
                method: 'PATCH', 
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ nuevoNombre: nuevo }) 
            });
            if (!res.ok) alert('Error al renombrar');
            cargarArchivos();
        } catch (e) { alert('Error de red: ' + e.message); }
    }
}

cargarArchivos();
// REEMPLAZA ESTA URL CON LA QUE TE DIO TU TERMINAL HACE UN MOMENTO
const URL_API = 'https://lead-now-analysts-director.trycloudflare.com/api';

async function subirArchivo() {
    const fileInput = document.getElementById('fileInput');
    const statusDiv = document.getElementById('status');
    if (fileInput.files.length === 0) return alert('Selecciona un archivo.');
    
    const formData = new FormData();
    formData.append('archivoEstudiante', fileInput.files[0]);

    statusDiv.innerText = 'Subiendo...';
    try {
        const respuesta = await fetch(`${URL_API}/upload`, { method: 'POST', body: formData });
        if (respuesta.ok) {
            statusDiv.innerText = '¡Éxito! Archivo guardado.';
            fileInput.value = ''; 
            cargarArchivos();
        } else {
            statusDiv.innerText = 'Error al subir.';
        }
    } catch (error) { statusDiv.innerText = 'Error de conexión.'; }
}

async function cargarArchivos() {
    const lista = document.getElementById('fileList');
    try {
        const respuesta = await fetch(`${URL_API}/files`);
        const archivos = await respuesta.json();
        lista.innerHTML = archivos.length === 0 ? '<li>La nube está vacía.</li>' : '';
        archivos.forEach(a => {
            const li = document.createElement('li');
            const urlDescarga = URL_API.replace('/api', '') + '/uploads/' + encodeURIComponent(a.nombre);
            li.innerHTML = `
                📁 <a href="${urlDescarga}" target="_blank">${a.nombre}</a>
                <div style="margin-left: auto;">
                    <button onclick="renombrarArchivo(${a.id}, '${a.nombre.replace(/'/g, "\\'")}')">✏️</button>
                    <button onclick="borrarArchivo(${a.id})" style="background: #fee2e2;">🗑️</button>
                </div>
            `;
            lista.appendChild(li);
        });
    } catch (e) { lista.innerHTML = '<li style="color: red;">Error al conectar.</li>'; }
}

async function borrarArchivo(id) {
    if(confirm('¿Seguro?')) {
        await fetch(`${URL_API}/delete/${id}`, { method: 'DELETE' });
        cargarArchivos();
    }
}

async function renombrarArchivo(id, actual) {
    const nuevo = prompt("Escribe el nuevo nombre:", actual);
    if (nuevo && nuevo !== actual) {
        await fetch(`${URL_API}/rename/${id}`, { 
            method: 'PATCH', 
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ nuevoNombre: nuevo }) 
        });
        cargarArchivos();
    }
}

cargarArchivos();
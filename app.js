// URL de tu túnel activo de Cloudflare
const URL_API = 'https://thereafter-courses-households-phil.trycloudflare.com/api';

// 1. Función para subir un archivo
async function subirArchivo() {
    const fileInput = document.getElementById('fileInput');
    const statusDiv = document.getElementById('status');
    
    if (fileInput.files.length === 0) return alert('Selecciona un archivo.');

    const formData = new FormData();
    formData.append('archivoEstudiante', fileInput.files[0]);

    statusDiv.innerText = 'Subiendo...';
    
    try {
        const respuesta = await fetch(`${URL_API}/upload`, { method: 'POST', body: formData });
        
        // Corregido: leemos la respuesta como texto primero para evitar errores de parseo
        const resultado = await respuesta.json().catch(() => ({ mensaje: 'Error al subir' }));

        if (respuesta.ok) {
            statusDiv.innerText = '¡Éxito! Archivo guardado.';
            fileInput.value = ''; 
            cargarArchivos();
        } else {
            // Aseguramos que solo mostramos texto y no un objeto
            statusDiv.innerText = (typeof resultado === 'string') ? resultado : (resultado.mensaje || 'Error al subir.');
        }
    } catch (error) {
        statusDiv.innerText = 'Error de conexión.';
    }
}

// 2. Función para obtener la lista desde la Base de Datos
async function cargarArchivos() {
    const lista = document.getElementById('fileList');
    lista.innerHTML = '<li>Cargando...</li>';

    try {
        const respuesta = await fetch(`${URL_API}/files`);
        if (!respuesta.ok) throw new Error('No se pudo conectar');
        
        const archivos = await respuesta.json();

        lista.innerHTML = '';
        if (archivos.length === 0) {
            lista.innerHTML = '<li>La nube está vacía.</li>';
            return;
        }

        archivos.forEach(a => {
            const li = document.createElement('li');
            // Usamos encodeURIComponent para evitar errores si el nombre tiene espacios
            const nombreSeguro = encodeURIComponent(a.nombre);
            
            li.innerHTML = `
                📁 <a href="${URL_API.replace('/api', '')}/uploads/${nombreSeguro}" target="_blank">${a.nombre}</a>
                <div style="margin-left: auto;">
                    <button onclick="renombrarArchivo(${a.id}, '${a.nombre.replace(/'/g, "\\'")}')">✏️</button>
                    <button onclick="borrarArchivo(${a.id})" style="background: #fee2e2;">🗑️</button>
                </div>
            `;
            lista.appendChild(li);
        });
    } catch (e) {
        lista.innerHTML = '<li style="color: red;">Error al conectar con el servidor.</li>';
    }
}

// 3. Función para borrar
async function borrarArchivo(id) {
    if(confirm('¿Seguro que quieres borrar este archivo?')) {
        try {
            await fetch(`${URL_API}/delete/${id}`, { method: 'DELETE' });
            cargarArchivos();
        } catch (e) { console.error(e); }
    }
}

// 4. Función para renombrar
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

// Registro del Service Worker
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js').catch(console.error);
    });
}

cargarArchivos();
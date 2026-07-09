// Asegúrate de que esta sea la URL actual de tu túnel activo
const URL_API = 'https://showed-qualifying-highest-definitely.trycloudflare.com/api';

// 1. Función para subir un archivo
async function subirArchivo() {
    const fileInput = document.getElementById('fileInput');
    const statusDiv = document.getElementById('status');
    
    if (fileInput.files.length === 0) {
        statusDiv.innerText = 'Selecciona un archivo.';
        statusDiv.style.color = '#e74c3c';
        return;
    }

    const archivo = fileInput.files[0];
    const formData = new FormData();
    formData.append('archivoEstudiante', archivo);

    statusDiv.innerText = 'Subiendo...';
    
    try {
        const respuesta = await fetch(`${URL_API}/upload`, {
            method: 'POST',
            body: formData
        });

        if (respuesta.ok) {
            statusDiv.innerText = '¡Éxito! Archivo guardado.';
            statusDiv.style.color = '#27ae60';
            fileInput.value = ''; 
            cargarArchivos(); 
        } else {
            statusDiv.innerText = 'Error al subir.';
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
        const archivos = await respuesta.json();

        lista.innerHTML = '';

        if (archivos.length === 0) {
            lista.innerHTML = '<li>La nube está vacía.</li>';
            return;
        }

        archivos.forEach(archivo => {
            const li = document.createElement('li');
            li.innerHTML = `
                📁 <a href="https://showed-qualifying-highest-definitely.trycloudflare.com/uploads/${archivo.nombre}" target="_blank">${archivo.nombre}</a>
                <div style="margin-left: auto;">
                    <button onclick="renombrarArchivo(${archivo.id}, '${archivo.nombre}')" style="cursor: pointer; margin-right: 5px;">✏️</button>
                    <button onclick="borrarArchivo(${archivo.id})" style="cursor: pointer; background: #fee2e2; color: #991b1b; border: 1px solid #fca5a5;">🗑️</button>
                </div>
            `;
            lista.appendChild(li);
        });
    } catch (error) {
        lista.innerHTML = '<li style="color: red;">Error al conectar con la base de datos.</li>';
    }
}

// 3. Función para borrar (Ahora sí borra el archivo físico y el registro)
async function borrarArchivo(id) {
    if(confirm('¿Seguro que quieres borrar este archivo?')) {
        await fetch(`${URL_API}/delete/${id}`, { method: 'DELETE' });
        cargarArchivos();
    }
}

// 4. NUEVA Función para renombrar
async function renombrarArchivo(id, nombreActual) {
    const nuevoNombre = prompt("Escribe el nuevo nombre:", nombreActual);
    if (nuevoNombre && nuevoNombre !== nombreActual) {
        await fetch(`${URL_API}/rename/${id}`, { 
            method: 'PATCH', 
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ nuevoNombre }) 
        });
        cargarArchivos();
    }
}

// Registro del Service Worker
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
            .catch(err => console.error('Error SW:', err));
    });
}

cargarArchivos();
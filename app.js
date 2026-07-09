// Asegúrate de que esta sea la URL actual de tu túnel activo
const URL_API = 'https://showed-qualifying-highest-definitely.trycloudflare.com/api';

// 1. Función para subir un archivo al servidor
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
            cargarArchivos(); // Recargamos la lista desde la BD
        } else {
            statusDiv.innerText = 'Error al subir.';
        }
    } catch (error) {
        statusDiv.innerText = 'Error de conexión.';
    }
}

// 2. Función para obtener la lista de archivos DESDE LA BASE DE DATOS
async function cargarArchivos() {
    const lista = document.getElementById('fileList');
    lista.innerHTML = '<li>Cargando...</li>';

    try {
        const respuesta = await fetch(`${URL_API}/files`);
        const archivos = await respuesta.json(); // Ahora 'archivos' es un array de objetos

        lista.innerHTML = '';

        if (archivos.length === 0) {
            lista.innerHTML = '<li>La nube está vacía.</li>';
            return;
        }

        archivos.forEach(archivo => {
            const li = document.createElement('li');
            // Nota: usamos archivo.nombre y archivo.id que vienen de SQLite
            li.innerHTML = `
                📁 <a href="https://showed-qualifying-highest-definitely.trycloudflare.com/uploads/${archivo.nombre}" target="_blank">
                    ${archivo.nombre}
                </a>
                <button onclick="borrarArchivo(${archivo.id})" style="margin-left: auto; cursor: pointer;">Borrar</button>
            `;
            lista.appendChild(li);
        });
    } catch (error) {
        lista.innerHTML = '<li style="color: red;">Error al conectar con la base de datos.</li>';
    }
}

// 3. Nueva función para borrar
async function borrarArchivo(id) {
    if(confirm('¿Seguro que quieres borrar este archivo?')) {
        await fetch(`${URL_API}/delete/${id}`, { method: 'DELETE' });
        cargarArchivos(); // Recargar la lista después de borrar
    }
}

// Registro del Service Worker
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
            .catch(err => console.error('Error SW:', err));
    });
}

// Ejecutar al abrir
cargarArchivos();
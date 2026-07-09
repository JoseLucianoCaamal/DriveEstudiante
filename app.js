const URL_API = 'https://investigations-modified-counsel-boys.trycloudflare.com/api';

// 1. Función para subir un archivo al servidor
async function subirArchivo() {
    const fileInput = document.getElementById('fileInput');
    const statusDiv = document.getElementById('status');
    
    if (fileInput.files.length === 0) {
        statusDiv.innerText = 'Selecciona un archivo antes de subir.';
        statusDiv.style.color = '#e74c3c';
        return;
    }

    const archivo = fileInput.files[0];
    const formData = new FormData();
    formData.append('archivoEstudiante', archivo);

    statusDiv.innerText = 'Subiendo archivo...';
    statusDiv.style.color = '#3498db';

    try {
        const respuesta = await fetch(`${URL_API}/upload`, {
            method: 'POST',
            body: formData
        });

        const resultado = await respuesta.json();

        if (respuesta.ok) {
            statusDiv.innerText = `¡Éxito! ${resultado.archivo.nombreOriginal} (${resultado.archivo.tamaño})`;
            statusDiv.style.color = '#27ae60';
            fileInput.value = ''; // Limpiar el input
            cargarArchivos(); // Recargar la lista automáticamente
        } else {
            statusDiv.innerText = `Error: ${resultado.mensaje}`;
            statusDiv.style.color = '#e74c3c';
        }
    } catch (error) {
        statusDiv.innerText = 'No se pudo conectar con el servidor.';
        statusDiv.style.color = '#e74c3c';
    }
}

// 2. Función para obtener la lista de archivos y mostrarlos
async function cargarArchivos() {
    const lista = document.getElementById('fileList');
    lista.innerHTML = '<li>Cargando archivos del servidor...</li>';

    try {
        const respuesta = await fetch(`${URL_API}/files`);
        const archivos = await respuesta.json();

        lista.innerHTML = '';

        if (archivos.length === 0) {
            lista.innerHTML = '<li>La nube está vacía. Sube tu primer documento técnico.</li>';
            return;
        }

        archivos.forEach(archivo => {
            const li = document.createElement('li');
            // Aquí cambiamos el texto plano por un enlace <a> hacia tu servidor de Linux
            li.innerHTML = `
                📁 <a href="https://investigations-modified-counsel-boys.trycloudflare.com/uploads/${archivo}" target="_blank" style="text-decoration: none; color: #3498db; font-weight: bold; margin-left: 10px;">
                    ${archivo}
               </a>
            `;
            lista.appendChild(li);
        });
    } catch (error) {
        lista.innerHTML = '<li style="color: #e74c3c;">Error al conectar con el almacenamiento.</li>';
    }
}

// Ejecutar la carga de archivos al abrir la página
cargarArchivos();
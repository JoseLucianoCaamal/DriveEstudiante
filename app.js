const URL_API = 'https://expressed-anna-brian-seattle.trycloudflare.com/api';
let currentPath = '/';
let isLoggedIn = false;

// Al cargar la app, verificamos si ya había sesión abierta
async function init() {
    try {
        const res = await fetch(`${URL_API}/check-session`);
        const data = await res.json();
        isLoggedIn = data.loggedIn;
        const btn = document.getElementById('loginBtn');
        if (btn) btn.innerText = isLoggedIn ? "Cerrar Sesión" : "Login AKKO";
    } catch (e) { console.log("Servidor offline"); }
    cargarArchivos('/');
}

// Alternar entre Login y Logout
async function toggleLogin() {
    const btn = document.getElementById('loginBtn');
    if (isLoggedIn) {
        await fetch(`${URL_API}/logout`, { method: 'POST' });
        isLoggedIn = false;
        btn.innerText = "Login AKKO";
        alert("Sesión cerrada");
    } else {
        const username = prompt("Usuario:");
        const password = prompt("Contraseña:");
        if (!username || !password) return;
        
        const res = await fetch(`${URL_API}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        const data = await res.json();
        if (data.success) {
            isLoggedIn = true;
            btn.innerText = "Cerrar Sesión";
            alert("Bienvenido AKKO");
        } else { alert("Acceso denegado"); }
    }
    cargarArchivos(currentPath);
}

// Cargar archivos
async function cargarArchivos(ruta = '/') {
    currentPath = ruta;
    const lista = document.getElementById('fileList');
    lista.innerHTML = '<li>Cargando...</li>';
    try {
        const res = await fetch(`${URL_API}/files?ruta=${encodeURIComponent(ruta)}&t=${Date.now()}`);
        const archivos = await res.json();
        lista.innerHTML = '';
        archivos.forEach(a => {
            const li = document.createElement('li');
            li.innerHTML = `
                <span>${a.esCarpeta ? '📁' : '📄'}</span>
                <span onclick="${a.esCarpeta ? `cargarArchivos('${a.nombre}')` : ''}">${a.nombre}</span>
                ${isLoggedIn ? `<button onclick="borrar(${a.id})">🗑️</button>` : ''}
            `;
            lista.appendChild(li);
        });
    } catch (e) { lista.innerHTML = '<li>Error de conexión</li>'; }
}

async function crearCarpeta() {
    const nombre = prompt("Nombre:");
    if (!nombre) return;
    const esPrivada = confirm("¿Hacer PRIVADA (solo para AKKO)?");
    await fetch(`${URL_API}/create-folder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre, rutaPadre: currentPath, esPrivada: esPrivada ? 1 : 0 })
    });
    cargarArchivos(currentPath);
}

async function borrar(id) {
    if(confirm('¿Borrar este archivo/carpeta?')) {
        await fetch(`${URL_API}/delete/${id}`, { method: 'DELETE' });
        cargarArchivos(currentPath);
    }
}

// Iniciar aplicación
init();
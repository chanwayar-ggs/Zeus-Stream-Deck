const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { default: OBSWebSocket } = require('obs-websocket-js'); // Importamos la librería de OBS

const app = express();
const server = http.createServer(app);
const io = new Server(server);
const obs = new OBSWebSocket(); // Creamos la conexión a OBS

app.use(express.static(__dirname));

// Lógica de conexión a OBS
async function conectarOBS() {
    try {
        // Intentamos conectar al puerto por defecto de OBS (sin contraseña)
        await obs.connect('ws://127.0.0.1:4455');
        console.log('⚡ [OBS] Conectado exitosamente en ws://127.0.0.1:4455');
    } catch (error) {
        console.log('❌ [OBS] Error de conexión. ¿Está OBS abierto y el WebSocket habilitado en el puerto 4455?');
    }
}
conectarOBS();

// Lógica del Stream Deck (Teléfono)
io.on('connection', (socket) => {
    console.log('📱 ¡Dispositivo conectado al Zeus Stream Deck!');

    socket.on('accion_boton', async (datos) => {
        console.log(`🔘 Orden recibida -> Acción: ${datos.accion}`);
        
        // Ejecutar acción en OBS
        if (datos.accion === 'obs_mute') {
            try {
                // Aquí debes poner el nombre EXACTO de tu pista de audio en OBS (ej. "Audio del escritorio" o "Micrófono")
                const nombrePista = "Micrófono"; 
                await obs.call('ToggleInputMute', { inputName: nombrePista });
                console.log(`🎤 OBS: Pista '${nombrePista}' muteada/desmuteada.`);
            } catch (error) {
                console.log('⚠️ Error al intentar mutear en OBS:', error.message);
            }
        }
    });

    socket.on('disconnect', () => {
        console.log('📱 Dispositivo desconectado.');
    });
});

const os = require('os'); // Importamos el módulo para leer la red de tu PC

const PUERTO = 3000;
server.listen(PUERTO, () => {
    console.log(`\n⚡ Zeus Stream Deck Server activo en puerto ${PUERTO}`);
    console.log(`🖥️  Local: http://localhost:${PUERTO}`);
    
    // Buscar y mostrar la IP local para conectarse desde el teléfono
    const interfaces = os.networkInterfaces();
    for (const nombre in interfaces) {
        for (const red of interfaces[nombre]) {
            if (red.family === 'IPv4' && !red.internal) {
                console.log(`📱 Móvil: http://${red.address}:${PUERTO}`);
            }
        }
    }
    console.log(`\n`);
});
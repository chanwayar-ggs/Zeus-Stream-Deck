import express from 'express';
import http from 'http';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import OBSWebSocket from 'obs-websocket-js';
import { exec } from 'child_process';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);

app.use(cors());
app.use(express.json());

// Setup Socket.IO with CORS enabled for local network devices
const io = new SocketIOServer(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Helper to get local network IPv4 addresses
function getLocalNetworkIps(): string[] {
  const interfaces = os.networkInterfaces();
  const ips: string[] = [];
  for (const name of Object.keys(interfaces)) {
    const netList = interfaces[name];
    if (netList) {
      for (const net of netList) {
        if (net.family === 'IPv4' && !net.internal) {
          ips.push(net.address);
        }
      }
    }
  }
  return ips;
}

// OBS WebSocket instance & state
const obs = new OBSWebSocket();
let obsState = {
  connected: false,
  connecting: false,
  url: process.env.OBS_WEBSOCKET_URL || 'ws://127.0.0.1:4455',
  password: process.env.OBS_WEBSOCKET_PASSWORD || '',
  currentScene: 'Inicio',
  scenes: ['Inicio', 'Charla', 'Gameplay', 'Pausa'] as string[],
  audioInputs: [
    { inputName: 'Micrófono', inputKind: 'wasapi_input_capture', muted: false },
    { inputName: 'Spotify', inputKind: 'wasapi_output_capture', muted: false },
    { inputName: 'Juego', inputKind: 'wasapi_output_capture', muted: false },
    { inputName: 'Discord', inputKind: 'wasapi_output_capture', muted: false }
  ] as { inputName: string; inputKind: string; muted: boolean }[],
  isStreaming: false,
  isRecording: false,
  isRecordingPaused: false,
  studioMode: false,
  lastError: null as string | null
};

// Attempt to connect to OBS Studio WebSocket
async function connectToOBS(url = obsState.url, password = obsState.password) {
  if (obsState.connecting) return;
  obsState.connecting = true;
  obsState.lastError = null;
  io.emit('obs:state', { ...obsState, connecting: true });

  try {
    obsState.url = url;
    obsState.password = password;
    await obs.connect(url, password || undefined, {
      rpcVersion: 1
    });
    obsState.connected = true;
    obsState.connecting = false;
    obsState.lastError = null;
    console.log(`[OBS] Conectado exitosamente a ${url}`);

    await refreshOBSState();
    io.emit('obs:state', obsState);
  } catch (err: any) {
    obsState.connected = false;
    obsState.connecting = false;
    const isConnRefused = err?.code === 'ECONNREFUSED' || err?.message?.includes('ECONNREFUSED');
    obsState.lastError = isConnRefused
      ? 'OBS no detectado en 127.0.0.1:4455 (Inicia OBS en tu PC o usa Modo Demo)'
      : (err?.message || 'Error al conectar con OBS Studio');
    
    // Log as info rather than warning to prevent noisy alert triggers in cloud preview
    console.log(`[OBS] Estado: ${obsState.lastError}`);
    io.emit('obs:state', obsState);
  }
}

// Disconnect from OBS
async function disconnectFromOBS() {
  try {
    if (obsState.connected) {
      await obs.disconnect();
    }
  } catch (err) {
    console.error('[OBS] Disconnect error:', err);
  } finally {
    obsState.connected = false;
    obsState.connecting = false;
    io.emit('obs:state', obsState);
  }
}

// Refresh scenes, current scene, audio inputs, and stream/recording status
async function refreshOBSState() {
  if (!obsState.connected) return;
  try {
    // 1. Get scene list
    const sceneList = await obs.call('GetSceneList');
    obsState.scenes = (sceneList.scenes as any[]).map((s: any) => s.sceneName).reverse();
    obsState.currentScene = sceneList.currentProgramSceneName || '';

    // 2. Get audio inputs
    const inputList = await obs.call('GetInputList');
    const audioInputs: { inputName: string; inputKind: string; muted: boolean }[] = [];
    for (const input of inputList.inputs as any[]) {
      try {
        const muteStatus = await obs.call('GetInputMute', { inputName: input.inputName });
        audioInputs.push({
          inputName: input.inputName,
          inputKind: input.inputKind,
          muted: muteStatus.inputMuted
        });
      } catch {
        // Not an audio input or does not support mute
      }
    }
    obsState.audioInputs = audioInputs;

    // 3. Get stream & record status
    try {
      const streamStatus = await obs.call('GetStreamStatus');
      obsState.isStreaming = streamStatus.outputActive;
    } catch {}

    try {
      const recordStatus = await obs.call('GetRecordStatus');
      obsState.isRecording = recordStatus.outputActive;
      obsState.isRecordingPaused = recordStatus.outputPaused;
    } catch {}

    io.emit('obs:state', obsState);
  } catch (err) {
    console.error('[OBS] Error refreshing state:', err);
  }
}

// Register OBS WebSocket event hooks
obs.on('ConnectionOpened', () => {
  console.log('[OBS] WebSocket connection opened');
});

obs.on('ConnectionClosed', () => {
  console.log('[OBS] WebSocket connection closed');
  obsState.connected = false;
  obsState.connecting = false;
  io.emit('obs:state', obsState);
});

obs.on('CurrentProgramSceneChanged', (data) => {
  obsState.currentScene = data.sceneName;
  io.emit('obs:scene-changed', data);
  io.emit('obs:state', obsState);
});

obs.on('InputMuteStateChanged', (data) => {
  const item = obsState.audioInputs.find(i => i.inputName === data.inputName);
  if (item) {
    item.muted = data.inputMuted;
  }
  io.emit('obs:mute-changed', data);
  io.emit('obs:state', obsState);
});

obs.on('StreamStateChanged', (data) => {
  obsState.isStreaming = data.outputActive;
  io.emit('obs:stream-changed', data);
  io.emit('obs:state', obsState);
});

obs.on('RecordStateChanged', (data) => {
  obsState.isRecording = data.outputActive;
  obsState.isRecordingPaused = (data as any).outputPaused || false;
  io.emit('obs:record-changed', data);
  io.emit('obs:state', obsState);
});

// Trigger a PC keyboard shortcut (Windows PowerShell / SendKeys fallback)
function sendSystemHotkey(key: string, modifiers: string[] = []): Promise<boolean> {
  return new Promise((resolve) => {
    const isWindows = process.platform === 'win32';
    console.log(`[HOTKEY] Executing: ${modifiers.join('+')} ${key} (Platform: ${process.platform})`);

    if (isWindows) {
      // Build PowerShell SendKeys payload
      let prefix = '';
      if (modifiers.includes('ctrl') || modifiers.includes('control')) prefix += '^';
      if (modifiers.includes('shift')) prefix += '+';
      if (modifiers.includes('alt')) prefix += '%';

      let keyStr = key;
      if (key.length > 1) {
        keyStr = `{${key.toUpperCase()}}`;
      }

      const sendKeysArg = `"${prefix}${keyStr}"`;
      const psCommand = `powershell -Command "$wshell = New-Object -ComObject wscript.shell; $wshell.SendKeys('${prefix}${keyStr}')"`;

      exec(psCommand, (error) => {
        if (error) {
          console.warn('[HOTKEY] PowerShell error:', error.message);
          resolve(false);
        } else {
          resolve(true);
        }
      });
    } else {
      // Non-windows or simulated environment
      console.log(`[HOTKEY] Keystroke simulated in non-Windows host: ${modifiers.join('+')}+${key}`);
      resolve(true);
    }
  });
}

// Universal action execution handler
async function handleActionExecution(action: any) {
  console.log('[ACTION] Processing action:', action?.type, action);

  if (!action || !action.type) {
    return { success: false, error: 'No action type provided' };
  }

  try {
    switch (action.type) {
      case 'obs_scene': {
        const sceneName = action.target || action.sceneName || 'Inicio';
        if (obsState.connected) {
          await obs.call('SetCurrentProgramScene', { sceneName });
        }
        obsState.currentScene = sceneName;
        io.emit('obs:state', obsState);
        return { success: true, message: `Escena cambiada a ${sceneName}`, simulated: !obsState.connected };
      }

      case 'obs_mute_toggle': {
        const inputName = action.target || action.inputName || 'Spotify';
        let newMuted = false;

        if (obsState.connected) {
          const res = await obs.call('ToggleInputMute', { inputName });
          newMuted = res.inputMuted;
        } else {
          let item = obsState.audioInputs.find(i => i.inputName.toLowerCase() === inputName.toLowerCase());
          if (!item) {
            item = { inputName, inputKind: 'wasapi_output_capture', muted: false };
            obsState.audioInputs.push(item);
          }
          item.muted = !item.muted;
          newMuted = item.muted;
        }

        const targetItem = obsState.audioInputs.find(i => i.inputName.toLowerCase() === inputName.toLowerCase());
        if (targetItem) targetItem.muted = newMuted;

        io.emit('obs:state', obsState);
        return { success: true, muted: newMuted, inputName, simulated: !obsState.connected };
      }

      case 'obs_mute_set': {
        const inputName = action.target || action.inputName || 'Micrófono';
        const inputMuted = Boolean(action.muted);

        if (obsState.connected) {
          await obs.call('SetInputMute', { inputName, inputMuted });
        }

        const item = obsState.audioInputs.find(i => i.inputName.toLowerCase() === inputName.toLowerCase());
        if (item) item.muted = inputMuted;

        io.emit('obs:state', obsState);
        return { success: true, muted: inputMuted, inputName, simulated: !obsState.connected };
      }

      case 'obs_copyright_panic': {
        // Instantly mute all music / copyright suspected tracks
        const defaultMusicKeywords = ['music', 'música', 'spotify', 'chrome', 'browser', 'pista', 'track', 'vod', 'audio del escritorio'];
        const targets = action.targets || defaultMusicKeywords;
        const mutedList: string[] = [];

        for (const input of obsState.audioInputs) {
          const lower = input.inputName.toLowerCase();
          const shouldMute = targets.some((k: string) => lower.includes(k.toLowerCase())) || targets.includes(input.inputName);
          if (shouldMute) {
            if (obsState.connected) {
              try {
                await obs.call('SetInputMute', { inputName: input.inputName, inputMuted: true });
              } catch (e) {
                console.warn(`Failed to mute ${input.inputName}:`, e);
              }
            }
            input.muted = true;
            mutedList.push(input.inputName);
          }
        }
        io.emit('obs:state', obsState);
        return { success: true, panicTriggered: true, mutedInputs: mutedList, simulated: !obsState.connected };
      }

      case 'obs_toggle_stream': {
        if (obsState.connected) {
          const res = await obs.call('ToggleStream');
          obsState.isStreaming = res.outputActive;
        } else {
          obsState.isStreaming = !obsState.isStreaming;
        }
        io.emit('obs:state', obsState);
        return { success: true, isStreaming: obsState.isStreaming, simulated: !obsState.connected };
      }

      case 'obs_toggle_record': {
        if (obsState.connected) {
          const res = await obs.call('ToggleRecord');
          obsState.isRecording = res.outputActive;
        } else {
          obsState.isRecording = !obsState.isRecording;
          obsState.isRecordingPaused = false;
        }
        io.emit('obs:state', obsState);
        return { success: true, isRecording: obsState.isRecording, simulated: !obsState.connected };
      }

      case 'obs_pause_record': {
        if (obsState.connected) {
          const res = await obs.call('ToggleRecordPause');
          const isPaused = Boolean((res as any)?.outputPaused);
          obsState.isRecordingPaused = isPaused;
        } else {
          obsState.isRecordingPaused = !obsState.isRecordingPaused;
        }
        io.emit('obs:state', obsState);
        return { success: true, isPaused: obsState.isRecordingPaused, simulated: !obsState.connected };
      }

      case 'obs_screenshot': {
        if (!obsState.connected) throw new Error('OBS Studio no está conectado');
        const sceneName = obsState.currentScene;
        const res = await obs.call('GetSourceScreenshot', {
          sourceName: sceneName,
          imageFormat: 'png'
        });
        return { success: true, imageBase64: res.imageData };
      }

      case 'hotkey': {
        const key = action.key || action.target || 'F13';
        const modifiers = action.modifiers || [];
        const ok = await sendSystemHotkey(key, modifiers);
        return { success: ok, key, modifiers };
      }

      case 'url_open': {
        const targetUrl = action.url || action.target;
        return { success: true, openUrl: targetUrl };
      }

      default:
        return { success: true, echo: action };
    }
  } catch (err: any) {
    console.error('[ACTION ERROR]:', err);
    return { success: false, error: err?.message || 'Error desconocido al ejecutar la acción' };
  }
}

// REST API Endpoints
app.get('/api/network-ips', (req, res) => {
  const ips = getLocalNetworkIps();
  const port = process.env.PORT || 3000;
  res.json({
    ips,
    port,
    suggestedUrls: ips.map(ip => `http://${ip}:${port}`),
    hostname: os.hostname(),
    platform: process.platform
  });
});

app.get('/api/obs/status', (req, res) => {
  res.json(obsState);
});

app.post('/api/obs/connect', async (req, res) => {
  const { url, password } = req.body;
  await connectToOBS(url, password);
  res.json(obsState);
});

app.post('/api/obs/disconnect', async (req, res) => {
  await disconnectFromOBS();
  res.json(obsState);
});

app.post('/api/action/execute', async (req, res) => {
  const result = await handleActionExecution(req.body);
  res.json(result);
});

app.get('/api/firewall-helper', (req, res) => {
  const port = process.env.PORT || 3000;
  res.json({
    windowsNetshCmd: `netsh advfirewall firewall add rule name="Zeus Stream Deck (Puerto ${port})" dir=in action=allow protocol=TCP localport=${port}`,
    windowsPowerShellCmd: `New-NetFirewallRule -DisplayName "Zeus Stream Deck Port ${port}" -Direction Inbound -LocalPort ${port} -Protocol TCP -Action Allow`,
    tips: [
      'Asegúrate de que tu PC y tu teléfono móvil estén conectados a la misma red Wi-Fi.',
      'En Windows, configura tu red como "Red Privada" en vez de "Red Pública".',
      'Ejecuta PowerShell o CMD como Administrador para pegar la regla del Firewall.',
      `Accede desde el navegador de tu móvil escaneando el código QR o ingresando a http://<IP_DE_TU_PC>:${port}`
    ]
  });
});

// Socket.io real-time events
io.on('connection', (socket) => {
  console.log(`[SOCKET.IO] Client connected: ${socket.id} from ${socket.handshake.address}`);

  // Send initial states
  socket.emit('obs:state', obsState);
  socket.emit('network:ips', {
    ips: getLocalNetworkIps(),
    port: process.env.PORT || 3000
  });

  socket.on('obs:connect', async (data) => {
    await connectToOBS(data?.url, data?.password);
  });

  socket.on('obs:disconnect', async () => {
    await disconnectFromOBS();
  });

  socket.on('obs:refresh', async () => {
    await refreshOBSState();
  });

  socket.on('action:execute', async (action, callback) => {
    const result = await handleActionExecution(action);
    // Broadcast state if changed
    io.emit('obs:state', obsState);
    if (typeof callback === 'function') {
      callback(result);
    } else {
      socket.emit('action:result', result);
    }
  });

  socket.on('ping:check', (timestamp, callback) => {
    if (typeof callback === 'function') {
      callback(Date.now());
    }
  });

  socket.on('disconnect', () => {
    console.log(`[SOCKET.IO] Client disconnected: ${socket.id}`);
  });
});

// Automatically attempt to connect to OBS on startup (default ws://127.0.0.1:4455)
setTimeout(() => {
  connectToOBS().catch(() => {});
}, 1500);

// Setup Vite dev server or static files
async function startServer() {
  const PORT = Number(process.env.PORT) || 3000;

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist/index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    const ips = getLocalNetworkIps();
    console.log(`====================================================`);
    console.log(`⚡ Zeus Stream Deck Server activo en puerto ${PORT}`);
    console.log(`🖥️  Local:   http://localhost:${PORT}`);
    ips.forEach(ip => {
      console.log(`📱  Móvil:   http://${ip}:${PORT}`);
    });
    console.log(`====================================================`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
});

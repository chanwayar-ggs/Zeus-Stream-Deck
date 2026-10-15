/**
 * Zeus Stream Deck - Standalone Node.js Local PC Server
 * Ejecutar en tu PC de streaming con: node server.js
 */
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

const io = new SocketIOServer(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
});

function getLocalNetworkIps() {
  const interfaces = os.networkInterfaces();
  const ips = [];
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

const obs = new OBSWebSocket();
let obsState = {
  connected: false,
  connecting: false,
  url: process.env.OBS_WEBSOCKET_URL || 'ws://127.0.0.1:4455',
  password: process.env.OBS_WEBSOCKET_PASSWORD || '',
  currentScene: 'Inicio',
  scenes: ['Inicio', 'Charla', 'Gameplay', 'Pausa'],
  audioInputs: [
    { inputName: 'Micrófono', inputKind: 'wasapi_input_capture', muted: false },
    { inputName: 'Spotify', inputKind: 'wasapi_output_capture', muted: false },
    { inputName: 'Juego', inputKind: 'wasapi_output_capture', muted: false },
    { inputName: 'Discord', inputKind: 'wasapi_output_capture', muted: false }
  ],
  isStreaming: false,
  isRecording: false,
  isRecordingPaused: false,
  lastError: null
};

async function connectToOBS(url = obsState.url, password = obsState.password) {
  if (obsState.connecting) return;
  obsState.connecting = true;
  obsState.lastError = null;
  io.emit('obs:state', { ...obsState, connecting: true });

  try {
    obsState.url = url;
    obsState.password = password;
    await obs.connect(url, password || undefined, { rpcVersion: 1 });
    obsState.connected = true;
    obsState.connecting = false;
    obsState.lastError = null;
    console.log(`[OBS] Conectado exitosamente a ${url}`);
    await refreshOBSState();
  } catch (err) {
    obsState.connected = false;
    obsState.connecting = false;
    const isConnRefused = err?.code === 'ECONNREFUSED' || err?.message?.includes('ECONNREFUSED');
    obsState.lastError = isConnRefused
      ? 'OBS no detectado en 127.0.0.1:4455 (Inicia OBS en tu PC o usa Modo Demo)'
      : (err?.message || 'Error al conectar con OBS Studio');
    console.log(`[OBS] Estado: ${obsState.lastError}`);
  } finally {
    io.emit('obs:state', obsState);
  }
}

async function refreshOBSState() {
  if (!obsState.connected) return;
  try {
    const sceneList = await obs.call('GetSceneList');
    obsState.scenes = (sceneList.scenes || []).map(s => s.sceneName).reverse();
    obsState.currentScene = sceneList.currentProgramSceneName || '';

    const inputList = await obs.call('GetInputList');
    const audioInputs = [];
    for (const input of (inputList.inputs || [])) {
      try {
        const muteStatus = await obs.call('GetInputMute', { inputName: input.inputName });
        audioInputs.push({
          inputName: input.inputName,
          inputKind: input.inputKind,
          muted: muteStatus.inputMuted
        });
      } catch {}
    }
    obsState.audioInputs = audioInputs;

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
    console.error('[OBS] Error actualizando estado:', err);
  }
}

obs.on('ConnectionClosed', () => {
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
  if (item) item.muted = data.inputMuted;
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
  obsState.isRecordingPaused = data.outputPaused || false;
  io.emit('obs:record-changed', data);
  io.emit('obs:state', obsState);
});

function sendSystemHotkey(key, modifiers = []) {
  return new Promise((resolve) => {
    if (process.platform === 'win32') {
      let prefix = '';
      if (modifiers.includes('ctrl') || modifiers.includes('control')) prefix += '^';
      if (modifiers.includes('shift')) prefix += '+';
      if (modifiers.includes('alt')) prefix += '%';
      const keyStr = key.length > 1 ? `{${key.toUpperCase()}}` : key;
      const psCommand = `powershell -Command "$wshell = New-Object -ComObject wscript.shell; $wshell.SendKeys('${prefix}${keyStr}')"`;
      exec(psCommand, (err) => resolve(!err));
    } else {
      resolve(true);
    }
  });
}

async function handleActionExecution(action) {
  if (!action || !action.type) return { success: false, error: 'No action specified' };
  try {
    switch (action.type) {
      case 'obs_scene': {
        const sceneName = action.target || action.sceneName;
        await obs.call('SetCurrentProgramScene', { sceneName });
        obsState.currentScene = sceneName;
        io.emit('obs:state', obsState);
        return { success: true, sceneName };
      }
      case 'obs_mute_toggle': {
        const inputName = action.target || action.inputName;
        const res = await obs.call('ToggleInputMute', { inputName });
        const item = obsState.audioInputs.find(i => i.inputName === inputName);
        if (item) item.muted = res.inputMuted;
        io.emit('obs:state', obsState);
        return { success: true, muted: res.inputMuted, inputName };
      }
      case 'obs_copyright_panic': {
        const defaultMusicKeywords = ['music', 'música', 'spotify', 'chrome', 'browser', 'pista', 'track', 'vod'];
        const targets = action.targets || defaultMusicKeywords;
        const mutedList = [];
        for (const input of obsState.audioInputs) {
          const lower = input.inputName.toLowerCase();
          if (targets.some(k => lower.includes(k.toLowerCase())) || targets.includes(input.inputName)) {
            try {
              await obs.call('SetInputMute', { inputName: input.inputName, inputMuted: true });
              input.muted = true;
              mutedList.push(input.inputName);
            } catch {}
          }
        }
        io.emit('obs:state', obsState);
        return { success: true, mutedInputs: mutedList };
      }
      case 'obs_toggle_stream': {
        const res = await obs.call('ToggleStream');
        obsState.isStreaming = res.outputActive;
        io.emit('obs:state', obsState);
        return { success: true, isStreaming: res.outputActive };
      }
      case 'obs_toggle_record': {
        const res = await obs.call('ToggleRecord');
        obsState.isRecording = res.outputActive;
        io.emit('obs:state', obsState);
        return { success: true, isRecording: res.outputActive };
      }
      case 'hotkey': {
        const ok = await sendSystemHotkey(action.key || action.target || 'F13', action.modifiers || []);
        return { success: ok };
      }
      default:
        return { success: true, action };
    }
  } catch (err) {
    return { success: false, error: err?.message || 'Error executing action' };
  }
}

// Serve static frontend files if built
app.use(express.static(path.resolve(__dirname, 'dist')));

app.get('/api/network-ips', (req, res) => {
  const ips = getLocalNetworkIps();
  const port = process.env.PORT || 3000;
  res.json({ ips, port, suggestedUrls: ips.map(ip => `http://${ip}:${port}`) });
});

app.get('/api/obs/status', (req, res) => res.json(obsState));
app.post('/api/obs/connect', async (req, res) => {
  await connectToOBS(req.body.url, req.body.password);
  res.json(obsState);
});

app.get('/api/firewall-helper', (req, res) => {
  const port = process.env.PORT || 3000;
  res.json({
    cmd: `netsh advfirewall firewall add rule name="Zeus Stream Deck (${port})" dir=in action=allow protocol=TCP localport=${port}`
  });
});

io.on('connection', (socket) => {
  socket.emit('obs:state', obsState);
  socket.on('obs:connect', (data) => connectToOBS(data?.url, data?.password));
  socket.on('action:execute', async (action, cb) => {
    const res = await handleActionExecution(action);
    if (cb) cb(res);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`⚡ Zeus Stream Deck Server running on port ${PORT}`);
  console.log(`🖥️  Local: http://localhost:${PORT}`);
  getLocalNetworkIps().forEach(ip => console.log(`📱  Móvil: http://${ip}:${PORT}`));
});

import React, { useState } from 'react';
import { X, Tv, RefreshCw, CheckCircle2, AlertCircle, Radio, Mic, ShieldCheck, Key } from 'lucide-react';
import { OBSState } from '../types.ts';

interface OBSConfigModalProps {
  obsState: OBSState;
  onConnect: (url: string, password?: string) => void;
  onDisconnect: () => void;
  onRefresh: () => void;
  onClose: () => void;
}

export const OBSConfigModal: React.FC<OBSConfigModalProps> = ({
  obsState,
  onConnect,
  onDisconnect,
  onRefresh,
  onClose
}) => {
  const [url, setUrl] = useState(obsState.url || 'ws://127.0.0.1:4455');
  const [password, setPassword] = useState(obsState.password || '');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConnect(url.trim(), password.trim());
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden my-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-zinc-800 bg-zinc-950/60">
          <div className="flex items-center gap-2">
            <Tv className="text-amber-400" size={20} />
            <h3 className="font-bold text-base text-zinc-100">Configuración OBS WebSocket (v5)</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto text-sm text-zinc-200">
          {/* Connection Status Banner */}
          <div
            className={`p-3.5 rounded-xl border flex items-center justify-between ${
              obsState.connected
                ? 'bg-emerald-950/30 border-emerald-800/60 text-emerald-300'
                : obsState.connecting
                ? 'bg-amber-950/30 border-amber-800/60 text-amber-300'
                : 'bg-zinc-950 border-zinc-800 text-zinc-400'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <span
                className={`w-3 h-3 rounded-full ${
                  obsState.connected
                    ? 'bg-emerald-400 shadow-md shadow-emerald-400/50'
                    : obsState.connecting
                    ? 'bg-amber-400 animate-ping'
                    : 'bg-zinc-600'
                }`}
              />
              <div>
                <div className="font-bold text-xs uppercase tracking-wider">
                  {obsState.connected
                    ? 'Conectado a OBS Studio'
                    : obsState.connecting
                    ? 'Conectando...'
                    : 'OBS Desconectado'}
                </div>
                {obsState.currentScene && (
                  <div className="text-[11px] text-zinc-300">
                    Escena activa: <strong className="text-white">{obsState.currentScene}</strong>
                  </div>
                )}
                {obsState.lastError && !obsState.connected && (
                  <div className="text-[11px] text-rose-400 mt-0.5">
                    {obsState.lastError}
                  </div>
                )}
              </div>
            </div>

            {obsState.connected && (
              <button
                type="button"
                onClick={onRefresh}
                className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition-colors"
                title="Actualizar escenas y pistas"
              >
                <RefreshCw size={15} />
              </button>
            )}
          </div>

          {/* Connect Form */}
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-1">
                Dirección del Servidor WebSocket OBS
              </label>
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="ws://127.0.0.1:4455"
                className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-white font-mono text-xs focus:outline-none focus:border-amber-400"
              />
              <span className="text-[11px] text-zinc-500 mt-1 block">
                Por defecto en OBS Studio 28+ es <code>ws://127.0.0.1:4455</code>
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-1">
                Contraseña (si está activada en OBS)
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Vacío si no tiene contraseña"
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 pr-16 text-white text-xs focus:outline-none focus:border-amber-400 font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-2 text-[11px] text-zinc-400 hover:text-white px-1.5 py-0.5 bg-zinc-800 rounded"
                >
                  {showPassword ? 'Ocultar' : 'Ver'}
                </button>
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <button
                type="submit"
                disabled={obsState.connecting}
                className="flex-1 py-2 px-4 rounded-lg bg-amber-400 hover:bg-amber-300 text-black font-bold text-xs transition-colors shadow-md shadow-amber-400/20 disabled:opacity-50"
              >
                {obsState.connected ? 'Reconectar con OBS' : 'Conectar con OBS'}
              </button>
              {obsState.connected && (
                <button
                  type="button"
                  onClick={onDisconnect}
                  className="py-2 px-4 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-rose-400 font-semibold text-xs transition-colors"
                >
                  Desconectar
                </button>
              )}
            </div>
          </form>

          {/* Live Telemetry View when Connected */}
          {obsState.connected && (
            <div className="space-y-3 pt-2 border-t border-zinc-800">
              <div>
                <h5 className="font-semibold text-xs text-zinc-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <Tv size={14} className="text-blue-400" />
                  Escenas detectadas ({obsState.scenes.length})
                </h5>
                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-1.5 bg-zinc-950 rounded-lg border border-zinc-800">
                  {obsState.scenes.map((s) => (
                    <span
                      key={s}
                      className={`px-2 py-0.5 rounded text-[11px] ${
                        s === obsState.currentScene
                          ? 'bg-blue-600 text-white font-bold'
                          : 'bg-zinc-800 text-zinc-300'
                      }`}
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <h5 className="font-semibold text-xs text-zinc-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <Mic size={14} className="text-emerald-400" />
                  Pistas y Fuentes de Audio ({obsState.audioInputs.length})
                </h5>
                <div className="space-y-1 max-h-28 overflow-y-auto p-1.5 bg-zinc-950 rounded-lg border border-zinc-800 text-xs">
                  {obsState.audioInputs.map((a) => (
                    <div
                      key={a.inputName}
                      className="flex items-center justify-between px-2 py-1 rounded bg-zinc-900"
                    >
                      <span className="font-medium text-zinc-200">{a.inputName}</span>
                      <span
                        className={`text-[10px] px-1.5 py-0.2 rounded font-bold uppercase ${
                          a.muted ? 'bg-rose-950 text-rose-400 border border-rose-800/60' : 'bg-emerald-950 text-emerald-400 border border-emerald-800/60'
                        }`}
                      >
                        {a.muted ? 'Silenciado' : 'Activo'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Quick Setup instructions */}
          <div className="bg-zinc-950 p-3.5 rounded-xl border border-zinc-800 text-xs text-zinc-400 space-y-1.5">
            <div className="font-bold text-zinc-200 flex items-center gap-1.5">
              <span>💡</span> ¿Cómo activar WebSocket en OBS Studio?
            </div>
            <ol className="list-decimal pl-4 space-y-1 text-zinc-400 text-[11px]">
              <li>En OBS Studio, ve al menú superior: <strong>Herramientas &gt; Configuración del servidor WebSocket</strong>.</li>
              <li>Marca la casilla <strong>"Habilitar el servidor WebSocket"</strong>.</li>
              <li>Verifica que el puerto del servidor sea <strong>4455</strong>.</li>
              <li>Si habilitas autenticación, copia la contraseña generada o desmárcala para red local.</li>
              <li>Haz clic en <strong>Aplicar</strong> y luego presiona "Conectar con OBS" arriba.</li>
            </ol>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end px-5 py-3 border-t border-zinc-800 bg-zinc-950/80">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-semibold transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

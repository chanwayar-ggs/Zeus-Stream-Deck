import React, { useState } from 'react';
import { DeckKey, ActionType, OBSState } from '../types.ts';
import { KeyIcon } from './KeyIcon.tsx';
import { X, Trash2, Play, Check } from 'lucide-react';

interface KeyEditorModalProps {
  deckKey: DeckKey;
  obsState: OBSState;
  onSave: (updatedKey: DeckKey) => void;
  onDelete: (keyId: string) => void;
  onClose: () => void;
  onTest: (key: DeckKey) => void;
}

const POPULAR_ICONS = [
  'Tv', 'Radio', 'Mic', 'MicOff', 'Music', 'Volume2', 'VolumeX',
  'ShieldAlert', 'Gamepad2', 'MessageSquare', 'Layers', 'Camera',
  'Play', 'Pause', 'Disc', 'Clock', 'Zap', 'Bell', 'Flame', 'Coffee',
  'Sparkles', 'Monitor', 'Globe', 'Headphones', 'Eye', 'EyeOff', 'RotateCcw'
];

const POPULAR_COLORS = [
  { bg: '#1e1e1e', text: '#ffffff', name: 'Gris Oscuro' },
  { bg: '#1e3a5f', text: '#60a5fa', name: 'Azul OBS' },
  { bg: '#064e3b', text: '#34d399', name: 'Verde Spotify' },
  { bg: '#831843', text: '#f472b6', name: 'Rosa Mic' },
  { bg: '#7f1d1d', text: '#f87171', name: 'Rojo Pánico' },
  { bg: '#78350f', text: '#fbbf24', name: 'Ámbar Alerta' },
  { bg: '#4c1d95', text: '#c084fc', name: 'Púrpura Twitch' },
  { bg: '#312e81', text: '#818cf8', name: 'Índigo Discord' },
  { bg: '#172554', text: '#93c5fd', name: 'Azul Marino' },
  { bg: '#0f172a', text: '#38bdf8', name: 'Cian Neón' },
];

export const KeyEditorModal: React.FC<KeyEditorModalProps> = ({
  deckKey,
  obsState,
  onSave,
  onDelete,
  onClose,
  onTest
}) => {
  const [label, setLabel] = useState(deckKey.label || '');
  const [sublabel, setSublabel] = useState(deckKey.sublabel || '');
  const [icon, setIcon] = useState(deckKey.icon || 'Tv');
  const [bgColor, setBgColor] = useState(deckKey.bgColor || '#1e3a5f');
  const [textColor, setTextColor] = useState(deckKey.textColor || '#ffffff');
  const [actionType, setActionType] = useState<ActionType>(deckKey.actionType || 'obs_scene');
  const [actionTarget, setActionTarget] = useState(deckKey.actionTarget || '');
  const [modifiers, setModifiers] = useState<string[]>(deckKey.modifiers || []);

  const handleModifierToggle = (mod: string) => {
    if (modifiers.includes(mod)) {
      setModifiers(modifiers.filter(m => m !== mod));
    } else {
      setModifiers([...modifiers, mod]);
    }
  };

  const handleSave = () => {
    const updated: DeckKey = {
      ...deckKey,
      label: label.trim(),
      sublabel: sublabel.trim(),
      icon: icon.trim(),
      bgColor,
      textColor,
      actionType,
      actionTarget: actionTarget.trim(),
      modifiers
    };
    onSave(updated);
  };

  const currentPreviewKey: DeckKey = {
    ...deckKey,
    label: label || 'Vista Previa',
    sublabel: sublabel,
    icon,
    bgColor,
    textColor,
    actionType,
    actionTarget,
    modifiers
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden my-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-zinc-800 bg-zinc-950/50">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
            <h3 className="font-bold text-base text-zinc-100">Configurar Tecla</h3>
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
          {/* Live Preview Box */}
          <div className="flex items-center justify-center gap-4 p-3 bg-black/40 rounded-xl border border-zinc-800/80">
            <div className="text-xs text-zinc-400">Previsualización:</div>
            <div
              style={{ backgroundColor: bgColor, color: textColor }}
              className="w-20 h-20 rounded-xl border border-zinc-700/80 p-2 flex flex-col items-center justify-between shadow-lg"
            >
              <KeyIcon name={icon} size={28} />
              <div className="text-center w-full">
                <div className="font-bold text-[11px] truncate">{label || 'Tecla'}</div>
                {sublabel && <div className="text-[9px] opacity-70 truncate">{sublabel}</div>}
              </div>
            </div>
            <button
              type="button"
              onClick={() => onTest(currentPreviewKey)}
              className="flex items-center gap-1.5 px-3 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-xs font-semibold text-amber-300 transition-colors"
            >
              <Play size={14} /> Probar
            </button>
          </div>

          {/* Action Type */}
          <div>
            <label className="block text-xs font-semibold text-zinc-400 mb-1.5 uppercase tracking-wide">
              Tipo de Acción
            </label>
            <select
              value={actionType}
              onChange={(e) => {
                const newType = e.target.value as ActionType;
                setActionType(newType);
                if (newType === 'obs_copyright_panic' && !label) {
                  setLabel('ANTI-COPY');
                  setSublabel('Mute Música');
                  setIcon('ShieldAlert');
                  setBgColor('#7f1d1d');
                  setTextColor('#f87171');
                } else if (newType === 'obs_toggle_stream' && !label) {
                  setLabel('STREAM');
                  setSublabel('En Vivo');
                  setIcon('Radio');
                  setBgColor('#78350f');
                  setTextColor('#fbbf24');
                }
              }}
              className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-400"
            >
              <optgroup label="OBS Studio">
                <option value="obs_scene">OBS: Cambiar Escena</option>
                <option value="obs_mute_toggle">OBS: Silenciar / Activar Audio (Toggle)</option>
                <option value="obs_copyright_panic">OBS: 🚨 Pánico Anti-Copyright (Mute Música)</option>
                <option value="obs_toggle_stream">OBS: Iniciar / Parar Streaming</option>
                <option value="obs_toggle_record">OBS: Iniciar / Parar Grabación</option>
                <option value="obs_pause_record">OBS: Pausar Grabación</option>
                <option value="obs_screenshot">OBS: Tomar Captura de Pantalla</option>
                <option value="obs_studio_mode">OBS: Alternar Modo Estudio</option>
              </optgroup>
              <optgroup label="Sistema & PC">
                <option value="hotkey">Atajo de Teclado PC (F13-F24 / Teclas Macro)</option>
                <option value="sound_effect">Efecto de Sonido (Soundboard)</option>
                <option value="url_open">Abrir Enlace Web (Twitch, YouTube)</option>
                <option value="none">Sin Acción (Vacío)</option>
              </optgroup>
            </select>
          </div>

          {/* Dynamic Target Selection based on Action Type */}
          {actionType === 'obs_scene' && (
            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-1.5">
                Nombre de la Escena en OBS
              </label>
              {obsState.scenes.length > 0 ? (
                <div className="space-y-2">
                  <select
                    value={actionTarget}
                    onChange={(e) => setActionTarget(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-400"
                  >
                    <option value="">-- Selecciona una escena detectada --</option>
                    {obsState.scenes.map((s) => (
                      <option key={s} value={s}>
                        {s} {s === obsState.currentScene ? '(Activa ahora)' : ''}
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    placeholder="O escribe nombre personalizado de escena"
                    value={actionTarget}
                    onChange={(e) => setActionTarget(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-zinc-300"
                  />
                </div>
              ) : (
                <input
                  type="text"
                  placeholder="Ej: Gameplay, Charla, Inicio..."
                  value={actionTarget}
                  onChange={(e) => setActionTarget(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-400"
                />
              )}
            </div>
          )}

          {actionType === 'obs_mute_toggle' && (
            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-1.5">
                Fuente o Pista de Audio en OBS
              </label>
              {obsState.audioInputs.length > 0 ? (
                <div className="space-y-2">
                  <select
                    value={actionTarget}
                    onChange={(e) => setActionTarget(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-400"
                  >
                    <option value="">-- Selecciona una fuente de audio --</option>
                    {obsState.audioInputs.map((input) => (
                      <option key={input.inputName} value={input.inputName}>
                        {input.inputName} ({input.muted ? 'Silenciado' : 'Activo'})
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    placeholder="O escribe nombre exacto (ej: Spotify, Micrófono, Desktop Audio)"
                    value={actionTarget}
                    onChange={(e) => setActionTarget(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-zinc-300"
                  />
                </div>
              ) : (
                <input
                  type="text"
                  placeholder="Ej: Spotify, Micrófono, Audio del Escritorio"
                  value={actionTarget}
                  onChange={(e) => setActionTarget(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-400"
                />
              )}
            </div>
          )}

          {actionType === 'obs_copyright_panic' && (
            <div className="p-3 bg-red-950/40 border border-red-900/60 rounded-xl text-xs text-red-200">
              <div className="font-bold flex items-center gap-1.5 text-red-400">
                <span className="text-base">🚨</span> Modo Pánico Anti-Copyright
              </div>
              <p className="mt-1">
                Al presionar esta tecla, el servidor muteará de inmediato todas las pistas que contengan palabras como "music", "spotify", "chrome", "vod" o pista configurada, salvando tu directo de reclamaciones de copyright o silenciamientos VOD.
              </p>
            </div>
          )}

          {actionType === 'hotkey' && (
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-zinc-400 mb-1">
                Tecla o Macro de PC
              </label>
              <div className="flex gap-2">
                {['ctrl', 'shift', 'alt'].map((mod) => (
                  <button
                    key={mod}
                    type="button"
                    onClick={() => handleModifierToggle(mod)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition-all ${
                      modifiers.includes(mod)
                        ? 'bg-amber-400 text-black'
                        : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                    }`}
                  >
                    {mod}
                  </button>
                ))}
              </div>
              <select
                value={actionTarget}
                onChange={(e) => setActionTarget(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-400"
              >
                <option value="F13">F13 (Ideal para streamers sin conflicto)</option>
                <option value="F14">F14</option>
                <option value="F15">F15</option>
                <option value="F16">F16</option>
                <option value="F17">F17</option>
                <option value="F18">F18</option>
                <option value="F19">F19</option>
                <option value="F20">F20</option>
                <option value="F21">F21</option>
                <option value="F22">F22</option>
                <option value="F23">F23</option>
                <option value="F24">F24</option>
                <option value="M">M (Mute toggle común)</option>
                <option value="MEDIA_PLAY_PAUSE">Reproducir / Pausar Multimedia</option>
                <option value="VOLUME_MUTE">Silenciar Volumen PC</option>
              </select>
            </div>
          )}

          {actionType === 'sound_effect' && (
            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-1.5">
                Efecto de Sonido
              </label>
              <select
                value={actionTarget}
                onChange={(e) => setActionTarget(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-400"
              >
                <option value="airhorn">Bocina de Aire / Airhorn</option>
                <option value="chime">Campana de Éxito / Chime</option>
              </select>
            </div>
          )}

          {actionType === 'url_open' && (
            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-1.5">
                URL de Destino
              </label>
              <input
                type="url"
                placeholder="https://dashboard.twitch.tv..."
                value={actionTarget}
                onChange={(e) => setActionTarget(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-400"
              />
            </div>
          )}

          {/* Labels */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-1">
                Texto Principal
              </label>
              <input
                type="text"
                maxLength={14}
                placeholder="Ej: Spotify"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-400"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-1">
                Subtexto
              </label>
              <input
                type="text"
                maxLength={18}
                placeholder="Ej: Mute/Unmute"
                value={sublabel}
                onChange={(e) => setSublabel(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>

          {/* Icon Selector */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">
                Icono o Emoji
              </label>
              <span className="text-[11px] text-zinc-500">Selecciona o escribe abajo</span>
            </div>
            <div className="flex flex-wrap gap-1.5 p-2 bg-zinc-950 rounded-xl border border-zinc-800 max-h-32 overflow-y-auto">
              {POPULAR_ICONS.map((ic) => (
                <button
                  key={ic}
                  type="button"
                  onClick={() => setIcon(ic)}
                  className={`p-2 rounded-lg transition-all ${
                    icon === ic
                      ? 'bg-amber-400 text-black font-bold scale-110 shadow'
                      : 'bg-zinc-900 text-zinc-300 hover:bg-zinc-800'
                  }`}
                >
                  <KeyIcon name={ic} size={18} />
                </button>
              ))}
            </div>
            <div className="mt-2 flex gap-2">
              <input
                type="text"
                placeholder="Nombre de icono Lucide o Emoji (ej: ⚡, 🎧, Flame)"
                value={icon}
                onChange={(e) => setIcon(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-white"
              />
            </div>
          </div>

          {/* Color Presets */}
          <div>
            <label className="block text-xs font-semibold text-zinc-400 mb-1.5 uppercase tracking-wide">
              Estilo y Color
            </label>
            <div className="grid grid-cols-5 gap-2">
              {POPULAR_COLORS.map((c, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    setBgColor(c.bg);
                    setTextColor(c.text);
                  }}
                  style={{ backgroundColor: c.bg, color: c.text }}
                  className={`h-9 rounded-lg border flex items-center justify-center font-bold text-xs transition-all ${
                    bgColor === c.bg ? 'ring-2 ring-white scale-105 border-white' : 'border-zinc-700'
                  }`}
                >
                  {bgColor === c.bg && <Check size={14} />}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-zinc-800 bg-zinc-950/80">
          <button
            type="button"
            onClick={() => onDelete(deckKey.id)}
            className="flex items-center gap-1.5 text-rose-400 hover:text-rose-300 px-3 py-2 rounded-lg hover:bg-rose-950/40 text-xs font-semibold transition-colors"
          >
            <Trash2 size={16} /> Vaciar Tecla
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold transition-colors"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 rounded-lg bg-amber-400 hover:bg-amber-300 text-black text-xs font-bold transition-transform active:scale-95 shadow-md shadow-amber-400/20"
            >
              Guardar Tecla
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { X, User, Plus, Trash2, Download, Upload, Copy, Check } from 'lucide-react';
import { DeckProfile } from '../types.ts';
import { createEmptyKeys } from '../utils/storage.ts';

interface ProfileModalProps {
  profiles: DeckProfile[];
  activeProfileId: string;
  onSelectProfile: (profileId: string) => void;
  onCreateProfile: (name: string, avatar: string) => void;
  onDeleteProfile: (profileId: string) => void;
  onImportProfiles: (importedProfiles: DeckProfile[]) => void;
  onClose: () => void;
}

const AVATAR_OPTIONS = ['👤', '⚡', '🎮', '🎙️', '🎧', '🎬', '🔥', '🚀', '⭐', '💀'];

export const ProfileModal: React.FC<ProfileModalProps> = ({
  profiles,
  activeProfileId,
  onSelectProfile,
  onCreateProfile,
  onDeleteProfile,
  onImportProfiles,
  onClose
}) => {
  const [newProfileName, setNewProfileName] = useState('');
  const [newProfileAvatar, setNewProfileAvatar] = useState('⚡');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProfileName.trim()) return;
    onCreateProfile(newProfileName.trim(), newProfileAvatar);
    setNewProfileName('');
    setShowCreateForm(false);
  };

  const handleExportBackup = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(profiles, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `zeus_stream_deck_backup_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportError(null);
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].tabs) {
          onImportProfiles(parsed);
          onClose();
        } else {
          setImportError('El archivo no contiene un formato de perfil de Zeus Stream Deck válido.');
        }
      } catch (err) {
        setImportError('Error leyendo el archivo JSON.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden my-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-zinc-800 bg-zinc-950/60">
          <div className="flex items-center gap-2">
            <User className="text-amber-400" size={20} />
            <h3 className="font-bold text-base text-zinc-100">Perfiles de Stream Deck</h3>
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
          {importError && (
            <div className="p-2.5 bg-rose-950/60 border border-rose-800 text-rose-300 rounded-lg text-xs">
              {importError}
            </div>
          )}

          {/* Profile List */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wide block">
              Perfiles Activos
            </label>
            <div className="space-y-2">
              {profiles.map((p) => {
                const isActive = p.id === activeProfileId;
                return (
                  <div
                    key={p.id}
                    onClick={() => onSelectProfile(p.id)}
                    className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                      isActive
                        ? 'bg-amber-400/10 border-amber-400/80 text-white shadow-sm'
                        : 'bg-zinc-950 border-zinc-800 hover:border-zinc-700 text-zinc-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-xl shrink-0">
                        {p.avatar || '👤'}
                      </div>
                      <div>
                        <div className="font-bold text-sm flex items-center gap-2">
                          <span>{p.name}</span>
                          {isActive && (
                            <span className="px-1.5 py-0.2 bg-amber-400 text-black rounded text-[10px] font-black uppercase">
                              Activo
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-zinc-400">
                          {p.tabs?.length || 0} páginas • 24 teclas por página
                        </div>
                      </div>
                    </div>

                    {profiles.length > 1 && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm(`¿Eliminar perfil "${p.name}"?`)) {
                            onDeleteProfile(p.id);
                          }
                        }}
                        className="p-2 text-zinc-500 hover:text-rose-400 rounded-lg hover:bg-zinc-900 transition-colors"
                        title="Eliminar perfil"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Create new profile toggle/form */}
          {showCreateForm ? (
            <form onSubmit={handleCreate} className="p-3.5 bg-zinc-950 rounded-xl border border-zinc-800 space-y-3">
              <h4 className="font-bold text-xs text-amber-300 uppercase tracking-wide">
                Crear Nuevo Perfil
              </h4>
              <div className="flex gap-2">
                <div className="space-y-1">
                  <label className="text-[11px] text-zinc-400">Icono</label>
                  <select
                    value={newProfileAvatar}
                    onChange={(e) => setNewProfileAvatar(e.target.value)}
                    className="bg-zinc-900 border border-zinc-700 rounded-lg p-2 text-lg text-white"
                  >
                    {AVATAR_OPTIONS.map((av) => (
                      <option key={av} value={av}>{av}</option>
                    ))}
                  </select>
                </div>
                <div className="flex-1 space-y-1">
                  <label className="text-[11px] text-zinc-400">Nombre del Perfil</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Podcast, Just Chatting, Música..."
                    value={newProfileName}
                    onChange={(e) => setNewProfileName(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="px-3 py-1.5 rounded-lg bg-zinc-800 text-zinc-300 text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-black text-xs font-bold"
                >
                  Crear Perfil
                </button>
              </div>
            </form>
          ) : (
            <button
              type="button"
              onClick={() => setShowCreateForm(true)}
              className="w-full py-2.5 px-3 border border-dashed border-zinc-700 hover:border-amber-400/80 rounded-xl flex items-center justify-center gap-2 text-xs font-semibold text-zinc-300 hover:text-white transition-colors"
            >
              <Plus size={16} /> Añadir Nuevo Perfil
            </button>
          )}

          {/* Backup & Restore */}
          <div className="pt-2 border-t border-zinc-800 space-y-2">
            <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wide block">
              Copia de Seguridad (Backup)
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleExportBackup}
                className="flex items-center justify-center gap-2 p-2.5 bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 rounded-xl text-xs font-medium text-zinc-300 transition-colors"
              >
                <Download size={15} /> Exportar JSON
              </button>

              <label className="flex items-center justify-center gap-2 p-2.5 bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 rounded-xl text-xs font-medium text-zinc-300 cursor-pointer transition-colors">
                <Upload size={15} /> Importar JSON
                <input
                  type="file"
                  accept=".json,application/json"
                  onChange={handleImportFile}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end px-5 py-3 border-t border-zinc-800 bg-zinc-950/80">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-semibold transition-colors"
          >
            Listo
          </button>
        </div>
      </div>
    </div>
  );
};

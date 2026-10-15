import React, { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import {
  DeckKey,
  DeckProfile,
  DeckTab,
  OBSState,
  NetworkInfo
} from './types.ts';
import { loadProfiles, saveProfiles, createEmptyKeys } from './utils/storage.ts';
import { KeyButton } from './components/KeyButton.tsx';
import { KeyEditorModal } from './components/KeyEditorModal.tsx';
import { ConnectModal } from './components/ConnectModal.tsx';
import { OBSConfigModal } from './components/OBSConfigModal.tsx';
import { CoffeeModal } from './components/CoffeeModal.tsx';
import { ProfileModal } from './components/ProfileModal.tsx';
import {
  Tv,
  Wifi,
  WifiOff,
  Smartphone,
  Coffee,
  Edit3,
  Plus,
  ShieldAlert,
  Settings2,
  Volume2,
  Radio,
  Disc,
  Layers,
  Zap,
  MoreHorizontal
} from 'lucide-react';

export default function App() {
  // Profiles & Tabs state
  const [profiles, setProfiles] = useState<DeckProfile[]>([]);
  const [activeProfileId, setActiveProfileId] = useState<string>('');
  const [activeTabId, setActiveTabId] = useState<string>('');

  // Socket & Server State
  const socketRef = useRef<Socket | null>(null);
  const [socketConnected, setSocketConnected] = useState<boolean>(false);
  const [pingMs, setPingMs] = useState<number | null>(null);
  const [networkInfo, setNetworkInfo] = useState<NetworkInfo | null>(null);

  // OBS Telemetry State
  const [obsState, setObsState] = useState<OBSState>({
    connected: false,
    connecting: false,
    url: 'ws://127.0.0.1:4455',
    currentScene: '',
    scenes: [],
    audioInputs: [],
    isStreaming: false,
    isRecording: false,
    isRecordingPaused: false,
    lastError: null
  });

  // UI Modals
  const [editingKey, setEditingKey] = useState<DeckKey | null>(null);
  const [showConnectModal, setShowConnectModal] = useState<boolean>(false);
  const [showOBSModal, setShowOBSModal] = useState<boolean>(false);
  const [showCoffeeModal, setShowCoffeeModal] = useState<boolean>(false);
  const [showProfileModal, setShowProfileModal] = useState<boolean>(false);
  const [isEditMode, setIsEditMode] = useState<boolean>(false);

  // Feedback Notification Banner
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'alert' | 'info' } | null>(null);

  const showToast = (text: string, type: 'success' | 'alert' | 'info' = 'info') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3000);
  };

  // 1. Initial Load of Profiles from localStorage
  useEffect(() => {
    const { profiles: loaded, activeProfileId: activeId } = loadProfiles();
    setProfiles(loaded);
    setActiveProfileId(activeId);
    const activeProf = loaded.find(p => p.id === activeId) || loaded[0];
    if (activeProf && activeProf.tabs.length > 0) {
      setActiveTabId(activeProf.tabs[0].id);
    }
  }, []);

  // 2. Fetch Network Info from REST endpoint
  const fetchNetworkInfo = async () => {
    try {
      const res = await fetch('/api/network-ips');
      if (res.ok) {
        const data = await res.json();
        setNetworkInfo(data);
      }
    } catch (e) {
      console.warn('Could not fetch network info directly', e);
    }
  };

  useEffect(() => {
    fetchNetworkInfo();
  }, []);

  // 3. Setup Socket.IO client
  useEffect(() => {
    const socket = io({
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 20,
      reconnectionDelay: 1000
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      setSocketConnected(true);
      fetchNetworkInfo();
      // Measure ping
      const start = Date.now();
      socket.emit('ping:check', start, () => {
        setPingMs(Date.now() - start);
      });
    });

    socket.on('disconnect', () => {
      setSocketConnected(false);
      setPingMs(null);
    });

    socket.on('obs:state', (state: OBSState) => {
      setObsState(state);
    });

    socket.on('network:ips', (info: NetworkInfo) => {
      setNetworkInfo(info);
    });

    socket.on('obs:scene-changed', (data: { sceneName: string }) => {
      setObsState(prev => ({ ...prev, currentScene: data.sceneName }));
      showToast(`Escena OBS: ${data.sceneName}`, 'info');
    });

    socket.on('obs:mute-changed', (data: { inputName: string; inputMuted: boolean }) => {
      setObsState(prev => {
        const updated = prev.audioInputs.map(item =>
          item.inputName === data.inputName ? { ...item, muted: data.inputMuted } : item
        );
        return { ...prev, audioInputs: updated };
      });
      showToast(`${data.inputName}: ${data.inputMuted ? 'SILENCIADO' : 'ACTIVO'}`, data.inputMuted ? 'alert' : 'success');
    });

    // Periodic ping
    const pingInterval = setInterval(() => {
      if (socket.connected) {
        const start = Date.now();
        socket.emit('ping:check', start, () => {
          setPingMs(Date.now() - start);
        });
      }
    }, 10000);

    return () => {
      clearInterval(pingInterval);
      socket.disconnect();
    };
  }, []);

  // Active Profile & Tab calculations
  const activeProfile = profiles.find(p => p.id === activeProfileId) || profiles[0];
  const activeTab = activeProfile?.tabs.find(t => t.id === activeTabId) || activeProfile?.tabs[0];
  const currentKeys = activeTab?.keys || [];

  // Update profile in state and localStorage
  const updateProfiles = (newProfiles: DeckProfile[], newActiveId?: string) => {
    setProfiles(newProfiles);
    saveProfiles(newProfiles, newActiveId || activeProfileId);
  };

  // Execute an action clicked by user
  const handleExecuteKey = (deckKey: DeckKey) => {
    if (deckKey.actionType === 'none') return;

    if (deckKey.actionType === 'url_open' && deckKey.actionTarget) {
      window.open(deckKey.actionTarget, '_blank');
      return;
    }

    if (deckKey.actionType === 'obs_copyright_panic') {
      showToast('🚨 PÁNICO ANTI-COPYRIGHT: Silenciando música...', 'alert');
    }

    const payload = {
      type: deckKey.actionType,
      target: deckKey.actionTarget,
      sceneName: deckKey.actionTarget,
      inputName: deckKey.actionTarget,
      key: deckKey.actionTarget,
      modifiers: deckKey.modifiers,
      url: deckKey.actionTarget
    };

    if (socketRef.current && socketConnected) {
      socketRef.current.emit('action:execute', payload, (res: any) => {
        if (res && res.error) {
          showToast(`Error: ${res.error}`, 'alert');
        } else if (deckKey.actionType === 'obs_copyright_panic') {
          showToast('✅ Música protegida de copyright', 'success');
        }
      });
    } else {
      // Fallback via HTTP REST
      fetch('/api/action/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
        .then(r => r.json())
        .then(res => {
          if (res?.error) {
            showToast(`Aviso: ${res.error}`, 'alert');
          } else {
            showToast(`Ejecutado: ${deckKey.label}`, 'success');
          }
        })
        .catch(() => {
          showToast(`Sin conexión al servidor local`, 'alert');
        });
    }
  };

  // Save modified key
  const handleSaveKey = (updatedKey: DeckKey) => {
    if (!activeProfile || !activeTab) return;

    const updatedTabs = activeProfile.tabs.map(tab => {
      if (tab.id !== activeTab.id) return tab;
      const updatedKeys = tab.keys.map(k => (k.id === updatedKey.id ? updatedKey : k));
      return { ...tab, keys: updatedKeys };
    });

    const updatedProfiles = profiles.map(p =>
      p.id === activeProfile.id ? { ...p, tabs: updatedTabs } : p
    );

    updateProfiles(updatedProfiles);
    setEditingKey(null);
    showToast(`Tecla "${updatedKey.label || 'Configurada'}" guardada`, 'success');
  };

  // Delete / Reset key
  const handleDeleteKey = (keyId: string) => {
    if (!activeProfile || !activeTab) return;

    const updatedTabs = activeProfile.tabs.map(tab => {
      if (tab.id !== activeTab.id) return tab;
      const updatedKeys = tab.keys.map(k =>
        k.id === keyId
          ? {
              id: keyId,
              label: '',
              sublabel: '',
              icon: '',
              bgColor: '#1e1e1e',
              textColor: '#888888',
              actionType: 'none' as const
            }
          : k
      );
      return { ...tab, keys: updatedKeys };
    });

    const updatedProfiles = profiles.map(p =>
      p.id === activeProfile.id ? { ...p, tabs: updatedTabs } : p
    );

    updateProfiles(updatedProfiles);
    setEditingKey(null);
    showToast('Tecla vaciada', 'info');
  };

  // Tabs Management
  const handleAddTab = () => {
    if (!activeProfile) return;
    const tabNumber = activeProfile.tabs.length + 1;
    const newTab: DeckTab = {
      id: `tab_${Date.now()}`,
      name: `Pag ${tabNumber}`,
      keys: createEmptyKeys(24)
    };
    const updatedProfiles = profiles.map(p =>
      p.id === activeProfile.id ? { ...p, tabs: [...p.tabs, newTab] } : p
    );
    updateProfiles(updatedProfiles);
    setActiveTabId(newTab.id);
  };

  const handleRenameTab = (tabId: string, currentName: string) => {
    const newName = prompt('Nombre de la pestaña:', currentName);
    if (!newName || !newName.trim()) return;

    const updatedTabs = activeProfile.tabs.map(tab =>
      tab.id === tabId ? { ...tab, name: newName.trim() } : tab
    );
    const updatedProfiles = profiles.map(p =>
      p.id === activeProfile.id ? { ...p, tabs: updatedTabs } : p
    );
    updateProfiles(updatedProfiles);
  };

  const handleDeleteTab = (tabId: string) => {
    if (!activeProfile || activeProfile.tabs.length <= 1) {
      alert('Debes tener al menos una pestaña.');
      return;
    }
    if (!confirm('¿Eliminar esta pestaña y sus teclas?')) return;

    const updatedTabs = activeProfile.tabs.filter(t => t.id !== tabId);
    const updatedProfiles = profiles.map(p =>
      p.id === activeProfile.id ? { ...p, tabs: updatedTabs } : p
    );
    updateProfiles(updatedProfiles);
    setActiveTabId(updatedTabs[0].id);
  };

  // OBS Connect / Disconnect handlers
  const handleConnectOBS = (url: string, password?: string) => {
    if (socketRef.current) {
      socketRef.current.emit('obs:connect', { url, password });
    } else {
      fetch('/api/obs/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, password })
      });
    }
  };

  const handleDisconnectOBS = () => {
    if (socketRef.current) {
      socketRef.current.emit('obs:disconnect');
    } else {
      fetch('/api/obs/disconnect', { method: 'POST' });
    }
  };

  const handleRefreshOBS = () => {
    if (socketRef.current) {
      socketRef.current.emit('obs:refresh');
    }
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-[#121212] text-zinc-100 font-sans select-none overflow-hidden">
      {/* Toast Notification Alert */}
      {toastMessage && (
        <div
          className={`fixed top-14 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-xl text-xs font-bold shadow-2xl flex items-center gap-2 transition-all duration-200 border ${
            toastMessage.type === 'alert'
              ? 'bg-rose-950 text-rose-200 border-rose-800'
              : toastMessage.type === 'success'
              ? 'bg-emerald-950 text-emerald-200 border-emerald-800'
              : 'bg-zinc-900 text-zinc-200 border-zinc-700'
          }`}
        >
          {toastMessage.type === 'alert' && <ShieldAlert size={16} className="text-rose-400" />}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* HEADER */}
      <header className="flex items-center justify-between px-3 py-2.5 bg-[#1a1a1a] border-b border-[#2d2d2d] shrink-0 z-10 shadow-sm">
        {/* Left: Profile Switcher */}
        <div
          onClick={() => setShowProfileModal(true)}
          className="flex items-center gap-2 cursor-pointer hover:bg-zinc-800/80 px-2 py-1 rounded-lg transition-colors"
          title="Cambiar perfil"
        >
          <div className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-base shadow-inner">
            {activeProfile?.avatar || '👤'}
          </div>
          <div className="text-left hidden xs:block sm:block">
            <div className="text-xs font-bold text-zinc-200 leading-tight truncate max-w-[100px]">
              {activeProfile?.name || 'Usuario'}
            </div>
            <div className="text-[10px] text-zinc-400 leading-tight">Perfil</div>
          </div>
        </div>

        {/* Center: Title & Live Connection Status */}
        <div className="flex flex-col items-center">
          <div className="flex items-center gap-1.5">
            <span className="text-amber-400 font-black text-sm tracking-wide">⚡ ZEUS</span>
            <span className="font-extrabold text-sm tracking-wider text-zinc-200">STREAM DECK</span>
          </div>

          <div className="flex items-center gap-2 text-[10px]">
            {/* Socket Server Status */}
            <span
              className={`flex items-center gap-1 font-semibold ${
                socketConnected ? 'text-emerald-400' : 'text-rose-400'
              }`}
              title={socketConnected ? `PC Servidor Online (${pingMs || 0}ms)` : 'Servidor desconectado'}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${socketConnected ? 'bg-emerald-400' : 'bg-rose-500 animate-pulse'}`} />
              <span>{socketConnected ? `PC ${pingMs ? `${pingMs}ms` : 'OK'}` : 'Sin PC'}</span>
            </span>

            <span className="text-zinc-600">•</span>

            {/* OBS Studio Status Pill */}
            <button
              onClick={() => setShowOBSModal(true)}
              className={`flex items-center gap-1 font-semibold px-1.5 py-0.5 rounded transition-colors ${
                obsState.connected
                  ? 'bg-blue-950/60 text-blue-400 border border-blue-900/60 hover:bg-blue-900/40'
                  : 'bg-zinc-800/60 text-zinc-400 hover:text-white'
              }`}
              title="Configurar OBS WebSocket"
            >
              <Tv size={11} />
              <span>{obsState.connected ? (obsState.currentScene || 'OBS OK') : 'Conectar OBS'}</span>
            </button>
          </div>
        </div>

        {/* Right Actions: Mobile Connect, Edit Mode, Coffee */}
        <div className="flex items-center gap-1.5">
          {/* Mobile QR & Windows Firewall button */}
          <button
            onClick={() => setShowConnectModal(true)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-amber-400 text-xs font-semibold border border-zinc-700 transition-colors shadow-sm"
            title="Conectar Celular & Desbloquear Firewall de Windows"
          >
            <Smartphone size={14} />
            <span className="hidden sm:inline">Móvil / QR</span>
          </button>

          {/* Quick Edit Mode Toggle */}
          <button
            onClick={() => setIsEditMode(!isEditMode)}
            className={`p-1.5 rounded-lg border text-xs transition-colors ${
              isEditMode
                ? 'bg-amber-400 text-black border-amber-400 font-bold'
                : 'bg-zinc-800/80 text-zinc-400 border-zinc-700 hover:text-white'
            }`}
            title={isEditMode ? 'Salir del modo edición' : 'Activar modo edición directa'}
          >
            <Edit3 size={15} />
          </button>

          {/* Ko-fi Coffee Button */}
          <button
            onClick={() => setShowCoffeeModal(true)}
            className="flex items-center gap-1 px-2 py-1.5 rounded-lg bg-transparent hover:bg-zinc-800 text-zinc-300 text-xs font-medium border border-zinc-700 transition-colors"
            title="Apoyar el proyecto (Ko-fi)"
          >
            <Coffee size={14} className="text-amber-400" />
            <span className="hidden md:inline">Coffee</span>
          </button>
        </div>
      </header>

      {/* MAIN: 24 KEY DECK GRID */}
      <main className="flex-1 p-2 sm:p-3 overflow-y-auto overscroll-none touch-manipulation">
        <div className="h-full w-full max-w-4xl mx-auto grid grid-cols-4 sm:grid-cols-4 md:grid-cols-6 gap-2 sm:gap-2.5 content-start">
          {currentKeys.map((k) => (
            <KeyButton
              key={k.id}
              deckKey={k}
              obsState={obsState}
              isEditMode={isEditMode}
              onExecute={handleExecuteKey}
              onEdit={(keyToEdit) => setEditingKey(keyToEdit)}
            />
          ))}
        </div>
      </main>

      {/* FOOTER: TABS */}
      <footer className="flex items-center justify-between px-3 py-2 bg-[#1a1a1a] border-t border-[#2d2d2d] shrink-0">
        <div className="flex items-center gap-1.5 overflow-x-auto py-0.5 no-scrollbar flex-1 mr-2">
          {activeProfile?.tabs.map((tab) => {
            const isActive = tab.id === activeTabId;
            return (
              <div key={tab.id} className="relative group shrink-0">
                <button
                  onClick={() => setActiveTabId(tab.id)}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    handleRenameTab(tab.id, tab.name);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap border ${
                    isActive
                      ? 'bg-zinc-800 text-white border-zinc-600 shadow'
                      : 'bg-transparent text-zinc-400 border-transparent hover:text-zinc-200 hover:bg-zinc-900'
                  }`}
                  title={`${tab.name} (Clic derecho para renombrar)`}
                >
                  {tab.name}
                </button>
              </div>
            );
          })}

          {/* Add Tab Button */}
          <button
            onClick={handleAddTab}
            className="p-1.5 rounded-lg text-zinc-500 hover:text-white hover:bg-zinc-800 transition-colors shrink-0"
            title="Añadir nueva página de teclas"
          >
            <Plus size={16} />
          </button>
        </div>

        {/* Tab options menu */}
        {activeTab && (
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => handleRenameTab(activeTab.id, activeTab.name)}
              className="text-[11px] text-zinc-400 hover:text-white px-2 py-1 rounded bg-zinc-800/60 hover:bg-zinc-800 transition-colors"
              title="Renombrar pestaña actual"
            >
              Renombrar
            </button>
            {activeProfile && activeProfile.tabs.length > 1 && (
              <button
                onClick={() => handleDeleteTab(activeTab.id)}
                className="text-[11px] text-zinc-500 hover:text-rose-400 px-1.5 py-1 rounded hover:bg-zinc-900 transition-colors"
                title="Eliminar pestaña actual"
              >
                ✕
              </button>
            )}
          </div>
        )}
      </footer>

      {/* MODALS */}
      {editingKey && (
        <KeyEditorModal
          deckKey={editingKey}
          obsState={obsState}
          onSave={handleSaveKey}
          onDelete={handleDeleteKey}
          onClose={() => setEditingKey(null)}
          onTest={handleExecuteKey}
        />
      )}

      {showConnectModal && (
        <ConnectModal
          networkInfo={networkInfo}
          onClose={() => setShowConnectModal(false)}
          onRefreshIps={fetchNetworkInfo}
        />
      )}

      {showOBSModal && (
        <OBSConfigModal
          obsState={obsState}
          onConnect={handleConnectOBS}
          onDisconnect={handleDisconnectOBS}
          onRefresh={handleRefreshOBS}
          onClose={() => setShowOBSModal(false)}
        />
      )}

      {showCoffeeModal && (
        <CoffeeModal onClose={() => setShowCoffeeModal(false)} />
      )}

      {showProfileModal && (
        <ProfileModal
          profiles={profiles}
          activeProfileId={activeProfileId}
          onSelectProfile={(id) => {
            setActiveProfileId(id);
            const prof = profiles.find(p => p.id === id);
            if (prof && prof.tabs.length > 0) {
              setActiveTabId(prof.tabs[0].id);
            }
            saveProfiles(profiles, id);
          }}
          onCreateProfile={(name, avatar) => {
            const newProf: DeckProfile = {
              id: `prof_${Date.now()}`,
              name,
              avatar,
              gridCols: 4,
              gridRows: 6,
              tabs: [
                {
                  id: `tab_${Date.now()}`,
                  name: 'Pag 1',
                  keys: createEmptyKeys(24)
                }
              ]
            };
            const updated = [...profiles, newProf];
            updateProfiles(updated, newProf.id);
            setActiveTabId(newProf.tabs[0].id);
          }}
          onDeleteProfile={(id) => {
            const updated = profiles.filter(p => p.id !== id);
            updateProfiles(updated, updated[0].id);
            setActiveTabId(updated[0].tabs[0].id);
          }}
          onImportProfiles={(imported) => {
            updateProfiles(imported, imported[0].id);
            setActiveTabId(imported[0].tabs[0].id);
            showToast('Perfiles importados con éxito', 'success');
          }}
          onClose={() => setShowProfileModal(false)}
        />
      )}
    </div>
  );
}

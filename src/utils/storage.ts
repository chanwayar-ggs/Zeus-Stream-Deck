import { DeckProfile, DeckKey, DeckTab } from '../types.ts';

const STORAGE_KEY = 'zeus_stream_deck_profiles_v1';
const ACTIVE_PROFILE_KEY = 'zeus_stream_deck_active_profile_id';

export function createEmptyKeys(count = 24): DeckKey[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `key_${i + 1}`,
    label: '',
    sublabel: '',
    icon: '',
    bgColor: '#1e1e1e',
    textColor: '#888888',
    actionType: 'none',
  }));
}

export function getDefaultProfiles(): DeckProfile[] {
  const defaultKeysTab1: DeckKey[] = [
    {
      id: 'key_1',
      label: 'Inicio',
      sublabel: 'Escena OBS',
      icon: 'Tv',
      bgColor: '#1e3a5f',
      textColor: '#60a5fa',
      actionType: 'obs_scene',
      actionTarget: 'Inicio'
    },
    {
      id: 'key_2',
      label: 'Charla',
      sublabel: 'Just Chatting',
      icon: 'MessageSquare',
      bgColor: '#1e3a5f',
      textColor: '#60a5fa',
      actionType: 'obs_scene',
      actionTarget: 'Charla'
    },
    {
      id: 'key_3',
      label: 'Gameplay',
      sublabel: 'Juego Full',
      icon: 'Gamepad2',
      bgColor: '#1e3a5f',
      textColor: '#60a5fa',
      actionType: 'obs_scene',
      actionTarget: 'Gameplay'
    },
    {
      id: 'key_4',
      label: 'Pausa BRB',
      sublabel: 'Ya Vuelvo',
      icon: 'Clock',
      bgColor: '#4c1d95',
      textColor: '#c084fc',
      actionType: 'obs_scene',
      actionTarget: 'Pausa'
    },
    {
      id: 'key_5',
      label: 'Mute Mic',
      sublabel: 'Micrófono',
      icon: 'Mic',
      bgColor: '#831843',
      textColor: '#f472b6',
      actionType: 'obs_mute_toggle',
      actionTarget: 'Micrófono'
    },
    {
      id: 'key_6',
      label: 'Mute Música',
      sublabel: 'Spotify / Track',
      icon: 'Music',
      bgColor: '#064e3b',
      textColor: '#34d399',
      actionType: 'obs_mute_toggle',
      actionTarget: 'Spotify'
    },
    {
      id: 'key_7',
      label: '🚨 ANTI-COPY',
      sublabel: 'Pánico Música',
      icon: 'ShieldAlert',
      bgColor: '#7f1d1d',
      textColor: '#f87171',
      actionType: 'obs_copyright_panic',
      actionTarget: 'all_music'
    },
    {
      id: 'key_8',
      label: 'EN VIVO',
      sublabel: 'Iniciar Stream',
      icon: 'Radio',
      bgColor: '#78350f',
      textColor: '#fbbf24',
      actionType: 'obs_toggle_stream'
    },
    {
      id: 'key_9',
      label: 'GRABAR',
      sublabel: 'Rec Local',
      icon: 'Disc',
      bgColor: '#1f2937',
      textColor: '#f87171',
      actionType: 'obs_toggle_record'
    },
    {
      id: 'key_10',
      label: 'Pausar Rec',
      sublabel: 'Grabación',
      icon: 'Pause',
      bgColor: '#1f2937',
      textColor: '#9ca3af',
      actionType: 'obs_pause_record'
    },
    {
      id: 'key_11',
      label: 'Captura',
      sublabel: 'Screenshot',
      icon: 'Camera',
      bgColor: '#14532d',
      textColor: '#4ade80',
      actionType: 'obs_screenshot'
    },
    {
      id: 'key_12',
      label: 'Modo Estudio',
      sublabel: 'Preview/Prog',
      icon: 'Layers',
      bgColor: '#312e81',
      textColor: '#818cf8',
      actionType: 'obs_studio_mode'
    },
    {
      id: 'key_13',
      label: 'Bocina',
      sublabel: 'Airhorn',
      icon: 'Volume2',
      bgColor: '#78350f',
      textColor: '#fcd34d',
      actionType: 'sound_effect',
      actionTarget: 'airhorn'
    },
    {
      id: 'key_14',
      label: 'Campana',
      sublabel: 'Chime',
      icon: 'Bell',
      bgColor: '#374151',
      textColor: '#e5e7eb',
      actionType: 'sound_effect',
      actionTarget: 'chime'
    },
    {
      id: 'key_15',
      label: 'F13 Macro',
      sublabel: 'Hotkey PC',
      icon: 'Zap',
      bgColor: '#1f2937',
      textColor: '#38bdf8',
      actionType: 'hotkey',
      actionTarget: 'F13'
    },
    {
      id: 'key_16',
      label: 'F14 Macro',
      sublabel: 'Hotkey PC',
      icon: 'Zap',
      bgColor: '#1f2937',
      textColor: '#38bdf8',
      actionType: 'hotkey',
      actionTarget: 'F14'
    },
    // Remaining empty keys up to 24
    ...Array.from({ length: 8 }, (_, i) => ({
      id: `key_${i + 17}`,
      label: '',
      sublabel: '',
      icon: '',
      bgColor: '#1a1a1a',
      textColor: '#666666',
      actionType: 'none' as const,
    }))
  ];

  const defaultKeysTab2: DeckKey[] = [
    {
      id: 't2_key_1',
      label: 'Mic Principal',
      sublabel: 'Mute/Unmute',
      icon: 'Mic',
      bgColor: '#831843',
      textColor: '#f472b6',
      actionType: 'obs_mute_toggle',
      actionTarget: 'Micrófono'
    },
    {
      id: 't2_key_2',
      label: 'Audio Juego',
      sublabel: 'Mute/Unmute',
      icon: 'VolumeX',
      bgColor: '#1e3a5f',
      textColor: '#60a5fa',
      actionType: 'obs_mute_toggle',
      actionTarget: 'Juego'
    },
    {
      id: 't2_key_3',
      label: 'Audio Discord',
      sublabel: 'Mute/Unmute',
      icon: 'MessageSquare',
      bgColor: '#312e81',
      textColor: '#818cf8',
      actionType: 'obs_mute_toggle',
      actionTarget: 'Discord'
    },
    {
      id: 't2_key_4',
      label: 'Navegador Web',
      sublabel: 'Mute/Unmute',
      icon: 'Globe',
      bgColor: '#064e3b',
      textColor: '#34d399',
      actionType: 'obs_mute_toggle',
      actionTarget: 'Navegador'
    },
    ...Array.from({ length: 20 }, (_, i) => ({
      id: `t2_key_${i + 5}`,
      label: '',
      sublabel: '',
      icon: '',
      bgColor: '#1a1a1a',
      textColor: '#666666',
      actionType: 'none' as const,
    }))
  ];

  return [
    {
      id: 'profile_streamer',
      name: 'Streamer Pro',
      avatar: '⚡',
      gridCols: 4,
      gridRows: 6,
      tabs: [
        { id: 'tab_1', name: 'Pag 1: General', keys: defaultKeysTab1 },
        { id: 'tab_2', name: 'Pag 2: Audio', keys: defaultKeysTab2 },
        { id: 'tab_3', name: 'Pag 3: Atajos', keys: createEmptyKeys(24) }
      ]
    },
    {
      id: 'profile_gaming',
      name: 'Gaming & FPS',
      avatar: '🎮',
      gridCols: 4,
      gridRows: 6,
      tabs: [
        { id: 'tab_g1', name: 'Partidas', keys: createEmptyKeys(24) }
      ]
    }
  ];
}

export function loadProfiles(): { profiles: DeckProfile[]; activeProfileId: string } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const activeId = localStorage.getItem(ACTIVE_PROFILE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return {
          profiles: parsed,
          activeProfileId: activeId && parsed.some(p => p.id === activeId) ? activeId : parsed[0].id
        };
      }
    }
  } catch (e) {
    console.error('Error loading profiles from localStorage', e);
  }

  const defaults = getDefaultProfiles();
  saveProfiles(defaults, defaults[0].id);
  return { profiles: defaults, activeProfileId: defaults[0].id };
}

export function saveProfiles(profiles: DeckProfile[], activeProfileId?: string) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profiles));
    if (activeProfileId) {
      localStorage.setItem(ACTIVE_PROFILE_KEY, activeProfileId);
    }
  } catch (e) {
    console.error('Error saving profiles', e);
  }
}

export type ActionType =
  | 'none'
  | 'obs_scene'
  | 'obs_mute_toggle'
  | 'obs_mute_set'
  | 'obs_copyright_panic'
  | 'obs_toggle_stream'
  | 'obs_toggle_record'
  | 'obs_pause_record'
  | 'obs_screenshot'
  | 'obs_virtual_cam'
  | 'obs_studio_mode'
  | 'hotkey'
  | 'url_open'
  | 'sound_effect';

export interface DeckKey {
  id: string;
  label: string;
  sublabel?: string;
  icon: string; // Lucide icon name or emoji
  bgColor: string; // Hex or CSS color
  textColor: string;
  borderColor?: string;
  actionType: ActionType;
  actionTarget?: string; // Scene name, audio input name, URL, or hotkey
  modifiers?: string[]; // For hotkeys: ['ctrl', 'shift', 'alt']
  extraData?: Record<string, any>;
}

export interface DeckTab {
  id: string;
  name: string;
  keys: DeckKey[];
}

export interface DeckProfile {
  id: string;
  name: string;
  avatar: string;
  gridCols: number;
  gridRows: number;
  tabs: DeckTab[];
}

export interface OBSState {
  connected: boolean;
  connecting: boolean;
  url: string;
  password?: string;
  currentScene: string;
  scenes: string[];
  audioInputs: { inputName: string; inputKind: string; muted: boolean }[];
  isStreaming: boolean;
  isRecording: boolean;
  isRecordingPaused: boolean;
  studioMode?: boolean;
  lastError: string | null;
}

export interface NetworkInfo {
  ips: string[];
  port: number;
  suggestedUrls: string[];
  hostname?: string;
}

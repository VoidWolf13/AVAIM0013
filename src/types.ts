export interface Track {
  id: number;
  title: string;
  filename: string;
  audioUrl?: string;
  format: 'flac' | 'mp3' | 'wav' | 'ogg' | 'm4a' | string;
  category: 'ambient' | 'edm' | 'dark' | 'downtempo' | 'experimental' | 'cinematic' | string;
  moodTag: string;
  durationEst: string;
  description: string;
  bitrate: string;
  sampleRate: string;
  bpm?: number;
  source?: 'embedded' | 'github';
  sizeBytes?: number;
  lastModified?: number;
}

export interface GitHubSyncConfig {
  owner: string;
  repo: string;
  folder: string;
  branch: string;
  autoSync: boolean;
}

export type PlaybackMode = 'sequential' | 'random' | 'loop' | 'loop-all';

export type VisualizerMode = 'bars' | 'waveform' | 'radial' | 'particles';

export type EQPreset = 'flat' | 'bass-boost' | 'ambient-spatial' | 'cyber-treble' | 'lofi-warmth' | 'vocal-clarity';

export interface EQSettings {
  bass: number; // -12dB to +12dB
  mid: number;  // -12dB to +12dB
  treble: number; // -12dB to +12dB
  preset: EQPreset;
}

export interface ToastMessage {
  id: string;
  text: string;
  type?: 'info' | 'success' | 'warning';
}

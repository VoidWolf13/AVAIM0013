import { Track } from '../types';

export const ARTIST_NAME = 'AVAIM0013';
export const ARTIST_EMAIL = 'avaim0013@gmail.com';
export const BASE_AUDIO_URL = 'https://raw.githubusercontent.com/VoidWolf13/AVAIM0013/main/music/';

// Clean initial state: no hardcoded demo tracks; playlist is populated dynamically from GitHub
export const TRACKS: Track[] = [];

export function getTrackAudioUrl(track: Track): string {
  if (track.audioUrl) {
    return track.audioUrl;
  }
  return `${BASE_AUDIO_URL}${encodeURIComponent(track.filename)}`;
}

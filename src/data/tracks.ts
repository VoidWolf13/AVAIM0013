import { Track } from '../types';

export const ARTIST_NAME = 'AVAIM0013';
export const ARTIST_DESCRIPTION = 'Sound archive & music player. Dynamically reads and streams audio files directly from the GitHub repository.';
export const ARTIST_EMAIL = 'avaim0013@gmail.com';
export const GITHUB_REPO_URL = 'https://github.com/VoidWolf13/AVAIM0013';
export const GITHUB_PAGES_URL = 'https://voidwolf13.github.io/AVAIM0013/';
export const BASE_AUDIO_URL = 'https://raw.githubusercontent.com/VoidWolf13/AVAIM0013/main/music/';

// Clean initial state: no hardcoded demo tracks; playlist is populated dynamically from GitHub
export const TRACKS: Track[] = [];

export function getTrackAudioUrl(track: Track): string {
  if (track.audioUrl) {
    return track.audioUrl;
  }
  return `${BASE_AUDIO_URL}${encodeURIComponent(track.filename)}`;
}

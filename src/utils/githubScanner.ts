import { Track, GitHubSyncConfig } from '../types';
import { classifyByFilename } from './audioGenreClassifier';

export const DEFAULT_GITHUB_CONFIG: GitHubSyncConfig = {
  owner: 'VoidWolf13',
  repo: 'AVAIM0013',
  folder: 'music',
  branch: 'main',
  autoSync: true,
};

const STORAGE_KEY_CACHED_TRACKS = 'avaim_github_cached_tracks';

export function getStoredGitHubConfig(): GitHubSyncConfig {
  return DEFAULT_GITHUB_CONFIG;
}

export function saveGitHubConfig(_config: GitHubSyncConfig): void {
  // Fixed configuration locked to root music/ folder
}

export function getCachedGitHubTracks(): Track[] | null {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_CACHED_TRACKS);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch {
    // ignore
  }
  return null;
}

export function cacheGitHubTracks(tracks: Track[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_CACHED_TRACKS, JSON.stringify(tracks));
  } catch (err) {
    console.warn('Failed to cache tracks in localStorage:', err);
  }
}

const STORAGE_KEY_CUSTOM_METADATA = 'avaim_custom_track_metadata';

export function getCustomTrackMetadata(): Record<string, { moodTag?: string; category?: string; description?: string; bpm?: number }> {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_CUSTOM_METADATA);
    return saved ? JSON.parse(saved) : {};
  } catch {
    return {};
  }
}

export function saveCustomTrackMetadata(filenameOrId: string, metadata: { moodTag?: string; category?: string; description?: string; bpm?: number }): void {
  try {
    const current = getCustomTrackMetadata();
    current[filenameOrId] = { ...current[filenameOrId], ...metadata };
    localStorage.setItem(STORAGE_KEY_CUSTOM_METADATA, JSON.stringify(current));
  } catch (err) {
    console.warn('Failed to save custom track metadata:', err);
  }
}

// Clean filename into human readable track title
export function formatAudioTitle(filename: string): string {
  // Remove extension
  const withoutExt = filename.replace(/\.(mp3|flac|wav|ogg|m4a|aac)$/i, '');
  // Remove leading numbers like "01 - ", "01_", "1. "
  const cleanedLeading = withoutExt.replace(/^\d+[\s\-_.]*/, '');
  // Replace underscores and multiple dashes with spaces
  const cleanedSeparators = cleanedLeading.replace(/[_\-]+/g, ' ').trim();
  // Capitalize first letters
  return cleanedSeparators
    .split(' ')
    .map(word => word ? word.charAt(0).toUpperCase() + word.slice(1) : '')
    .join(' ') || withoutExt;
}

interface GitHubContentItem {
  name: string;
  path: string;
  sha: string;
  size: number;
  url: string;
  html_url: string;
  git_url: string;
  download_url: string | null;
  type: 'file' | 'dir';
}

export interface MetadataIndexEntry {
  file: string;
  title: string;
  genres: string[];
  bpm: number | null;
  album: string | null;
  year: number | null;
  added?: string | null;
}

export interface MetadataIndex {
  generated: string;
  count: number;
  genres: string[];
  tracks: MetadataIndexEntry[];
}

const STORAGE_KEY_METADATA_INDEX = 'avaim_metadata_index';
const METADATA_INDEX_TTL_MS = 24 * 60 * 60 * 1000; // сутки

/**
 * Читает индекс метаданных music/index.json (генерирует конвейер avaim).
 * Возвращает карту «имя файла -> запись». При любой ошибке — пустая карта,
 * сайт продолжает работать без жанров.
 */
export async function fetchMetadataIndex(
  owner: string,
  repo: string,
  branch: string,
): Promise<Map<string, MetadataIndexEntry>> {
  const url = `https://raw.githubusercontent.com/${owner}/${repo}/${branch || 'main'}/music/index.json`;
  try {
    const resp = await fetch(url, { headers: { 'Accept': 'application/json' } });
    if (!resp.ok) {
      return loadCachedIndex();
    }
    const data = (await resp.json()) as MetadataIndex;
    const map = new Map<string, MetadataIndexEntry>();
    for (const entry of data.tracks || []) {
      map.set(entry.file, entry);
    }
    try {
      localStorage.setItem(
        STORAGE_KEY_METADATA_INDEX,
        JSON.stringify({ at: Date.now(), tracks: data.tracks || [] }),
      );
    } catch {
      // ignore quota errors
    }
    return map;
  } catch {
    return loadCachedIndex();
  }
}

function loadCachedIndex(): Map<string, MetadataIndexEntry> {
  const map = new Map<string, MetadataIndexEntry>();
  try {
    const saved = localStorage.getItem(STORAGE_KEY_METADATA_INDEX);
    if (saved) {
      const parsed = JSON.parse(saved) as { at: number; tracks: MetadataIndexEntry[] };
      if (Date.now() - (parsed.at || 0) > METADATA_INDEX_TTL_MS) return map;
      for (const entry of parsed.tracks || []) map.set(entry.file, entry);
    }
  } catch {
    // ignore
  }
  return map;
}

/**
 * Fetch and scan audio files from a GitHub repository folder (e.g. "music")
 */
export async function fetchTracksFromGitHub(config: GitHubSyncConfig): Promise<{
  tracks: Track[];
  count: number;
  sourceRepo: string;
}> {
  const { owner, repo, folder, branch } = config;
  const cleanFolder = folder.trim().replace(/^\/+|\/+$/g, '');
  
  // GitHub REST API endpoint for directory contents
  const apiUrl = cleanFolder.length > 0
    ? `https://api.github.com/repos/${owner}/${repo}/contents/${cleanFolder}?ref=${encodeURIComponent(branch || 'main')}`
    : `https://api.github.com/repos/${owner}/${repo}/contents?ref=${encodeURIComponent(branch || 'main')}`;

  const response = await fetch(apiUrl, {
    headers: {
      'Accept': 'application/vnd.github.v3+json',
    },
  });

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error(`Папка "${cleanFolder || '/'}" не найдена в репозитории ${owner}/${repo} (ветка: ${branch}).`);
    } else if (response.status === 403) {
      throw new Error('Превышен лимит запросов GitHub API (Rate Limit). Попробуйте позже или используйте кэшированные треки.');
    } else {
      throw new Error(`Ошибка GitHub API (${response.status}): ${response.statusText}`);
    }
  }

  const items: GitHubContentItem[] = await response.json();

  if (!Array.isArray(items)) {
    throw new Error('GitHub API вернул не список файлов (возможно, это единичный файл).');
  }

  const audioExtensions = ['.mp3', '.flac', '.wav', '.ogg', '.m4a', '.aac'];
  const audioFiles = items.filter(
    item => item.type === 'file' && audioExtensions.some(ext => item.name.toLowerCase().endsWith(ext))
  );

  if (audioFiles.length === 0) {
    throw new Error(`В папке "${cleanFolder || '/'}" репозитория ${owner}/${repo} не найдено аудиофайлов (.mp3, .flac, .wav, .ogg).`);
  }

  const customMetadataMap = getCustomTrackMetadata();

  // Индекс метаданных (жанры, BPM, альбом, дата добавления) — генерирует конвейер avaim.
  // Даты берём отсюда, а не из GitHub commits API: там каскад из ~20 запросов и лимит 60/ч.
  const indexMap = await fetchMetadataIndex(owner, repo, branch);

  // Дата добавления трека (мс) из индекса; 0 — если индекс недоступен
  const addedMs = (name: string): number => {
    const iso = indexMap.get(name)?.added;
    if (!iso) return 0;
    const t = Date.parse(iso);
    return Number.isNaN(t) ? 0 : t;
  };

  // Sort by added date (newest first), filename as tiebreaker
  audioFiles.sort((a, b) => {
    const dateA = addedMs(a.name);
    const dateB = addedMs(b.name);
    if (dateB !== dateA) {
      return dateB - dateA;
    }
    return a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' });
  });

  // Create track objects
  const tracks: Track[] = audioFiles.map((file, idx) => {
    const extMatch = file.name.match(/\.([a-z0-9]+)$/i);
    const format = (extMatch ? extMatch[1].toLowerCase() : 'mp3');
    const classification = classifyByFilename(file.name);
    const title = formatAudioTitle(file.name);

    const isFlac = format.toLowerCase() === 'flac';
    const isWav = format.toLowerCase() === 'wav';
    const bitrate = isFlac ? 'Lossless FLAC' : isWav ? 'Uncompressed WAV' : '320 kbps High Quality';

    const downloadUrl = file.download_url ||
      `https://raw.githubusercontent.com/${owner}/${repo}/${branch || 'main'}/${file.path}`;

    let estMin = 3;
    let estSec = 30;
    if (file.size > 0) {
      const approxSec = Math.round(format === 'flac' ? file.size / (1024 * 180) : file.size / (1024 * 40));
      estMin = Math.floor(Math.max(1, Math.min(20, approxSec / 60)));
      estSec = Math.max(0, Math.min(59, approxSec % 60));
    }

    const customMeta = customMetadataMap[file.name] || customMetadataMap[title];
    const lastMod = addedMs(file.name);

    return {
      id: idx,
      title,
      filename: file.name,
      audioUrl: downloadUrl,
      format,
      category: customMeta?.category || classification.genre || 'all',
      moodTag: customMeta?.moodTag || classification.moodTag || 'AVAIM0013',
      durationEst: `${estMin}:${String(estSec).padStart(2, '0')}`,
      description: customMeta?.description || classification.description || 'Оригинальная композиция проекта AVAIM0013.',
      bitrate,
      sampleRate: format === 'flac' ? '44.1 kHz / 24-bit' : '44.1 kHz / 16-bit',
      bpm: customMeta?.bpm !== undefined ? customMeta.bpm : classification.estimatedBpm,
      genres: indexMap.get(file.name)?.genres || [],
      source: 'github',
      sizeBytes: file.size,
      lastModified: lastMod,
    };
  });

  // Save to localStorage cache
  cacheGitHubTracks(tracks);

  return {
    tracks,
    count: tracks.length,
    sourceRepo: `${owner}/${repo}/${cleanFolder}`,
  };
}

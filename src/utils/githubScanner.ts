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

// Clean category and format metadata from filename & extension
export function inferMoodAndCategory(filename: string, format: string): {
  category: Track['category'];
  moodTag: string;
  description: string;
  bitrate: string;
} {
  const isFlac = format.toLowerCase() === 'flac';
  const isWav = format.toLowerCase() === 'wav';
  const bitrate = isFlac ? 'Lossless FLAC' : isWav ? 'Uncompressed WAV' : '320 kbps High Quality';

  return {
    category: format.toLowerCase(),
    moodTag: 'AVAIM0013',
    description: 'Оригинальная композиция проекта AVAIM0013.',
    bitrate,
  };
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

  // Sort alphabetically by filename
  audioFiles.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }));

  const customMetadataMap = getCustomTrackMetadata();

  const tracks: Track[] = audioFiles.map((file, idx) => {
    const extMatch = file.name.match(/\.([a-z0-9]+)$/i);
    const format = (extMatch ? extMatch[1].toLowerCase() : 'mp3');
    const classification = classifyByFilename(file.name);
    const title = formatAudioTitle(file.name);

    const isFlac = format.toLowerCase() === 'flac';
    const isWav = format.toLowerCase() === 'wav';
    const bitrate = isFlac ? 'Lossless FLAC' : isWav ? 'Uncompressed WAV' : '320 kbps High Quality';

    // Prefer raw github usercontent or github pages direct download url
    const downloadUrl = file.download_url || 
      `https://raw.githubusercontent.com/${owner}/${repo}/${branch || 'main'}/${file.path}`;

    // Rough duration estimation based on file size if MP3/FLAC
    let estMin = 3;
    let estSec = 30;
    if (file.size > 0) {
      const approxSec = Math.round(format === 'flac' ? file.size / (1024 * 180) : file.size / (1024 * 40));
      estMin = Math.floor(Math.max(1, Math.min(20, approxSec / 60)));
      estSec = Math.max(0, Math.min(59, approxSec % 60));
    }

    const customMeta = customMetadataMap[file.name] || customMetadataMap[title];

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
       source: 'github',
       sizeBytes: file.size,
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

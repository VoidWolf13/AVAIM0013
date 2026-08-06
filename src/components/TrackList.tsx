import React, { useState, useMemo } from 'react';
import { Track } from '../types';
import { getTrackAudioUrl } from '../data/tracks';
import { useAudio } from '../context/AudioContext';
import {
  Search,
  Play,
  Pause,
  Heart,
  Plus,
  Info,
  Download,
  Music,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  FolderGit2,
} from 'lucide-react';

interface TrackListProps {
  onOpenTrackInfo: (track: Track) => void;
  onOpenGitHubSync?: () => void;
  onShowToast: (text: string) => void;
}

type FilterCategory = 'all' | 'favorites' | 'ambient' | 'edm' | 'dark' | 'downtempo' | 'experimental' | 'cinematic';

export const TrackList: React.FC<TrackListProps> = ({ onOpenTrackInfo, onOpenGitHubSync, onShowToast }) => {
  const {
    tracks,
    currentTrack,
    isPlaying,
    playTrack,
    togglePlayPause,
    toggleFavorite,
    isFavorite,
    addToQueue,
    favorites,
    isSyncingGitHub,
    syncWithGitHub,
  } = useAudio();

  // Collapsed by default according to user requirement
  const [isExpanded, setIsExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<FilterCategory>('all');

  const categories: { id: FilterCategory; label: string }[] = [
    { id: 'all', label: `All (${tracks.length})` },
    { id: 'favorites', label: `Favorites (${favorites.length})` },
    { id: 'ambient', label: 'Ambient' },
    { id: 'edm', label: 'EDM' },
    { id: 'dark', label: 'Dark Wave' },
    { id: 'downtempo', label: 'Downtempo' },
    { id: 'cinematic', label: 'Cinematic' },
    { id: 'experimental', label: 'Glitch' },
  ];

  // Filtered tracks
  const filteredTracks = useMemo(() => {
    return tracks.filter((track) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        track.title.toLowerCase().includes(q) ||
        track.moodTag.toLowerCase().includes(q) ||
        track.format.toLowerCase().includes(q);

      let matchesCategory = true;
      if (selectedCategory === 'favorites') {
        matchesCategory = favorites.includes(track.id);
      } else if (selectedCategory !== 'all') {
        matchesCategory = track.category === selectedCategory;
      }

      return matchesSearch && matchesCategory;
    });
  }, [tracks, searchQuery, selectedCategory, favorites]);

  const handleSyncClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    onShowToast('Scanning GitHub repository for music files...');
    const res = await syncWithGitHub();
    if (res.success) {
      onShowToast(`Synced! Loaded ${res.count} tracks from GitHub.`);
    } else {
      onShowToast(res.error || 'GitHub sync failed');
    }
  };

  return (
    <section id="track-discography-section" className="w-full space-y-3">
      {/* Collapsible Header Toggle */}
      <div className="flex items-center gap-2">
        <button
          id="toggle-tracklist-btn"
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex-1 py-3 px-4 rounded-xl bg-neutral-900/60 hover:bg-neutral-900 border border-neutral-800 flex items-center justify-between text-xs font-mono text-neutral-300 transition"
        >
          <div className="flex items-center gap-2">
            <Music className="w-4 h-4 text-neutral-400" />
            <span>
              {isExpanded ? 'Hide Tracklist' : 'Show Tracklist'} ({tracks.length} tracks)
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-neutral-400">
            <span className="text-[11px] text-neutral-500">
              {isExpanded ? 'Click to collapse' : 'Click to expand'}
            </span>
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </button>

        {/* Fast GitHub Sync button */}
        <button
          onClick={handleSyncClick}
          disabled={isSyncingGitHub}
          className="p-3 rounded-xl bg-neutral-900/60 hover:bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-neutral-200 transition shrink-0"
          title="Sync with GitHub music/ folder"
        >
          <RefreshCw className={`w-4 h-4 ${isSyncingGitHub ? 'animate-spin text-neutral-200' : ''}`} />
        </button>
      </div>

      {/* Expanded Tracklist Content */}
      {isExpanded && (
        <div className="space-y-3 pt-1 animate-fadeIn">
          {/* Search & Filter Bar */}
          <div className="space-y-2">
            {/* Search + Sync config button */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-500" />
                <input
                  type="text"
                  placeholder="Search tracks..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-neutral-200 placeholder-neutral-500 text-xs font-mono focus:outline-none focus:border-neutral-700 transition"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono text-neutral-500 hover:text-neutral-300"
                  >
                    Clear
                  </button>
                )}
              </div>

              {onOpenGitHubSync && (
                <button
                  onClick={onOpenGitHubSync}
                  className="px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-800 hover:border-neutral-700 text-neutral-400 hover:text-neutral-200 text-xs font-mono flex items-center gap-1.5 transition shrink-0"
                  title="GitHub Sync Settings"
                >
                  <FolderGit2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">music/</span>
                </button>
              )}
            </div>

            {/* Category Filter Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-[11px] font-mono">
              {categories.map((cat) => {
                const isActive = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-2.5 py-1 rounded-lg transition whitespace-nowrap ${
                      isActive
                        ? 'bg-neutral-800 text-white font-medium border border-neutral-700'
                        : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900/60'
                    }`}
                  >
                    {cat.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Track Rows */}
          <div className="rounded-xl border border-neutral-800 bg-neutral-950/80 divide-y divide-neutral-900 overflow-hidden max-h-96 overflow-y-auto">
            {tracks.length === 0 ? (
              <div className="p-8 text-center text-neutral-400 text-xs font-mono space-y-3">
                <FolderGit2 className="w-8 h-8 mx-auto text-neutral-500" />
                <div className="space-y-1">
                  <p className="text-neutral-200 font-semibold">Папка music/ пуста или ожидает синхронизации</p>
                  <p className="text-neutral-500 text-[11px]">
                    Добавьте аудиофайлы (.mp3, .flac, .wav, .ogg) в папку <code className="text-neutral-300">music/</code> репозитория <code className="text-neutral-300">VoidWolf13/AVAIM0013</code>.
                  </p>
                </div>
                <div className="pt-2 flex items-center justify-center gap-2">
                  <button
                    onClick={handleSyncClick}
                    disabled={isSyncingGitHub}
                    className="px-4 py-2 rounded-xl bg-neutral-100 hover:bg-white text-neutral-950 font-bold text-xs font-mono flex items-center gap-1.5 transition disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isSyncingGitHub ? 'animate-spin' : ''}`} />
                    <span>{isSyncingGitHub ? 'Сканирование...' : 'Синхронизировать сейчас'}</span>
                  </button>
                  {onOpenGitHubSync && (
                    <button
                      onClick={onOpenGitHubSync}
                      className="px-3 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 text-xs font-mono transition"
                    >
                      Настройки
                    </button>
                  )}
                </div>
              </div>
            ) : filteredTracks.length === 0 ? (
              <div className="p-8 text-center text-neutral-500 text-xs font-mono space-y-2">
                <Music className="w-5 h-5 mx-auto text-neutral-600" />
                <p>Треки не найдены по вашему запросу</p>
              </div>
            ) : (
              filteredTracks.map((track, index) => {
                const isCurrent = currentTrack.id === track.id || currentTrack.filename === track.filename;
                const isThisPlaying = isCurrent && isPlaying;
                const isFav = isFavorite(track.id);

                return (
                  <div
                    key={track.filename || track.id || index}
                    className={`group flex items-center justify-between px-3 py-2.5 transition ${
                      isCurrent
                        ? 'bg-neutral-900 text-white'
                        : 'hover:bg-neutral-900/50 text-neutral-300'
                    }`}
                  >
                    {/* Left: Play button & title */}
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <button
                        onClick={() => {
                          if (isCurrent) togglePlayPause();
                          else playTrack(track);
                        }}
                        className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition ${
                          isCurrent
                            ? 'bg-neutral-200 text-neutral-950'
                            : 'bg-neutral-900 text-neutral-400 group-hover:text-neutral-200 group-hover:bg-neutral-800'
                        }`}
                        title={isThisPlaying ? 'Pause' : 'Play'}
                      >
                        {isThisPlaying ? (
                          <Pause className="w-3 h-3 fill-current" />
                        ) : (
                          <Play className="w-3 h-3 fill-current ml-0.5" />
                        )}
                      </button>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <p
                            className={`text-xs font-mono truncate ${
                              isCurrent ? 'text-neutral-100 font-semibold' : 'text-neutral-300'
                            }`}
                          >
                            {String(index + 1).padStart(2, '0')}. {track.title}
                          </p>
                          {track.source === 'github' && (
                            <span className="px-1.5 py-0.2 text-[9px] font-mono bg-neutral-800 text-neutral-400 rounded border border-neutral-700 shrink-0">
                              GitHub
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-neutral-500 font-mono truncate">
                          {track.moodTag} • <span className="uppercase">{track.format}</span>
                        </p>
                      </div>
                    </div>

                    {/* Right: Quick actions */}
                    <div className="flex items-center gap-1 shrink-0 pl-2">
                      <button
                        onClick={() => {
                          toggleFavorite(track.id);
                          onShowToast(isFav ? 'Removed from favorites' : 'Added to favorites');
                        }}
                        className={`p-1.5 rounded-md transition ${
                          isFav ? 'text-rose-400' : 'text-neutral-500 hover:text-neutral-300'
                        }`}
                        title="Favorite"
                      >
                        <Heart className={`w-3.5 h-3.5 ${isFav ? 'fill-rose-400' : ''}`} />
                      </button>

                      <button
                        onClick={() => {
                          addToQueue(track);
                          onShowToast(`Added "${track.title}" to queue`);
                        }}
                        className="p-1.5 rounded-md text-neutral-500 hover:text-neutral-300 transition"
                        title="Add to queue"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => onOpenTrackInfo(track)}
                        className="p-1.5 rounded-md text-neutral-500 hover:text-neutral-300 transition"
                        title="Info"
                      >
                        <Info className="w-3.5 h-3.5" />
                      </button>

                      <a
                        href={getTrackAudioUrl(track)}
                        download={track.filename}
                        target="_blank"
                        rel="noreferrer"
                        onClick={() => onShowToast(`Downloading ${track.filename}...`)}
                        className="p-1.5 rounded-md text-neutral-500 hover:text-neutral-300 transition"
                        title="Download"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </section>
  );
};

import React, { useState, useMemo } from 'react';
import { useAudio } from '../context/AudioContext';
import { ARTIST_NAME } from '../data/tracks';
import {
  Search,
  Play,
  Pause,
  Heart,
  Music,
  ChevronDown,
  ChevronUp,
  ArrowDownWideNarrow,
  ArrowUpAZ,
  Tag,
} from 'lucide-react';

interface TrackListProps {
  onShowToast: (text: string) => void;
}

type SortMode = 'new' | 'name';

export const TrackList: React.FC<TrackListProps> = ({ onShowToast }) => {
  const {
    tracks,
    currentTrack,
    isPlaying,
    playTrack,
    togglePlayPause,
    toggleFavorite,
    isFavorite,
    favorites,
    isSyncingGitHub,
  } = useAudio();

  // Collapsed by default according to user requirement
  const [isExpanded, setIsExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortMode, setSortMode] = useState<SortMode>('new');
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [isGenrePanelOpen, setIsGenrePanelOpen] = useState(false);

  // Unique genres from metadata index, alphabetical
  const allGenres = useMemo(() => {
    const set = new Set<string>();
    for (const t of tracks) {
      for (const g of t.genres || []) set.add(g);
    }
    return Array.from(set).sort((a, b) =>
      a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }),
    );
  }, [tracks]);

  const toggleGenre = (genre: string) => {
    setSelectedGenres((prev) =>
      prev.includes(genre) ? prev.filter((g) => g !== genre) : [...prev, genre],
    );
  };

  // Filtered + sorted tracks
  const filteredTracks = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    const filtered = tracks.filter((track) => {
      const matchesSearch = !q || track.title.toLowerCase().includes(q);

      // Favorites filter (compatible with everything else)
      const matchesFavorites = !onlyFavorites || favorites.includes(track.id);

      // Genre filter: OR-logic across selected genres
      const trackGenres = track.genres || [];
      const matchesGenre =
        selectedGenres.length === 0 ||
        selectedGenres.some((g) => trackGenres.includes(g));

      return matchesSearch && matchesFavorites && matchesGenre;
    });

    const sorted = [...filtered];
    if (sortMode === 'name') {
      sorted.sort((a, b) =>
        a.title.localeCompare(b.title, undefined, { numeric: true, sensitivity: 'base' }),
      );
    } else {
      // 'new': newest first (by commit date), title as tiebreaker
      sorted.sort((a, b) => {
        const diff = (b.lastModified || 0) - (a.lastModified || 0);
        if (diff !== 0) return diff;
        return a.title.localeCompare(b.title, undefined, { numeric: true, sensitivity: 'base' });
      });
    }
    return sorted;
  }, [tracks, searchQuery, sortMode, onlyFavorites, selectedGenres, favorites]);

  const hasActiveFilter = onlyFavorites || selectedGenres.length > 0 || searchQuery.trim() !== '';

  return (
    <section id="track-discography-section" className="w-full space-y-3">
      {/* Collapsible Header Toggle */}
      <button
        id="toggle-tracklist-btn"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full py-3 px-4 rounded-xl bg-neutral-900/60 hover:bg-neutral-900 border border-neutral-800 flex items-center justify-between text-xs font-mono text-neutral-300 transition cursor-pointer"
        title={isExpanded ? 'Свернуть список треков' : 'Развернуть список треков'}
      >
        <div className="flex items-center gap-2">
          <Music className="w-4 h-4 text-neutral-400" />
          <span>
            {isExpanded ? 'Скрыть список треков' : 'Показать список треков'} ({tracks.length})
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-neutral-400">
          <span className="text-[11px] text-neutral-500">
            {isExpanded ? 'Свернуть' : 'Развернуть'}
          </span>
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>

      {/* Expanded Tracklist Content */}
      {isExpanded && (
        <div className="space-y-3 pt-1 animate-fadeIn">
          {/* Search & Filter Bar */}
          <div className="space-y-2.5">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-500" />
              <input
                type="text"
                placeholder="Поиск по названию трека..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-neutral-200 placeholder-neutral-500 text-xs font-mono focus:outline-none focus:border-neutral-700 transition"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono text-neutral-500 hover:text-neutral-300 cursor-pointer"
                >
                  Очистить
                </button>
              )}
            </div>

            {/* Mode row: sorts + filters */}
            <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-mono">
              <button
                onClick={() => setSortMode('new')}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg transition cursor-pointer ${
                  sortMode === 'new'
                    ? 'bg-neutral-800 text-white font-medium border border-neutral-700 shadow-sm'
                    : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900 border border-transparent'
                }`}
                title="Сначала недавно добавленные"
              >
                <ArrowDownWideNarrow className="w-3 h-3" />
                Новое
              </button>

              <button
                onClick={() => setSortMode('name')}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg transition cursor-pointer ${
                  sortMode === 'name'
                    ? 'bg-neutral-800 text-white font-medium border border-neutral-700 shadow-sm'
                    : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900 border border-transparent'
                }`}
                title="По алфавиту"
              >
                <ArrowUpAZ className="w-3 h-3" />
                По имени
              </button>

              <span className="w-px h-4 bg-neutral-800 mx-0.5" />

              <button
                onClick={() => setIsGenrePanelOpen((v) => !v)}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg transition cursor-pointer ${
                  selectedGenres.length > 0
                    ? 'bg-neutral-800 text-white font-medium border border-neutral-700 shadow-sm'
                    : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900 border border-transparent'
                }`}
                title="Фильтр по жанрам"
              >
                <Tag className="w-3 h-3" />
                Жанры{selectedGenres.length > 0 ? ` (${selectedGenres.length})` : ''}
                <ChevronDown
                  className={`w-3 h-3 transition-transform ${isGenrePanelOpen ? 'rotate-180' : ''}`}
                />
              </button>

              <button
                onClick={() => setOnlyFavorites((v) => !v)}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg transition cursor-pointer ${
                  onlyFavorites
                    ? 'bg-rose-500/15 text-rose-300 font-medium border border-rose-500/30'
                    : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900 border border-transparent'
                }`}
                title="Только избранное"
              >
                <Heart className={`w-3 h-3 ${onlyFavorites ? 'fill-rose-300' : ''}`} />
                Избранное
              </button>
            </div>

            {/* Genre filter panel — collapsible, 2-3 columns */}
            {isGenrePanelOpen && (
              <div className="rounded-xl border border-neutral-800 bg-neutral-950/80 p-3 space-y-2 animate-fadeIn">
                {allGenres.length === 0 ? (
                  <p className="text-[11px] font-mono text-neutral-500">
                    Жанры не найдены в метаданных.
                  </p>
                ) : (
                  <>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-3 gap-y-1 max-h-56 overflow-y-auto">
                      {allGenres.map((genre) => {
                        const checked = selectedGenres.includes(genre);
                        return (
                          <label
                            key={genre}
                            className="flex items-center gap-1.5 text-[11px] font-mono text-neutral-300 hover:text-white cursor-pointer select-none"
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggleGenre(genre)}
                              className="accent-neutral-500 w-3 h-3 cursor-pointer"
                            />
                            <span className="truncate">{genre}</span>
                          </label>
                        );
                      })}
                    </div>
                    {selectedGenres.length > 0 && (
                      <button
                        onClick={() => setSelectedGenres([])}
                        className="text-[10px] font-mono text-neutral-500 hover:text-neutral-300 cursor-pointer"
                      >
                        Сбросить жанры
                      </button>
                    )}
                  </>
                )}
              </div>
            )}

            {/* Active filters summary */}
            {hasActiveFilter && (
              <div className="flex flex-wrap items-center gap-2 text-[10px] font-mono text-neutral-500">
                <span>Найдено: {filteredTracks.length}</span>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedGenres([]);
                    setOnlyFavorites(false);
                  }}
                  className="hover:text-neutral-300 cursor-pointer"
                >
                  Сбросить всё
                </button>
              </div>
            )}
          </div>

          {/* Track Rows */}
          <div className="rounded-xl border border-neutral-800 bg-neutral-950/80 divide-y divide-neutral-900 overflow-hidden max-h-96 overflow-y-auto">
            {tracks.length === 0 ? (
              <div className="p-8 text-center text-neutral-400 text-xs font-mono space-y-2">
                <Music className="w-6 h-6 mx-auto text-neutral-600" />
                <div className="space-y-1">
                  <p className="text-neutral-200 font-semibold">
                    {isSyncingGitHub ? 'Автоматическая загрузка треков...' : 'Папка music/ пуста'}
                  </p>
                  <p className="text-neutral-500 text-[11px]">
                    {isSyncingGitHub
                      ? 'Пожалуйста, подождите...'
                      : 'Аудиофайлы (.mp3, .flac, .wav, .ogg) загружаются автоматически при их наличии в папке.'}
                  </p>
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
                    className={`group flex items-center justify-between px-2 sm:px-3 py-2 sm:py-2.5 transition ${
                      isCurrent
                        ? 'bg-neutral-900 text-white'
                        : 'hover:bg-neutral-900/50 text-neutral-300'
                    }`}
                  >
                    {/* Left: Play button & title */}
                    <div className="flex items-center gap-2 sm:gap-2.5 min-w-0 flex-1">
                      <button
                        onClick={() => {
                          if (isCurrent) togglePlayPause();
                          else playTrack(track);
                        }}
                        className={`w-6 h-6 sm:w-7 sm:h-7 rounded-lg flex items-center justify-center shrink-0 transition cursor-pointer ${
                          isCurrent
                            ? 'bg-neutral-200 text-neutral-950'
                            : 'bg-neutral-900 text-neutral-400 group-hover:text-neutral-200 group-hover:bg-neutral-800'
                        }`}
                        title={isThisPlaying ? 'Пауза' : 'Воспроизвести'}
                      >
                        {isThisPlaying ? (
                          <Pause className="w-2.5 h-2.5 sm:w-3 sm:h-3 fill-current" />
                        ) : (
                          <Play className="w-2.5 h-2.5 sm:w-3 sm:h-3 fill-current ml-0.5" />
                        )}
                      </button>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <p
                            className={`text-xs font-mono truncate ${
                              isCurrent ? 'text-neutral-100 font-semibold' : 'text-neutral-300'
                            }`}
                          >
                            {track.title}
                          </p>
                        </div>
                        <p className="text-[10px] text-neutral-500 font-mono truncate">
                          {track.genres && track.genres.length > 0
                            ? track.genres.join(' / ')
                            : ARTIST_NAME}
                        </p>
                      </div>
                    </div>

                    {/* Right: Quick actions */}
                    <div className="flex items-center gap-0.5 sm:gap-1 shrink-0 pl-1 sm:pl-2">
                      <button
                        onClick={() => {
                          toggleFavorite(track.id);
                          onShowToast(isFav ? 'Удалено из избранного' : 'Добавлено в избранное');
                        }}
                        className={`p-0.5 sm:p-1.5 rounded-md transition cursor-pointer ${
                          isFav ? 'text-rose-400' : 'text-neutral-500 hover:text-neutral-300'
                        }`}
                        title={isFav ? 'Удалить из избранного' : 'Добавить в избранное'}
                      >
                        <Heart className={`w-3.5 h-3.5 ${isFav ? 'fill-rose-400' : ''}`} />
                      </button>
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

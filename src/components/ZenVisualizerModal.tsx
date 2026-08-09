import React, { useState, useEffect, useRef } from 'react';
import { useAudio } from '../context/AudioContext';
import { VisualizerCanvas } from './VisualizerCanvas';
import { Track, VisualizerMode } from '../types';
import { ARTIST_NAME } from '../data/tracks';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Minimize2,
  Heart,
  Repeat,
  Repeat1,
  Shuffle,
} from 'lucide-react';
import { formatTime } from '../utils/formatTime';

interface ZenVisualizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShare: () => void;
}

export const ZenVisualizerModal: React.FC<ZenVisualizerModalProps> = ({ isOpen, onClose, onShare }) => {
  const {
    tracks,
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    volume,
    isMuted,
    playbackMode,
    togglePlayPause,
    playNext,
    playPrevious,
    seek,
    setVolume,
    toggleMute,
    toggleFavorite,
    isFavorite,
    setPlaybackMode,
  } = useAudio();

  const toggleRepeat = () => {
    if (playbackMode === 'loop') {
      setPlaybackMode('sequential');
    } else {
      setPlaybackMode('loop');
    }
  };

  const toggleShuffle = () => {
    if (playbackMode === 'random') {
      setPlaybackMode('sequential');
    } else {
      setPlaybackMode('random');
    }
  };

  const [controlsVisible, setControlsVisible] = useState(true);
  const idleTimerRef = useRef<number | null>(null);

  // Detect desktop for zen particle line threshold
  const isDesktop = typeof window !== 'undefined' && window.matchMedia('(min-width: 640px)').matches;

  // Always use particles (Звездная туманность) in zen mode
  const visualizerMode: VisualizerMode = 'particles';

  // Auto-hide controls when mouse is inactive in full-screen zen mode
  const handleMouseMove = () => {
    setControlsVisible(true);
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    idleTimerRef.current = window.setTimeout(() => {
      if (isPlaying) {
        setControlsVisible(false);
      }
    }, 3500);
  };

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    };
  }, [isOpen, onClose, isPlaying]);

  if (!isOpen) return null;

  return (
    <div
      id="zen-visualizer-overlay"
      onMouseMove={handleMouseMove}
      className="fixed inset-0 z-50 bg-black flex flex-col justify-between overflow-hidden select-none"
    >
      {/* Background visualizer canvas filling the entire screen */}
      <div className="absolute inset-0 z-0">
        <VisualizerCanvas
          className="w-full h-full rounded-none border-none bg-black"
          mode={visualizerMode}
          showOverlayStats={false}
          isZenDesktop={isDesktop}
        />
        {/* Subtle vignette layer */}
        <div className="absolute inset-0 pointer-events-none bg-radial-gradient from-transparent via-black/30 to-black/80" />
      </div>

      {/* Top Track Title HUD */}
      <div
        className={`relative z-10 text-center px-4 max-w-2xl mx-auto mt-8 transition-opacity duration-500 pointer-events-none ${
          controlsVisible ? 'opacity-100' : 'opacity-20'
        }`}
      >
        <div className="mb-2 text-neutral-400 text-2xl font-mono tracking-widest uppercase opacity-10">
          {ARTIST_NAME}
        </div>
        <h1 className="text-4xl sm:text-8xl font-mono tracking-normal uppercase text-neutral-100 opacity-20 drop-shadow-[0_4px_20px_rgba(0,0,0,0.9)]">
          {currentTrack.title}
        </h1>
      </div>

      {/* Exit Fullscreen — absolute top-right corner */}
      <button
        onClick={onClose}
        id="exit-zen-mode"
        className={`absolute top-4 right-4 z-20 p-2.5 rounded-full bg-neutral-900/80 border border-neutral-800 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 backdrop-blur-md transition cursor-pointer ${
          controlsVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        title="Выйти из полноэкранного режима (Esc)"
      >
        <Minimize2 className="w-5 h-5" />
      </button>

      {/* Bottom Floating Control Bar */}
      <div
        className={`relative z-10 p-6 max-w-3xl w-full mx-auto transition-opacity duration-500 ${
          controlsVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div className="bg-neutral-900/90 border border-neutral-800/90 backdrop-blur-xl rounded-2xl p-4 shadow-2xl space-y-3">
          {/* Timeline Bar */}
          <div className="space-y-1">
            <div className="relative flex items-center h-6 group cursor-pointer">
              {/* Background Track & Active Progress Fill */}
              <div className="w-full h-1.5 bg-neutral-800 rounded-full overflow-hidden relative">
                <div
                  className="absolute left-0 top-0 h-full bg-neutral-200 rounded-full transition-all"
                  style={{
                    width: `${duration > 0 ? Math.min(100, Math.max(0, (currentTime / duration) * 100)) : 0}%`,
                  }}
                />
              </div>

              {/* Thumb circle on top (z-20) */}
              <div
                className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-white border border-neutral-900 rounded-full shadow-lg pointer-events-none transition-transform group-hover:scale-125 z-20"
                style={{
                  left: `calc(${
                    duration > 0 ? Math.min(100, Math.max(0, (currentTime / duration) * 100)) : 0
                  }% - 7px)`,
                }}
              />

              {/* Range input */}
              <input
                type="range"
                min="0"
                max={duration || 100}
                step="0.1"
                value={currentTime}
                onChange={(e) => seek(parseFloat(e.target.value))}
                title="Перемотка трека"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-30"
                aria-label="Перемотка трека"
              />
            </div>
            <div className="flex justify-between text-xs font-mono text-neutral-400 px-0.5">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Controls Row */}
          <div className="relative flex items-center pt-1">
            {/* Left Actions */}
            <div className="flex items-center gap-1 w-16 sm:w-auto justify-start">
              {/* Repeat Button */}
              <button
                onClick={toggleRepeat}
                className={`p-1.5 sm:p-2 rounded-lg transition cursor-pointer ${
                  playbackMode === 'loop'
                    ? 'text-white bg-neutral-800 border border-neutral-600 shadow-sm'
                    : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/70'
                }`}
                title={playbackMode === 'loop' ? 'Повтор трека: Вкл (R)' : 'Повтор трека: Выкл (R)'}
              >
                {playbackMode === 'loop' ? <Repeat1 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" /> : <Repeat className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
              </button>

              {/* Shuffle Button */}
              <button
                onClick={toggleShuffle}
                className={`p-1.5 sm:p-2 rounded-lg transition cursor-pointer ${
                  playbackMode === 'random'
                    ? 'text-white bg-neutral-800 border border-neutral-600 shadow-sm'
                    : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/70'
                }`}
                title={playbackMode === 'random' ? 'Случайное воспроизведение: Вкл (S)' : 'Случайное воспроизведение: Выкл (S)'}
              >
                <Shuffle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>

              {/* Favorite — desktop only, next to Shuffle */}
              <button
                onClick={() => toggleFavorite(currentTrack.id)}
                disabled={tracks.length === 0}
                className={`hidden sm:inline-flex p-1.5 sm:p-2 rounded-lg transition cursor-pointer disabled:opacity-40 ${
                  isFavorite(currentTrack.id)
                    ? 'text-rose-400'
                    : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/70'
                }`}
                title={isFavorite(currentTrack.id) ? 'Удалить из избранного' : 'Добавить в избранное'}
              >
                <Heart className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isFavorite(currentTrack.id) ? 'fill-rose-400' : ''}`} />
              </button>
            </div>

            {/* Playback Controls — absolutely centered */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center gap-3">
              <button
                onClick={playPrevious}
                className="p-2 sm:p-2.5 rounded-full text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 transition cursor-pointer"
                title="Предыдущий трек (P / ←)"
              >
                <SkipBack className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
              <button
                onClick={togglePlayPause}
                id="zen-play-pause-btn"
                className="p-3 sm:p-4 rounded-full bg-neutral-200 hover:bg-neutral-300 text-neutral-950 shadow-lg transition transform active:scale-95 cursor-pointer"
                title={isPlaying ? 'Пауза (Пробел)' : 'Воспроизведение (Пробел)'}
              >
                {isPlaying ? <Pause className="w-5 h-5 sm:w-6 sm:h-6 fill-current" /> : <Play className="w-5 h-5 sm:w-6 sm:h-6 fill-current ml-0.5" />}
              </button>
              <button
                onClick={playNext}
                className="p-2 sm:p-2.5 rounded-full text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 transition cursor-pointer"
                title="Следующий трек (N / →)"
              >
                <SkipForward className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>

            {/* Volume — hidden on mobile */}
            <div className="hidden sm:flex items-center gap-2 ml-auto">
              <button
                onClick={toggleMute}
                className="p-2 text-neutral-400 hover:text-neutral-200 transition cursor-pointer"
                title={isMuted ? 'Включить звук (M)' : 'Выключить звук (M)'}
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="w-4 h-4 text-rose-400" />
                ) : (
                  <Volume2 className="w-4 h-4" />
                )}
              </button>
              <div className="relative flex items-center w-16 sm:w-20 h-5 group cursor-pointer">
                <div className="w-full h-1 bg-neutral-800 rounded-full overflow-hidden relative">
                  <div
                    className="absolute left-0 top-0 h-full bg-neutral-300 rounded-full transition-all"
                    style={{ width: `${(isMuted ? 0 : volume) * 100}%` }}
                  />
                </div>
                <div
                  className="absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-white border border-neutral-900 rounded-full shadow pointer-events-none transition-transform group-hover:scale-125 z-20"
                  style={{
                    left: `calc(${(isMuted ? 0 : volume) * 100}% - 5px)`,
                  }}
                />
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={isMuted ? 0 : volume}
                  onChange={(e) => setVolume(parseFloat(e.target.value))}
                  title={`Громкость: ${Math.round((isMuted ? 0 : volume) * 100)}%`}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-30"
                  aria-label="Громкость"
                />
              </div>
            </div>

            {/* Favorite Button — visible only on mobile, replaces volume */}
            <div className="flex sm:hidden items-center ml-auto w-16 justify-end">
              <button
                onClick={() => toggleFavorite(currentTrack.id)}
                className={`p-1.5 rounded-lg transition cursor-pointer ${
                  isFavorite(currentTrack.id)
                    ? 'text-rose-400 bg-rose-500/10'
                    : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/70'
                }`}
                title={isFavorite(currentTrack.id) ? 'Удалить из избранного' : 'Добавить в избранное'}
              >
                <Heart className={`w-3.5 h-3.5 ${isFavorite(currentTrack.id) ? 'fill-rose-400' : ''}`} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

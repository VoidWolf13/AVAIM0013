import React, { useState, useEffect, useRef } from 'react';
import { useAudio } from '../context/AudioContext';
import { VisualizerCanvas } from './VisualizerCanvas';
import { Track, VisualizerMode } from '../types';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  Sparkles,
  Radio,
  Activity,
  Disc3,
  Flame,
  Heart,
  Share2,
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
    currentTrackIndex,
    isPlaying,
    currentTime,
    duration,
    volume,
    isMuted,
    visualizerMode,
    togglePlayPause,
    playNext,
    playPrevious,
    seek,
    setVolume,
    toggleMute,
    setVisualizerMode,
    toggleFavorite,
    isFavorite,
  } = useAudio();

  const [controlsVisible, setControlsVisible] = useState(true);
  const idleTimerRef = useRef<number | null>(null);

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

  const visualizerModes: { id: VisualizerMode; label: string; icon: React.ReactNode }[] = [
    { id: 'radial', label: 'Круговой импульс', icon: <Disc3 className="w-4 h-4" /> },
    { id: 'bars', label: 'Спектральные полосы', icon: <Radio className="w-4 h-4" /> },
    { id: 'waveform', label: 'Осциллограф', icon: <Activity className="w-4 h-4" /> },
    { id: 'particles', label: 'Звездная туманность', icon: <Sparkles className="w-4 h-4" /> },
  ];

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
        />
        {/* Subtle vignette layer */}
        <div className="absolute inset-0 pointer-events-none bg-radial-gradient from-transparent via-black/30 to-black/80" />
      </div>

      {/* Top Header Bar */}
      <div
        className={`relative z-10 p-6 flex items-center justify-between transition-opacity duration-500 ${
          controlsVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-neutral-900/80 border border-neutral-700 backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-neutral-300 animate-ping" />
            <span className="text-xs font-mono font-bold tracking-wider text-neutral-200">ZEN VOID MODE</span>
          </div>
          <span className="text-xs font-mono text-neutral-400">
            Track #{currentTrackIndex + 1} of {tracks.length}
          </span>
        </div>

        {/* Visualizer Mode Switcher */}
        <div className="flex items-center gap-1.5 p-1 bg-neutral-900/80 border border-neutral-800 backdrop-blur-md rounded-xl">
          {visualizerModes.map((m) => {
            const isActive = visualizerMode === m.id;
            return (
              <button
                key={m.id}
                onClick={() => setVisualizerMode(m.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                  isActive
                    ? 'bg-neutral-800 text-neutral-200 border border-neutral-700 shadow-sm'
                    : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800'
                }`}
                title={m.label}
              >
                {m.icon}
                <span className="hidden sm:inline">{m.label}</span>
              </button>
            );
          })}
        </div>

        {/* Exit Fullscreen */}
        <button
          onClick={onClose}
          id="exit-zen-mode"
          className="p-2.5 rounded-full bg-neutral-900/80 border border-neutral-800 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 backdrop-blur-md transition"
          title="Выйти из полноэкранного режима (Esc)"
        >
          <Minimize2 className="w-5 h-5" />
        </button>
      </div>

      {/* Center Track Title HUD */}
      <div
        className={`relative z-10 text-center px-4 max-w-2xl mx-auto transition-opacity duration-500 pointer-events-none ${
          controlsVisible ? 'opacity-100' : 'opacity-20'
        }`}
      >
        <div className="inline-block mb-2 px-3 py-1 rounded-full bg-neutral-900/80 border border-neutral-800 text-neutral-400 text-xs font-mono tracking-widest uppercase">
          AVAIM0013 • {currentTrack.moodTag}
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold font-mono tracking-wide text-neutral-200 drop-shadow-[0_4px_20px_rgba(0,0,0,0.9)]">
          {currentTrack.title}
        </h1>
        <p className="text-xs sm:text-sm text-neutral-400 mt-2 font-mono drop-shadow">
          {currentTrack.description}
        </p>
      </div>

      {/* Bottom Floating Control Bar */}
      <div
        className={`relative z-10 p-6 max-w-3xl w-full mx-auto transition-opacity duration-500 ${
          controlsVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div className="bg-neutral-900/90 border border-neutral-800/90 backdrop-blur-xl rounded-2xl p-4 shadow-2xl space-y-3">
          {/* Timeline Bar */}
          <div className="space-y-1">
            <div className="relative flex items-center group">
              <input
                type="range"
                min="0"
                max={duration || 100}
                value={currentTime}
                onChange={(e) => seek(parseFloat(e.target.value))}
                title="Перемотка трека"
                className="w-full h-2 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-neutral-300"
              />
            </div>
            <div className="flex justify-between text-xs font-mono text-neutral-400 px-0.5">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Controls Row */}
          <div className="flex items-center justify-between pt-1">
            {/* Left Actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => toggleFavorite(currentTrack.id)}
                className={`p-2 rounded-xl transition ${
                  isFavorite(currentTrack.id)
                    ? 'text-rose-400 bg-rose-500/10'
                    : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800'
                }`}
                title={isFavorite(currentTrack.id) ? 'Удалить из избранного' : 'Добавить в избранное'}
              >
                <Heart className={`w-4 h-4 ${isFavorite(currentTrack.id) ? 'fill-rose-400' : ''}`} />
              </button>
              <button
                onClick={onShare}
                className="p-2 rounded-xl text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 transition"
                title="Поделиться ссылкой на трек"
              >
                <Share2 className="w-4 h-4" />
              </button>
            </div>

            {/* Playback Controls */}
            <div className="flex items-center gap-3">
              <button
                onClick={playPrevious}
                className="p-2.5 rounded-full text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 transition"
                title="Предыдущий трек (P / ←)"
              >
                <SkipBack className="w-5 h-5" />
              </button>
              <button
                onClick={togglePlayPause}
                id="zen-play-pause-btn"
                className="p-4 rounded-full bg-neutral-200 hover:bg-neutral-300 text-neutral-950 shadow-lg transition transform active:scale-95"
                title={isPlaying ? 'Пауза (Пробел)' : 'Воспроизведение (Пробел)'}
              >
                {isPlaying ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current ml-0.5" />}
              </button>
              <button
                onClick={playNext}
                className="p-2.5 rounded-full text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 transition"
                title="Следующий трек (N / →)"
              >
                <SkipForward className="w-5 h-5" />
              </button>
            </div>

            {/* Volume */}
            <div className="flex items-center gap-2">
              <button
                onClick={toggleMute}
                className="p-2 text-neutral-400 hover:text-neutral-200 transition"
                title={isMuted ? 'Включить звук (M)' : 'Выключить звук (M)'}
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="w-4 h-4 text-rose-400" />
                ) : (
                  <Volume2 className="w-4 h-4" />
                )}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={isMuted ? 0 : volume}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                title={`Громкость: ${Math.round((isMuted ? 0 : volume) * 100)}%`}
                className="w-20 sm:w-28 h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-neutral-300"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

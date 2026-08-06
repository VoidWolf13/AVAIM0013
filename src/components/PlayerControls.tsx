import React from 'react';
import { useAudio } from '../context/AudioContext';
import { VisualizerCanvas } from './VisualizerCanvas';
import { VisualizerMode } from '../types';
import { getTrackAudioUrl, ARTIST_NAME } from '../data/tracks';
import { formatTime } from '../utils/formatTime';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
  Repeat1,
  Volume2,
  VolumeX,
  Volume1,
  Heart,
  Radio,
  Activity,
  Disc3,
  Sparkles,
  Sliders,
  Moon,
} from 'lucide-react';

interface PlayerControlsProps {
  onOpenEQ: () => void;
  onOpenSleep: () => void;
  onOpenZen?: () => void;
  onShowToast: (text: string) => void;
}

export const PlayerControls: React.FC<PlayerControlsProps> = ({
  onOpenEQ,
  onOpenSleep,
  onShowToast,
}) => {
  const {
    tracks,
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    buffered,
    volume,
    isMuted,
    playbackMode,
    visualizerMode,
    togglePlayPause,
    playNext,
    playPrevious,
    seek,
    setVolume,
    toggleMute,
    setPlaybackMode,
    setVisualizerMode,
    toggleFavorite,
    isFavorite,
    sleepTimerRemaining,
  } = useAudio();

  const audioUrl = getTrackAudioUrl(currentTrack);
  const bufferedPercent = duration ? (buffered / duration) * 100 : 0;
  const progressPercent = duration ? (currentTime / duration) * 100 : 0;

  const toggleShuffle = () => {
    if (playbackMode === 'random') {
      setPlaybackMode('sequential');
      onShowToast('Случайный порядок: Выкл');
    } else {
      setPlaybackMode('random');
      onShowToast('Случайный порядок: Вкл');
    }
  };

  const toggleRepeat = () => {
    if (playbackMode === 'loop') {
      setPlaybackMode('sequential');
      onShowToast('Повтор трека: Выкл');
    } else {
      setPlaybackMode('loop');
      onShowToast('Повтор трека: Вкл');
    }
  };

  const visModes: { id: VisualizerMode; label: string; icon: React.ReactNode }[] = [
    { id: 'bars', label: 'Спектр', icon: <Radio className="w-3.5 h-3.5" /> },
    { id: 'waveform', label: 'Волна', icon: <Activity className="w-3.5 h-3.5" /> },
    { id: 'radial', label: 'Круг', icon: <Disc3 className="w-3.5 h-3.5" /> },
    { id: 'particles', label: 'Космос', icon: <Sparkles className="w-3.5 h-3.5" /> },
  ];

  return (
    <section
      id="main-player-card"
      className="w-full rounded-2xl bg-neutral-900/70 border border-neutral-800 p-5 sm:p-6 shadow-xl backdrop-blur-md space-y-5"
    >
      {/* Top Header Row inside Player: Track Title & Action Buttons */}
      <div className="flex items-start sm:items-center justify-between gap-3">
        <div className="space-y-0.5 min-w-0 flex-1">
          <h2 className="text-lg sm:text-xl font-medium font-mono text-neutral-100 tracking-wide truncate">
            {currentTrack.title}
          </h2>
          <p className="text-xs text-neutral-400 font-mono tracking-wider truncate">
            {ARTIST_NAME}
          </p>
        </div>

        <div className="flex items-center gap-1 shrink-0 pt-0.5 sm:pt-0">
          {/* Sleep Timer button */}
          <button
            onClick={onOpenSleep}
            className={`p-2 rounded-lg transition ${
              sleepTimerRemaining !== null
                ? 'text-neutral-200 bg-neutral-800 border border-neutral-700'
                : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800'
            }`}
            title={sleepTimerRemaining !== null ? `Таймер сна: ${formatTime(sleepTimerRemaining)}` : 'Таймер сна'}
          >
            <Moon className="w-4 h-4" />
          </button>

          {/* EQ button */}
          <button
            onClick={onOpenEQ}
            className="p-2 rounded-lg text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 transition"
            title="Эквалайзер звука"
          >
            <Sliders className="w-4 h-4" />
          </button>

          {/* Favorite */}
          <button
            onClick={() => toggleFavorite(currentTrack.id)}
            disabled={tracks.length === 0}
            className={`p-2 rounded-lg transition disabled:opacity-40 ${
              isFavorite(currentTrack.id)
                ? 'text-rose-400'
                : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800'
            }`}
            title={isFavorite(currentTrack.id) ? 'Удалить из избранного' : 'Добавить в избранное'}
          >
            <Heart className={`w-4 h-4 ${isFavorite(currentTrack.id) ? 'fill-rose-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Visualizer Display */}
      <div className="space-y-2">
        <div className="w-full h-28 rounded-xl bg-neutral-950 border border-neutral-800 relative overflow-hidden">
          <VisualizerCanvas
            className="w-full h-full"
            mode={visualizerMode}
            showOverlayStats={false}
          />
        </div>

        {/* Visualizer Mode Selector */}
        <div className="flex items-center justify-center gap-1 text-[11px] font-mono">
          {visModes.map((m) => (
            <button
              key={m.id}
              onClick={() => setVisualizerMode(m.id)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition ${
                visualizerMode === m.id
                  ? 'bg-neutral-800 text-neutral-200 font-medium border border-neutral-700'
                  : 'text-neutral-500 hover:text-neutral-300 hover:bg-neutral-900'
              }`}
            >
              {m.icon}
              <span>{m.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Progress Timeline Scrubber */}
      <div className="space-y-1.5 pt-1">
        <div className="relative flex items-center h-6 group cursor-pointer">
          {/* Background Track & Fill Bars */}
          <div className="w-full h-1.5 bg-neutral-800 rounded-full overflow-hidden relative">
            <div
              className="absolute left-0 top-0 h-full bg-neutral-700/50 rounded-full transition-all"
              style={{ width: `${Math.min(100, Math.max(0, bufferedPercent))}%` }}
            />
            <div
              className="absolute left-0 top-0 h-full bg-neutral-200 rounded-full transition-all"
              style={{ width: `${Math.min(100, Math.max(0, progressPercent))}%` }}
            />
          </div>

          {/* Thumb circle (always on top of bars with z-20) */}
          <div
            className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-white border border-neutral-900 rounded-full shadow-lg pointer-events-none transition-transform group-hover:scale-125 z-20"
            style={{
              left: `calc(${Math.min(100, Math.max(0, progressPercent))}% - 7px)`,
            }}
          />

          {/* Transparent full-hitbox range input */}
          <input
            id="audio-scrubber"
            type="range"
            min="0"
            max={duration || 100}
            step="0.1"
            value={currentTime}
            onChange={(e) => seek(parseFloat(e.target.value))}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-30"
            aria-label="Перемотка трека"
          />
        </div>
        <div className="flex justify-between text-xs font-mono text-neutral-400">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Centerpiece Transport Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2 border-t border-neutral-800/70">
        {/* Left: Playback Modes (Repeat & Shuffle side by side) */}
        <div className="flex items-center gap-1.5 order-2 sm:order-1">
          {/* Repeat Button */}
          <button
            onClick={toggleRepeat}
            className={`p-2 rounded-lg text-xs transition ${
              playbackMode === 'loop'
                ? 'text-white bg-neutral-800 border border-neutral-600 shadow-sm'
                : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/70'
            }`}
            title={playbackMode === 'loop' ? 'Повтор трека: Вкл (R)' : 'Повтор трека: Выкл (R)'}
          >
            {playbackMode === 'loop' ? <Repeat1 className="w-4 h-4 text-white" /> : <Repeat className="w-4 h-4" />}
          </button>

          {/* Shuffle Button (Случайное проигрывание) */}
          <button
            onClick={toggleShuffle}
            className={`p-2 rounded-lg text-xs transition ${
              playbackMode === 'random'
                ? 'text-white bg-neutral-800 border border-neutral-600 shadow-sm'
                : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/70'
            }`}
            title={playbackMode === 'random' ? 'Случайное воспроизведение: Вкл (S)' : 'Случайное воспроизведение: Выкл (S)'}
          >
            <Shuffle className="w-4 h-4" />
          </button>
        </div>

        {/* Center: Main Playback Controls */}
        <div className="flex items-center gap-4 order-1 sm:order-2">
          <button
            onClick={playPrevious}
            className="p-2.5 text-neutral-400 hover:text-neutral-200 transition"
            title="Предыдущий трек (P / ←)"
          >
            <SkipBack className="w-5 h-5" />
          </button>

          <button
            onClick={togglePlayPause}
            className="w-13 h-13 rounded-full bg-neutral-200 hover:bg-neutral-300 text-neutral-950 flex items-center justify-center transition transform active:scale-95 shadow-md"
            title={isPlaying ? 'Пауза (Пробел)' : 'Воспроизведение (Пробел)'}
          >
            {isPlaying ? (
              <Pause className="w-6 h-6 fill-current" />
            ) : (
              <Play className="w-6 h-6 fill-current ml-0.5" />
            )}
          </button>

          <button
            onClick={playNext}
            className="p-2.5 text-neutral-400 hover:text-neutral-200 transition"
            title="Следующий трек (N / →)"
          >
            <SkipForward className="w-5 h-5" />
          </button>
        </div>

        {/* Right: Volume Slider */}
        <div className="flex items-center gap-2 order-3">
          <button
            onClick={toggleMute}
            className="p-1.5 text-neutral-400 hover:text-neutral-200 transition"
            title={isMuted ? 'Включить звук (M)' : 'Выключить звук (M)'}
          >
            {isMuted || volume === 0 ? (
              <VolumeX className="w-4 h-4 text-rose-400" />
            ) : volume < 0.5 ? (
              <Volume1 className="w-4 h-4" />
            ) : (
              <Volume2 className="w-4 h-4" />
            )}
          </button>
          <div className="relative flex items-center w-20 h-5 group cursor-pointer">
            {/* Background track & fill */}
            <div className="w-full h-1 bg-neutral-800 rounded-full overflow-hidden relative">
              <div
                className="absolute left-0 top-0 h-full bg-neutral-300 rounded-full transition-all"
                style={{ width: `${(isMuted ? 0 : volume) * 100}%` }}
              />
            </div>
            {/* Volume thumb circle (z-20) */}
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
              step="0.02"
              value={isMuted ? 0 : volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              title={`Громкость: ${Math.round((isMuted ? 0 : volume) * 100)}%`}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-30"
              aria-label="Громкость"
            />
          </div>
        </div>
      </div>
    </section>
  );
};

import React from 'react';
import { useAudio } from '../context/AudioContext';
import { VisualizerCanvas } from './VisualizerCanvas';
import { VisualizerMode } from '../types';
import { getTrackAudioUrl } from '../data/tracks';
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
  Download,
  Info,
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
  onOpenZen: () => void;
  onOpenTrackInfo: () => void;
  onOpenQueue: () => void;
  onShowToast: (text: string) => void;
}

export const PlayerControls: React.FC<PlayerControlsProps> = ({
  onOpenEQ,
  onOpenSleep,
  onOpenTrackInfo,
  onShowToast,
}) => {
  const {
    tracks,
    currentTrack,
    currentTrackIndex,
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

  const cyclePlaybackMode = () => {
    if (playbackMode === 'sequential') {
      setPlaybackMode('random');
      onShowToast('Shuffle On');
    } else if (playbackMode === 'random') {
      setPlaybackMode('loop');
      onShowToast('Repeat Track');
    } else {
      setPlaybackMode('sequential');
      onShowToast('Sequential Play');
    }
  };

  const visModes: { id: VisualizerMode; label: string; icon: React.ReactNode }[] = [
    { id: 'bars', label: 'Spectrum', icon: <Radio className="w-3.5 h-3.5" /> },
    { id: 'waveform', label: 'Waveform', icon: <Activity className="w-3.5 h-3.5" /> },
    { id: 'radial', label: 'Radial', icon: <Disc3 className="w-3.5 h-3.5" /> },
    { id: 'particles', label: 'Cosmic', icon: <Sparkles className="w-3.5 h-3.5" /> },
  ];

  return (
    <section
      id="main-player-card"
      className="w-full rounded-2xl bg-neutral-900/70 border border-neutral-800 p-5 sm:p-6 shadow-xl backdrop-blur-md space-y-5"
    >
      {/* Top Header Row inside Player: Track number & Quick tools */}
      <div className="flex items-center justify-between text-xs font-mono text-neutral-400">
        <div className="flex items-center gap-2">
          <span className="text-neutral-200 font-bold bg-neutral-800 px-2 py-0.5 rounded border border-neutral-700">
            {tracks.length > 0
              ? `#${String(currentTrackIndex + 1).padStart(2, '0')} / ${tracks.length}`
              : '#00 / 0'}
          </span>
          <span className="uppercase text-neutral-400 font-semibold">{currentTrack.format || 'MP3'}</span>
        </div>

        <div className="flex items-center gap-1">
          {/* Sleep Timer button */}
          <button
            onClick={onOpenSleep}
            className={`p-1.5 rounded-lg transition ${
              sleepTimerRemaining !== null
                ? 'text-neutral-200 bg-neutral-800 border border-neutral-700'
                : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800'
            }`}
            title={sleepTimerRemaining !== null ? `Timer: ${formatTime(sleepTimerRemaining)}` : 'Sleep Timer'}
          >
            <Moon className="w-3.5 h-3.5" />
          </button>

          {/* EQ button */}
          <button
            onClick={onOpenEQ}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 transition"
            title="Audio Equalizer"
          >
            <Sliders className="w-3.5 h-3.5" />
          </button>

          {/* Info Modal */}
          <button
            onClick={onOpenTrackInfo}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 transition"
            title="Track Details"
          >
            <Info className="w-3.5 h-3.5" />
          </button>

          {/* Favorite */}
          <button
            onClick={() => toggleFavorite(currentTrack.id)}
            disabled={tracks.length === 0}
            className={`p-1.5 rounded-lg transition disabled:opacity-40 ${
              isFavorite(currentTrack.id)
                ? 'text-rose-400'
                : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800'
            }`}
            title="Favorite"
          >
            <Heart className={`w-3.5 h-3.5 ${isFavorite(currentTrack.id) ? 'fill-rose-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Track Title & Description */}
      <div className="space-y-1 text-center sm:text-left">
        <h2 className="text-xl sm:text-2xl font-bold font-mono text-neutral-200 tracking-tight truncate">
          {currentTrack.title}
        </h2>
        <p className="text-xs text-neutral-400 line-clamp-1 font-mono">
          {currentTrack.moodTag} • {currentTrack.bpm} BPM
        </p>
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
        <div className="relative flex items-center h-4 group">
          <div
            className="absolute left-0 h-1 bg-neutral-800 rounded-full pointer-events-none transition-all"
            style={{ width: `${Math.min(100, bufferedPercent)}%` }}
          />
          <input
            id="audio-scrubber"
            type="range"
            min="0"
            max={duration || 100}
            value={currentTime}
            onChange={(e) => seek(parseFloat(e.target.value))}
            className="w-full h-1 bg-neutral-800/80 rounded-full appearance-none cursor-pointer accent-neutral-300 focus:outline-none"
          />
        </div>
        <div className="flex justify-between text-xs font-mono text-neutral-400">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Centerpiece Transport Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2 border-t border-neutral-800/70">
        {/* Left: Playback Mode (Shuffle / Repeat) */}
        <div className="flex items-center gap-2 order-2 sm:order-1">
          <button
            onClick={cyclePlaybackMode}
            className={`p-2 rounded-lg text-xs transition ${
              playbackMode !== 'sequential'
                ? 'text-neutral-200 bg-neutral-800 border border-neutral-700'
                : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800'
            }`}
            title={`Playback: ${playbackMode}`}
          >
            {playbackMode === 'random' && <Shuffle className="w-4 h-4" />}
            {playbackMode === 'loop' && <Repeat1 className="w-4 h-4" />}
            {playbackMode === 'sequential' && <Repeat className="w-4 h-4" />}
          </button>

          <a
            href={audioUrl}
            download={currentTrack.filename}
            target="_blank"
            rel="noreferrer"
            onClick={() => onShowToast(`Downloading ${currentTrack.filename}...`)}
            className="p-2 rounded-lg text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 transition"
            title="Download Track"
          >
            <Download className="w-4 h-4" />
          </a>
        </div>

        {/* Center: Main Playback Controls */}
        <div className="flex items-center gap-4 order-1 sm:order-2">
          <button
            onClick={playPrevious}
            className="p-2.5 text-neutral-400 hover:text-neutral-200 transition"
            title="Previous (P)"
          >
            <SkipBack className="w-5 h-5" />
          </button>

          <button
            onClick={togglePlayPause}
            className="w-13 h-13 rounded-full bg-neutral-200 hover:bg-neutral-300 text-neutral-950 flex items-center justify-center transition transform active:scale-95 shadow-md"
            title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
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
            title="Next (N)"
          >
            <SkipForward className="w-5 h-5" />
          </button>
        </div>

        {/* Right: Volume Slider */}
        <div className="flex items-center gap-2 order-3">
          <button
            onClick={toggleMute}
            className="p-1.5 text-neutral-400 hover:text-neutral-200 transition"
            title="Mute (M)"
          >
            {isMuted || volume === 0 ? (
              <VolumeX className="w-4 h-4 text-rose-400" />
            ) : volume < 0.5 ? (
              <Volume1 className="w-4 h-4" />
            ) : (
              <Volume2 className="w-4 h-4" />
            )}
          </button>
          <input
            type="range"
            min="0"
            max="1"
            step="0.02"
            value={isMuted ? 0 : volume}
            onChange={(e) => setVolume(parseFloat(e.target.value))}
            className="w-20 h-1 bg-neutral-800 rounded-full appearance-none cursor-pointer accent-neutral-300 focus:outline-none"
          />
        </div>
      </div>
    </section>
  );
};

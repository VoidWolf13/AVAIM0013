import React, { useState } from 'react';
import { Track } from '../types';
import { getTrackAudioUrl } from '../data/tracks';
import { X, Play, FileAudio, Check, Copy, Sparkles, Activity } from 'lucide-react';
import { useAudio } from '../context/AudioContext';

interface TrackInfoModalProps {
  track: Track | null;
  isOpen: boolean;
  onClose: () => void;
  onShowToast: (text: string) => void;
}

export const TrackInfoModal: React.FC<TrackInfoModalProps> = ({ track, isOpen, onClose, onShowToast }) => {
  const { playTrack, currentTrack, isPlaying, analyzeTrackGenre } = useAudio();
  const [copied, setCopied] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  if (!isOpen || !track) return null;

  const audioUrl = getTrackAudioUrl(track);
  const isCurrentlyPlaying = currentTrack.id === track.id && isPlaying;

  const copyTrackLink = () => {
    navigator.clipboard.writeText(audioUrl);
    setCopied(true);
    onShowToast(`Audio URL скопирован`);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRunAnalysis = async () => {
    if (!track) return;
    setIsAnalyzing(true);
    onShowToast(`Анализ аудиосигнала "${track.title}"...`);
    try {
      const result = await analyzeTrackGenre(track.id);
      if (result) {
        onShowToast(`Определен жанр: ${result.moodTag} (${result.detectedBpm} BPM)`);
      } else {
        onShowToast('Анализ завершен');
      }
    } catch {
      onShowToast('Ошибка при анализе аудиофайла');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div
      id="track-info-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn"
      onClick={onClose}
    >
      <div
        id="track-info-content"
        className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-2xl p-5 shadow-2xl space-y-4 text-neutral-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-neutral-800 text-neutral-200 border border-neutral-700">
              <FileAudio className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-neutral-400 font-semibold">
                Трек #{track.id + 1}
              </span>
              <h3 className="text-base font-bold font-mono text-neutral-200 truncate max-w-[240px]">{track.title}</h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 transition"
            title="Закрыть (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-2 gap-2 text-xs font-mono">
          <div className="p-2.5 rounded-xl bg-neutral-950 border border-neutral-800/80">
            <span className="text-[10px] text-neutral-500 block uppercase">Формат</span>
            <span className="text-neutral-200 font-semibold uppercase">{track.format}</span>
          </div>
          <div className="p-2.5 rounded-xl bg-neutral-950 border border-neutral-800/80">
            <span className="text-[10px] text-neutral-500 block uppercase">Темп (BPM)</span>
            <span className="text-neutral-200 font-semibold">{track.bpm ? `${track.bpm} BPM` : 'Определяется'}</span>
          </div>
          <div className="p-2.5 rounded-xl bg-neutral-950 border border-neutral-800/80">
            <span className="text-[10px] text-neutral-500 block uppercase">Длительность</span>
            <span className="text-neutral-200 font-semibold">{track.durationEst}</span>
          </div>
          <div className="p-2.5 rounded-xl bg-neutral-950 border border-neutral-800/80">
            <span className="text-[10px] text-neutral-500 block uppercase">Жанр / Стиль</span>
            <span className="text-neutral-200 font-semibold truncate block">{track.moodTag}</span>
          </div>
        </div>

        {/* Description */}
        <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800/80 text-xs text-neutral-300 font-sans leading-relaxed">
          {track.description}
        </div>

        {/* Audio Analysis Trigger Button */}
        <div className="p-2.5 rounded-xl bg-neutral-950/80 border border-neutral-800 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-[11px] font-mono text-neutral-400">
            <Activity className="w-3.5 h-3.5 text-neutral-400" />
            <span>{track.isAnalyzed ? 'Аудиосигнал проанализирован' : 'Авто-определение жанра'}</span>
          </div>
          <button
            onClick={handleRunAnalysis}
            disabled={isAnalyzing}
            className="px-2.5 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-[11px] font-mono flex items-center gap-1.5 transition disabled:opacity-50"
            title="Запустить спектральный анализ аудиосигнала трека"
          >
            <Sparkles className={`w-3 h-3 text-neutral-300 ${isAnalyzing ? 'animate-spin' : ''}`} />
            <span>{isAnalyzing ? 'Анализ...' : 'Определить по аудио'}</span>
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 pt-1">
          <button
            onClick={() => {
              playTrack(track);
              onClose();
            }}
            className="flex-1 py-2 px-3 rounded-xl bg-neutral-200 hover:bg-neutral-300 text-neutral-950 font-mono text-xs font-bold flex items-center justify-center gap-1.5 transition"
            title={isCurrentlyPlaying ? 'Трек уже воспроизводится' : 'Начать воспроизведение трека'}
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>{isCurrentlyPlaying ? 'Сейчас играет' : 'Слушать трек'}</span>
          </button>

          <button
            onClick={copyTrackLink}
            className="p-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white border border-neutral-700 transition"
            title="Скопировать ссылку на аудиофайл"
          >
            {copied ? <Check className="w-4 h-4 text-white" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
};

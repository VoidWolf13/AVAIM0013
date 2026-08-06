import React from 'react';
import { useAudio } from '../context/AudioContext';
import { EQPreset } from '../types';
import { Sliders, RotateCcw, X, Volume2 } from 'lucide-react';

interface AudioEqualizerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PRESETS: { id: EQPreset; label: string; desc: string }[] = [
  { id: 'flat', label: 'Стандарт', desc: 'Сбалансированное звучание' },
  { id: 'bass-boost', label: 'Бас-буст', desc: 'Усиление низких частот' },
  { id: 'ambient-spatial', label: 'Объёмный', desc: 'Воздушные верха и глубина' },
  { id: 'cyber-treble', label: 'Высокие', desc: 'Четкие синтезаторные верха' },
  { id: 'lofi-warmth', label: 'Lo-Fi', desc: 'Теплые насыщенные средние частоты' },
  { id: 'vocal-clarity', label: 'Чистый', desc: 'Акцент на вокал и солирующие партии' },
];

export const AudioEqualizerModal: React.FC<AudioEqualizerModalProps> = ({ isOpen, onClose }) => {
  const { eqSettings, setEQPreset, setCustomEQ } = useAudio();

  if (!isOpen) return null;

  return (
    <div
      id="eq-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn"
      onClick={onClose}
    >
      <div
        id="eq-modal-content"
        className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-2xl p-5 shadow-2xl space-y-5 text-neutral-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-neutral-800 text-white border border-neutral-700">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold font-mono text-white">Эквалайзер звука</h3>
              <p className="text-[11px] text-neutral-400 font-mono">3-полосный параметрический фильтр Web Audio</p>
            </div>
          </div>
          <button
            id="close-eq-modal"
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition"
            title="Закрыть (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Preset Selector */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-mono text-neutral-400">
            <span>Звуковые профили</span>
            <button
              onClick={() => setEQPreset('flat')}
              className="flex items-center gap-1 text-neutral-300 hover:text-white transition text-[11px]"
              title="Сбросить эквалайзер на стандартное звучание"
            >
              <RotateCcw className="w-3 h-3" />
              Сброс (Flat)
            </button>
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            {PRESETS.map((p) => {
              const isActive = eqSettings.preset === p.id;
              return (
                <button
                  key={p.id}
                  id={`preset-${p.id}`}
                  onClick={() => setEQPreset(p.id)}
                  title={p.desc}
                  className={`p-2 rounded-lg text-center border transition text-xs flex flex-col items-center justify-center ${
                    isActive
                      ? 'bg-neutral-800 border-neutral-600 text-white font-semibold'
                      : 'bg-neutral-950/60 border-neutral-800 text-neutral-400 hover:border-neutral-700 hover:text-neutral-200'
                  }`}
                >
                  <span className="truncate">{p.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Sliders */}
        <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-4 space-y-4">
          {/* Bass Band */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-neutral-300">Бас (180 Гц)</span>
              <span className="text-neutral-400">
                {eqSettings.bass > 0 ? `+${eqSettings.bass}` : eqSettings.bass} дБ
              </span>
            </div>
            <input
              type="range"
              min="-12"
              max="12"
              step="1"
              value={eqSettings.bass}
              onChange={(e) => setCustomEQ('bass', parseFloat(e.target.value))}
              title={`Низкие частоты: ${eqSettings.bass > 0 ? `+${eqSettings.bass}` : eqSettings.bass} дБ`}
              className="w-full h-1 bg-neutral-800 rounded-full appearance-none cursor-pointer accent-white focus:outline-none"
            />
          </div>

          {/* Mid Band */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-neutral-300">Средние (1.2 кГц)</span>
              <span className="text-neutral-400">
                {eqSettings.mid > 0 ? `+${eqSettings.mid}` : eqSettings.mid} дБ
              </span>
            </div>
            <input
              type="range"
              min="-12"
              max="12"
              step="1"
              value={eqSettings.mid}
              onChange={(e) => setCustomEQ('mid', parseFloat(e.target.value))}
              title={`Средние частоты: ${eqSettings.mid > 0 ? `+${eqSettings.mid}` : eqSettings.mid} дБ`}
              className="w-full h-1 bg-neutral-800 rounded-full appearance-none cursor-pointer accent-white focus:outline-none"
            />
          </div>

          {/* Treble Band */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-neutral-300">Высокие (6.5 кГц)</span>
              <span className="text-neutral-400">
                {eqSettings.treble > 0 ? `+${eqSettings.treble}` : eqSettings.treble} дБ
              </span>
            </div>
            <input
              type="range"
              min="-12"
              max="12"
              step="1"
              value={eqSettings.treble}
              onChange={(e) => setCustomEQ('treble', parseFloat(e.target.value))}
              title={`Высокие частоты: ${eqSettings.treble > 0 ? `+${eqSettings.treble}` : eqSettings.treble} дБ`}
              className="w-full h-1 bg-neutral-800 rounded-full appearance-none cursor-pointer accent-white focus:outline-none"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import { useAudio } from '../context/AudioContext';
import { Moon, X, Check, Timer } from 'lucide-react';
import { formatTime } from '../utils/formatTime';

interface SleepTimerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const TIMER_OPTIONS = [
  { minutes: 15, label: '15 минут' },
  { minutes: 30, label: '30 минут' },
  { minutes: 45, label: '45 минут' },
  { minutes: 60, label: '1 час' },
  { minutes: 90, label: '1.5 часа' },
  { minutes: null, label: 'Отключить таймер' },
];

export const SleepTimerModal: React.FC<SleepTimerModalProps> = ({ isOpen, onClose }) => {
  const { sleepTimerRemaining, sleepTimerDuration, setSleepTimer } = useAudio();

  if (!isOpen) return null;

  return (
    <div
      id="sleep-timer-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn"
      onClick={onClose}
    >
      <div
        id="sleep-timer-content"
        className="w-full max-w-sm bg-neutral-900 border border-neutral-800 rounded-2xl p-5 shadow-2xl space-y-4 text-neutral-100"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-neutral-800 text-white border border-neutral-700">
              <Moon className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold font-mono text-white">Таймер сна</h3>
              <p className="text-[11px] text-neutral-400 font-mono">Плавное затухание звука при завершении</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition"
            title="Закрыть (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Active Timer Indicator */}
        {sleepTimerRemaining !== null && (
          <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-3 flex items-center justify-between text-xs font-mono">
            <div className="flex items-center gap-2 text-neutral-300">
              <Timer className="w-4 h-4 animate-pulse text-white" />
              <span>Осталось времени:</span>
            </div>
            <span className="text-sm font-bold text-white bg-neutral-800 px-2.5 py-0.5 rounded border border-neutral-700">
              {formatTime(sleepTimerRemaining)}
            </span>
          </div>
        )}

        {/* Preset list */}
        <div className="space-y-1.5">
          {TIMER_OPTIONS.map((opt) => {
            const isSelected =
              opt.minutes === null
                ? sleepTimerDuration === null
                : sleepTimerDuration === opt.minutes;

            return (
              <button
                key={opt.label}
                onClick={() => {
                  setSleepTimer(opt.minutes);
                  if (opt.minutes === null) onClose();
                }}
                title={opt.minutes !== null ? `Установить таймер на ${opt.label}` : 'Выключить таймер сна'}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-mono border transition ${
                  isSelected
                    ? 'bg-neutral-800 border-neutral-600 text-white font-semibold'
                    : 'bg-neutral-950/60 border-neutral-800/80 text-neutral-300 hover:border-neutral-700 hover:text-white'
                }`}
              >
                <span>{opt.label}</span>
                {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

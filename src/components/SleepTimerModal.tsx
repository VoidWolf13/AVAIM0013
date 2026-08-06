import React, { useState, useEffect } from 'react';
import { useAudio } from '../context/AudioContext';
import { Moon, X, Check, Timer, Clock } from 'lucide-react';
import { formatTime } from '../utils/formatTime';

interface SleepTimerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PRESET_OPTIONS = [
  { minutes: 30, label: '30 мин' },
  { minutes: 60, label: '1 час' },
  { minutes: 120, label: '2 часа' },
];

export const SleepTimerModal: React.FC<SleepTimerModalProps> = ({ isOpen, onClose }) => {
  const { sleepTimerRemaining, sleepTimerDuration, setSleepTimer } = useAudio();
  const [isCustomOpen, setIsCustomOpen] = useState(false);
  const [customHours, setCustomHours] = useState<number>(0);
  const [customMinutes, setCustomMinutes] = useState<number>(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const isPresetActive = (mins: number) => sleepTimerDuration === mins;
  const isCustomActive =
    sleepTimerDuration !== null && !PRESET_OPTIONS.some((p) => p.minutes === sleepTimerDuration);

  // Sync state when custom timer is already active
  useEffect(() => {
    if (isCustomActive && sleepTimerDuration !== null) {
      const h = Math.min(12, Math.floor(sleepTimerDuration / 60));
      const m = Math.min(50, Math.floor((sleepTimerDuration % 60) / 10) * 10);
      setCustomHours(h);
      setCustomMinutes(m);
      setIsCustomOpen(true);
    }
  }, [isCustomActive, sleepTimerDuration, isOpen]);

  if (!isOpen) return null;

  const handleHourChange = (delta: number) => {
    setCustomHours((prev) => Math.max(0, Math.min(12, prev + delta)));
    setErrorMsg(null);
  };

  const handleMinuteChange = (delta: number) => {
    setCustomMinutes((prev) => Math.max(0, Math.min(50, prev + delta)));
    setErrorMsg(null);
  };

  const handleHourInput = (valStr: string) => {
    if (valStr === '') {
      setCustomHours(0);
      return;
    }
    const val = parseInt(valStr, 10);
    if (!isNaN(val)) {
      setCustomHours(Math.max(0, Math.min(12, val)));
      setErrorMsg(null);
    }
  };

  const handleMinuteInput = (valStr: string) => {
    if (valStr === '') {
      setCustomMinutes(0);
      return;
    }
    const val = parseInt(valStr, 10);
    if (!isNaN(val)) {
      setCustomMinutes(Math.max(0, Math.min(50, val)));
      setErrorMsg(null);
    }
  };

  const handleSetCustom = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const total = customHours * 60 + customMinutes;
    if (total <= 0) {
      setErrorMsg('Укажите время больше 0 минут');
      return;
    }
    setErrorMsg(null);
    setSleepTimer(total);
  };

  const formatCustomDuration = (mins: number) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    if (h > 0 && m > 0) return `${h} ч ${m} мин`;
    if (h > 0) return `${h} ч`;
    return `${m} мин`;
  };

  const totalCustomMinutes = customHours * 60 + customMinutes;

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
              <h3 className="text-sm font-medium font-mono text-neutral-200">Таймер сна</h3>
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
              <Timer className="w-4 h-4 animate-pulse text-neutral-200" />
              <span>Осталось времени:</span>
            </div>
            <span className="text-sm font-bold text-white bg-neutral-800 px-2.5 py-0.5 rounded border border-neutral-700">
              {formatTime(sleepTimerRemaining)}
            </span>
          </div>
        )}

        {/* Presets & Custom Options */}
        <div className="space-y-1.5">
          {PRESET_OPTIONS.map((opt) => {
            const isSelected = isPresetActive(opt.minutes);

            return (
              <button
                key={opt.label}
                onClick={() => {
                  setSleepTimer(opt.minutes);
                  setIsCustomOpen(false);
                }}
                title={`Установить таймер на ${opt.label}`}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-mono border transition ${
                  isSelected
                    ? 'bg-neutral-800 border-neutral-600 text-white font-medium'
                    : 'bg-neutral-950/60 border-neutral-800/80 text-neutral-300 hover:border-neutral-700 hover:text-white'
                }`}
              >
                <span>{opt.label}</span>
                {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
              </button>
            );
          })}

          {/* Custom Time Option */}
          <div className="rounded-xl border border-neutral-800/80 bg-neutral-950/60 overflow-hidden transition">
            <button
              onClick={() => setIsCustomOpen((prev) => !prev)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 text-xs font-mono transition ${
                isCustomActive
                  ? 'bg-neutral-800 text-white font-medium'
                  : 'text-neutral-300 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-neutral-400" />
                <span>
                  {isCustomActive && sleepTimerDuration
                    ? `Настраиваемое время (${formatCustomDuration(sleepTimerDuration)})`
                    : 'Настраиваемое время'}
                </span>
              </div>
              {isCustomActive && <Check className="w-3.5 h-3.5 text-white" />}
            </button>

            {isCustomOpen && (
              <form
                onSubmit={handleSetCustom}
                className="p-3.5 pt-2 border-t border-neutral-800/60 space-y-3"
              >
                {/* 2 Side-by-Side Stepper Fields: Hours and Minutes */}
                <div className="grid grid-cols-2 gap-3">
                  {/* Hours Field (0 to 12) */}
                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-mono text-neutral-400">
                      Часы
                    </label>
                    <div className="flex items-center gap-1 bg-neutral-900 border border-neutral-800 rounded-xl p-1">
                      {/* Left Triangle (Decrement 1 Hour) */}
                      <button
                        type="button"
                        onClick={() => handleHourChange(-1)}
                        disabled={customHours <= 0}
                        aria-label="Уменьшить на 1 час"
                        title="Уменьшить на 1 час"
                        className="w-7 h-7 rounded-lg bg-neutral-950 border border-neutral-800/80 text-neutral-400 hover:text-white hover:bg-neutral-800 hover:border-neutral-700 disabled:opacity-25 disabled:pointer-events-none transition flex items-center justify-center shrink-0"
                      >
                        <svg className="w-2.5 h-2.5 fill-current" viewBox="0 0 24 24">
                          <polygon points="16,4 6,12 16,20" />
                        </svg>
                      </button>

                      {/* Hours Input */}
                      <div className="flex-1 flex items-center justify-center min-w-0">
                        <input
                          type="number"
                          min="0"
                          max="12"
                          value={customHours}
                          onChange={(e) => handleHourInput(e.target.value)}
                          className="w-full text-center bg-transparent text-sm font-bold font-mono text-neutral-100 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                        <span className="text-[11px] font-mono text-neutral-400 pr-1 select-none">
                          ч
                        </span>
                      </div>

                      {/* Right Triangle (Increment 1 Hour) */}
                      <button
                        type="button"
                        onClick={() => handleHourChange(1)}
                        disabled={customHours >= 12}
                        aria-label="Увеличить на 1 час"
                        title="Увеличить на 1 час"
                        className="w-7 h-7 rounded-lg bg-neutral-950 border border-neutral-800/80 text-neutral-400 hover:text-white hover:bg-neutral-800 hover:border-neutral-700 disabled:opacity-25 disabled:pointer-events-none transition flex items-center justify-center shrink-0"
                      >
                        <svg className="w-2.5 h-2.5 fill-current" viewBox="0 0 24 24">
                          <polygon points="8,4 18,12 8,20" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* Minutes Field (0 to 50, step 10) */}
                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-mono text-neutral-400">
                      Минуты
                    </label>
                    <div className="flex items-center gap-1 bg-neutral-900 border border-neutral-800 rounded-xl p-1">
                      {/* Left Triangle (Decrement 10 Minutes) */}
                      <button
                        type="button"
                        onClick={() => handleMinuteChange(-10)}
                        disabled={customMinutes <= 0}
                        aria-label="Уменьшить на 10 минут"
                        title="Уменьшить на 10 минут"
                        className="w-7 h-7 rounded-lg bg-neutral-950 border border-neutral-800/80 text-neutral-400 hover:text-white hover:bg-neutral-800 hover:border-neutral-700 disabled:opacity-25 disabled:pointer-events-none transition flex items-center justify-center shrink-0"
                      >
                        <svg className="w-2.5 h-2.5 fill-current" viewBox="0 0 24 24">
                          <polygon points="16,4 6,12 16,20" />
                        </svg>
                      </button>

                      {/* Minutes Input */}
                      <div className="flex-1 flex items-center justify-center min-w-0">
                        <input
                          type="number"
                          min="0"
                          max="50"
                          step="10"
                          value={customMinutes}
                          onChange={(e) => handleMinuteInput(e.target.value)}
                          className="w-full text-center bg-transparent text-sm font-bold font-mono text-neutral-100 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                        <span className="text-[11px] font-mono text-neutral-400 pr-1 select-none">
                          мин
                        </span>
                      </div>

                      {/* Right Triangle (Increment 10 Minutes) */}
                      <button
                        type="button"
                        onClick={() => handleMinuteChange(10)}
                        disabled={customMinutes >= 50}
                        aria-label="Увеличить на 10 минут"
                        title="Увеличить на 10 минут"
                        className="w-7 h-7 rounded-lg bg-neutral-950 border border-neutral-800/80 text-neutral-400 hover:text-white hover:bg-neutral-800 hover:border-neutral-700 disabled:opacity-25 disabled:pointer-events-none transition flex items-center justify-center shrink-0"
                      >
                        <svg className="w-2.5 h-2.5 fill-current" viewBox="0 0 24 24">
                          <polygon points="8,4 18,12 8,20" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Total Duration Info & Submit Button */}
                <div className="flex items-center justify-between pt-1 gap-2">
                  <div className="text-[11px] font-mono text-neutral-400">
                    Итого:{' '}
                    <span className="text-neutral-200 font-semibold">
                      {totalCustomMinutes > 0 ? formatCustomDuration(totalCustomMinutes) : '0 мин'}
                    </span>
                  </div>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-lg bg-neutral-200 text-neutral-900 font-mono text-xs font-medium hover:bg-white transition"
                  >
                    Задать
                  </button>
                </div>

                {errorMsg && (
                  <p className="text-[10px] text-red-400 font-mono text-center">{errorMsg}</p>
                )}
              </form>
            )}
          </div>

          {/* Option: Disable Timer */}
          <button
            onClick={() => {
              setSleepTimer(null);
              setIsCustomOpen(false);
              onClose();
            }}
            title="Выключить таймер сна"
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-mono border transition ${
              sleepTimerDuration === null
                ? 'bg-neutral-800 border-neutral-600 text-white font-medium'
                : 'bg-neutral-950/60 border-neutral-800/80 text-neutral-400 hover:border-neutral-700 hover:text-white'
            }`}
          >
            <span>Отключить таймер</span>
            {sleepTimerDuration === null && <Check className="w-3.5 h-3.5 text-white" />}
          </button>
        </div>
      </div>
    </div>
  );
};

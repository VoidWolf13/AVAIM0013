import React from 'react';
import { X, Keyboard } from 'lucide-react';

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SHORTCUTS = [
  { key: 'Пробел', desc: 'Воспроизведение / Пауза' },
  { key: '← / →', desc: 'Перемотка на 5 секунд назад / вперед' },
  { key: '↑ / ↓', desc: 'Регулировка громкости (±5%)' },
  { key: 'M', desc: 'Включить / выключить звук' },
  { key: 'N', desc: 'Следующий трек' },
  { key: 'P', desc: 'Предыдущий трек' },
  { key: 'S', desc: 'Случайное воспроизведение (Вкл/Выкл)' },
  { key: 'R', desc: 'Повтор трека (Вкл/Выкл)' },
  { key: 'F', desc: 'Полноэкранный режим визуализатора' },
  { key: 'Esc', desc: 'Закрыть открытое окно' },
];

export const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div
      id="shortcuts-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn"
      onClick={onClose}
    >
      <div
        id="shortcuts-modal-content"
        className="w-full max-w-sm bg-neutral-900 border border-neutral-800 rounded-2xl p-5 shadow-2xl space-y-4 text-neutral-100"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-neutral-800 text-white border border-neutral-700">
              <Keyboard className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold font-mono text-white">Горячие клавиши</h3>
              <p className="text-[11px] text-neutral-400 font-mono">Быстрое управление плеером</p>
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

        <div className="space-y-1.5 max-h-80 overflow-y-auto pr-1">
          {SHORTCUTS.map((s) => (
            <div
              key={s.key}
              className="flex items-center justify-between p-2 rounded-xl bg-neutral-950 border border-neutral-800/80 text-xs"
            >
              <span className="text-neutral-300 font-mono">{s.desc}</span>
              <kbd className="px-2 py-0.5 rounded bg-neutral-800 border border-neutral-700 text-[11px] font-mono text-white font-bold shrink-0 ml-2">
                {s.key}
              </kbd>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

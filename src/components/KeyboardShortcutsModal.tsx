import React from 'react';
import { X, Keyboard } from 'lucide-react';

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SHORTCUTS = [
  { key: 'Space', desc: 'Play / Pause audio playback' },
  { key: '← / →', desc: 'Seek 5 seconds backward / forward' },
  { key: '↑ / ↓', desc: 'Adjust volume up / down (5%)' },
  { key: 'M', desc: 'Mute / Unmute audio' },
  { key: 'N', desc: 'Next track' },
  { key: 'P', desc: 'Previous track' },
  { key: 'S', desc: 'Toggle Shuffle mode' },
  { key: 'R', desc: 'Toggle Repeat mode' },
  { key: 'F', desc: 'Toggle Fullscreen Zen Mode' },
  { key: 'Esc', desc: 'Close open dialogs / modals' },
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
              <h3 className="text-sm font-bold font-mono text-white">Keyboard Hotkeys</h3>
              <p className="text-[11px] text-neutral-400 font-mono">Quick player controls</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition"
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

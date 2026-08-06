import React from 'react';
import { X } from 'lucide-react';

interface ToastProps {
  message: string | null;
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ message, onClose }) => {
  if (!message) return null;

  return (
    <div
      id="toast-notification"
      className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-neutral-900 border border-neutral-700 shadow-2xl text-xs font-mono text-neutral-100 backdrop-blur-md animate-bounceIn"
    >
      <div className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
      <span>{message}</span>
      <button
        onClick={onClose}
        className="ml-1 text-neutral-400 hover:text-white transition"
        title="Закрыть"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};

import React, { useState } from 'react';
import { useAudio } from '../context/AudioContext';
import { ARTIST_NAME, ARTIST_EMAIL } from '../data/tracks';
import {
  Mail,
  Check,
  Keyboard,
  Sliders,
  Maximize2,
  ListMusic,
} from 'lucide-react';

interface HeaderProps {
  onOpenEQ: () => void;
  onOpenZen: () => void;
  onOpenShortcuts: () => void;
  onOpenQueue: () => void;
  onShowToast: (text: string) => void;
}

interface RhombusDot {
  id: string;
  left: string;
  top: string;
  duration: string;
  delay: string;
  maxOpacity: number;
}

// Exactly 13 dots of equal size arranged in a symmetrical rhombus geometry (1 + 3 + 5 + 3 + 1)
// Constant dot size, soft max opacity (0.25 - 0.48), fading completely to 0 at minimum
const RHOMBUS_DOTS_13: RhombusDot[] = [
  // Row 1 (Top Vertex - 1 dot)
  { id: 'd1', left: '50%', top: '6%', duration: '2.8s', delay: '0ms', maxOpacity: 0.45 },

  // Row 2 (3 dots)
  { id: 'd2', left: '28%', top: '28%', duration: '3.6s', delay: '650ms', maxOpacity: 0.32 },
  { id: 'd3', left: '50%', top: '28%', duration: '2.4s', delay: '1400ms', maxOpacity: 0.48 },
  { id: 'd4', left: '72%', top: '28%', duration: '4.1s', delay: '350ms', maxOpacity: 0.35 },

  // Row 3 (Center horizontal axis - 5 dots)
  { id: 'd5', left: '6%', top: '50%', duration: '3.2s', delay: '1700ms', maxOpacity: 0.38 },
  { id: 'd6', left: '28%', top: '50%', duration: '4.0s', delay: '850ms', maxOpacity: 0.30 },
  { id: 'd7', left: '50%', top: '50%', duration: '2.6s', delay: '1150ms', maxOpacity: 0.50 },
  { id: 'd8', left: '72%', top: '50%', duration: '3.5s', delay: '200ms', maxOpacity: 0.34 },
  { id: 'd9', left: '94%', top: '50%', duration: '2.9s', delay: '1550ms', maxOpacity: 0.40 },

  // Row 4 (3 dots)
  { id: 'd10', left: '28%', top: '72%', duration: '4.3s', delay: '980ms', maxOpacity: 0.32 },
  { id: 'd11', left: '50%', top: '72%', duration: '2.7s', delay: '520ms', maxOpacity: 0.46 },
  { id: 'd12', left: '72%', top: '72%', duration: '3.8s', delay: '1350ms', maxOpacity: 0.36 },

  // Row 5 (Bottom Vertex - 1 dot)
  { id: 'd13', left: '50%', top: '94%', duration: '3.1s', delay: '1850ms', maxOpacity: 0.42 },
];

export const Header: React.FC<HeaderProps> = ({
  onOpenEQ,
  onOpenZen,
  onOpenShortcuts,
  onOpenQueue,
  onShowToast,
}) => {
  const { isPlaying, queue } = useAudio();
  const [copiedEmail, setCopiedEmail] = useState(false);

  const handleCopyEmail = (e: React.MouseEvent) => {
    e.preventDefault();
    navigator.clipboard.writeText(ARTIST_EMAIL);
    setCopiedEmail(true);
    onShowToast('Email скопирован в буфер');
    setTimeout(() => setCopiedEmail(false), 2000);
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/10 bg-black/80 backdrop-blur-md transition-all">
      <div className="max-w-xl mx-auto px-4 h-14 flex items-center justify-between gap-2 sm:gap-4">
        {/* Brand & Artist Name */}
        <div className="flex items-center gap-2.5 shrink-0">
          {/* Rhombus of 13 Constant Pulsing Circles */}
          <div
            id="brand-rhombus-indicator"
            className="relative w-5 h-5 shrink-0"
            title="Символ AVAIM0013: 13 пульсирующих элементов"
            aria-label="AVAIM0013 Rhombus Indicator"
          >
            {RHOMBUS_DOTS_13.map((dot) => (
              <span
                key={dot.id}
                className="absolute w-[3px] h-[3px] rounded-full bg-white animate-rhombus-dot pointer-events-none"
                style={{
                  left: dot.left,
                  top: dot.top,
                  animationDuration: dot.duration,
                  animationDelay: dot.delay,
                  ['--max-opacity' as string]: dot.maxOpacity,
                }}
              />
            ))}
          </div>
          <span className="text-sm font-bold font-mono tracking-wider text-white">
            {ARTIST_NAME}
          </span>
        </div>

        {/* Right Navigation Actions */}
        <div className="flex items-center gap-1 shrink-0">
          {/* Email */}
          <button
            onClick={handleCopyEmail}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-white/10 transition"
            title={`Скопировать email (${ARTIST_EMAIL})`}
          >
            {copiedEmail ? <Check className="w-4 h-4 text-emerald-400" /> : <Mail className="w-4 h-4" />}
          </button>

          {/* Equalizer */}
          <button
            onClick={onOpenEQ}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-white/10 transition"
            title="Эквалайзер звука"
          >
            <Sliders className="w-4 h-4" />
          </button>

          {/* Queue */}
          <button
            onClick={onOpenQueue}
            className="relative p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-white/10 transition"
            title="Очередь воспроизведения"
          >
            <ListMusic className="w-4 h-4" />
            {queue.length > 0 && (
              <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-cyan-400" />
            )}
          </button>

          {/* Keyboard Shortcuts */}
          <button
            onClick={onOpenShortcuts}
            className="hidden sm:flex p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-white/10 transition"
            title="Горячие клавиши (Пробел, N, P, S, R, F...)"
          >
            <Keyboard className="w-4 h-4" />
          </button>

          {/* Full Fullscreen Button */}
          <button
            onClick={onOpenZen}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-mono text-neutral-300 hover:text-white bg-black/40 hover:bg-black/60 border border-white/10 transition ml-1"
            title="Полноэкранный визуализатор (F)"
          >
            <Maximize2 className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Full</span>
          </button>
        </div>
      </div>
    </header>
  );
};

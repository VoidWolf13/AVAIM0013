import React, { useState } from 'react';
import { useAudio } from '../context/AudioContext';
import { ARTIST_NAME, ARTIST_EMAIL, GITHUB_REPO_URL } from '../data/tracks';
import {
  Mail,
  Check,
  Github,
  Keyboard,
  Sliders,
  Maximize2,
  ListMusic,
  FolderGit2,
  RefreshCw,
} from 'lucide-react';

interface HeaderProps {
  onOpenEQ: () => void;
  onOpenZen: () => void;
  onOpenShortcuts: () => void;
  onOpenQueue: () => void;
  onOpenGitHubSync?: () => void;
  onShowToast: (text: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenEQ,
  onOpenZen,
  onOpenShortcuts,
  onOpenQueue,
  onOpenGitHubSync,
  onShowToast,
}) => {
  const { isPlaying, queue, isSyncingGitHub } = useAudio();
  const [copiedEmail, setCopiedEmail] = useState(false);

  const handleCopyEmail = (e: React.MouseEvent) => {
    e.preventDefault();
    navigator.clipboard.writeText(ARTIST_EMAIL);
    setCopiedEmail(true);
    onShowToast('Email copied to clipboard');
    setTimeout(() => setCopiedEmail(false), 2000);
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-neutral-850 bg-[#09090b]/90 backdrop-blur-md transition-all">
      <div className="max-w-xl mx-auto px-4 h-14 flex items-center justify-between gap-3">
        {/* Brand & Artist Name */}
        <div className="flex items-center gap-2.5">
          {/* Minimalist Live Audio Indicator (Silver / Zinc) */}
          <div className="flex items-end gap-0.5 h-3.5 w-3.5">
            <span
              className={`w-0.5 bg-neutral-300 rounded-full transition-all duration-300 ${
                isPlaying ? 'h-3.5 animate-pulse' : 'h-1 opacity-30'
              }`}
            />
            <span
              className={`w-0.5 bg-neutral-300 rounded-full transition-all duration-300 ${
                isPlaying ? 'h-2.5 animate-pulse delay-75' : 'h-2 opacity-30'
              }`}
            />
            <span
              className={`w-0.5 bg-neutral-300 rounded-full transition-all duration-300 ${
                isPlaying ? 'h-3 animate-pulse delay-150' : 'h-1 opacity-30'
              }`}
            />
          </div>
          <span className="text-sm font-bold font-mono tracking-wider text-neutral-200">
            {ARTIST_NAME}
          </span>
        </div>

        {/* Right Navigation Actions */}
        <div className="flex items-center gap-1">
          {/* GitHub Sync Button */}
          {onOpenGitHubSync && (
            <button
              onClick={onOpenGitHubSync}
              className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900 transition"
              title="GitHub Music/ Sync"
            >
              {isSyncingGitHub ? (
                <RefreshCw className="w-4 h-4 animate-spin text-neutral-200" />
              ) : (
                <FolderGit2 className="w-4 h-4" />
              )}
            </button>
          )}

          {/* Email */}
          <button
            onClick={handleCopyEmail}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900 transition"
            title={`Copy ${ARTIST_EMAIL}`}
          >
            {copiedEmail ? <Check className="w-4 h-4 text-neutral-200" /> : <Mail className="w-4 h-4" />}
          </button>

          {/* Equalizer */}
          <button
            onClick={onOpenEQ}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900 transition"
            title="Audio Equalizer"
          >
            <Sliders className="w-4 h-4" />
          </button>

          {/* Queue */}
          <button
            onClick={onOpenQueue}
            className="relative p-1.5 rounded-lg text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900 transition"
            title="Queue"
          >
            <ListMusic className="w-4 h-4" />
            {queue.length > 0 && (
              <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-neutral-300" />
            )}
          </button>

          {/* Keyboard Shortcuts */}
          <button
            onClick={onOpenShortcuts}
            className="hidden sm:flex p-1.5 rounded-lg text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900 transition"
            title="Hotkeys (Space, N, P, F...)"
          >
            <Keyboard className="w-4 h-4" />
          </button>

          {/* GitHub Repo */}
          <a
            href={GITHUB_REPO_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900 transition"
            title="GitHub Repository"
          >
            <Github className="w-4 h-4" />
          </a>

          {/* Zen Fullscreen Button */}
          <button
            onClick={onOpenZen}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-mono text-neutral-400 hover:text-neutral-200 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 transition ml-1"
            title="Fullscreen Visualizer (F)"
          >
            <Maximize2 className="w-3 h-3" />
            <span>Zen</span>
          </button>
        </div>
      </div>
    </header>
  );
};

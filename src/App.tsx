import React, { useState, useEffect } from 'react';
import { AudioProvider, useAudio } from './context/AudioContext';
import { Header } from './components/Header';
import { PlayerControls } from './components/PlayerControls';
import { TrackList } from './components/TrackList';
import { AudioEqualizerModal } from './components/AudioEqualizerModal';
import { SleepTimerModal } from './components/SleepTimerModal';
import { ZenVisualizerModal } from './components/ZenVisualizerModal';
import { KeyboardShortcutsModal } from './components/KeyboardShortcutsModal';
import { Toast } from './components/Toast';

function MainApp() {
  const {
    currentTrack,
    togglePlayPause,
    playNext,
    playPrevious,
    seekRelative,
    volume,
    setVolume,
    toggleMute,
    setPlaybackMode,
    playbackMode,
  } = useAudio();

  // Modals state
  const [isEQOpen, setIsEQOpen] = useState(false);
  const [isSleepOpen, setIsSleepOpen] = useState(false);
  const [isZenOpen, setIsZenOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((current) => (current === msg ? null : current));
    }, 2800);
  };

  // Keyboard shortcuts listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.isContentEditable
      ) {
        return;
      }

      switch (e.key) {
        case ' ':
          e.preventDefault();
          togglePlayPause();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          seekRelative(-5);
          break;
        case 'ArrowRight':
          e.preventDefault();
          seekRelative(5);
          break;
        case 'ArrowUp':
          e.preventDefault();
          setVolume(Math.min(1, volume + 0.05));
          break;
        case 'ArrowDown':
          e.preventDefault();
          setVolume(Math.max(0, volume - 0.05));
          break;
        case 'm':
        case 'M':
          e.preventDefault();
          toggleMute();
          break;
        case 'n':
        case 'N':
          e.preventDefault();
          playNext();
          break;
        case 'p':
        case 'P':
          e.preventDefault();
          playPrevious();
          break;
        case 's':
        case 'S':
          e.preventDefault();
          setPlaybackMode(playbackMode === 'random' ? 'sequential' : 'random');
          showToast(playbackMode === 'random' ? 'Случайное воспроизведение: Выкл' : 'Случайное воспроизведение: Вкл');
          break;
        case 'r':
        case 'R':
          e.preventDefault();
          setPlaybackMode(playbackMode === 'loop' ? 'sequential' : 'loop');
          showToast(playbackMode === 'loop' ? 'Повтор трека: Выкл' : 'Повтор трека: Вкл');
          break;
        case 'f':
        case 'F':
          e.preventDefault();
          setIsZenOpen((prev) => !prev);
          break;
        case 'Escape':
          setIsEQOpen(false);
          setIsSleepOpen(false);
          setIsZenOpen(false);
          setIsShortcutsOpen(false);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [togglePlayPause, seekRelative, volume, setVolume, toggleMute, playNext, playPrevious, playbackMode, setPlaybackMode]);

  return (
    <div className="min-h-screen bg-[#09090b]/80/80/80 text-neutral-100 flex flex-col selection:bg-neutral-800 selection:text-white transition-colors duration-300">
      {/* Minimalist Top Header */}
      <Header
        onOpenZen={() => setIsZenOpen(true)}
        onOpenShortcuts={() => setIsShortcutsOpen(true)}
        onShowToast={showToast}
      />

      {/* Main Content: Player Controls + Track List */}
      <main className="flex-1 w-full max-w-xl mx-auto px-4 py-6 space-y-4">
        <PlayerControls
          onOpenEQ={() => setIsEQOpen(true)}
          onOpenSleep={() => setIsSleepOpen(true)}
          onOpenZen={() => setIsZenOpen(true)}
          onShowToast={showToast}
        />
        <TrackList
          onShowToast={showToast}
        />
      </main>

      {/* Modals and Drawers */}
      <AudioEqualizerModal isOpen={isEQOpen} onClose={() => setIsEQOpen(false)} />
      <SleepTimerModal isOpen={isSleepOpen} onClose={() => setIsSleepOpen(false)} />
      <ZenVisualizerModal
        isOpen={isZenOpen}
        onClose={() => setIsZenOpen(false)}
        onShare={() => {
          showToast(`Скопирована ссылка на трек "${currentTrack.title}"`);
        }}
      />
      <KeyboardShortcutsModal isOpen={isShortcutsOpen} onClose={() => setIsShortcutsOpen(false)} />
      <Toast message={toastMessage} onClose={() => setToastMessage(null)} />
    </div>
  );
}

export default function App() {
  return (
    <AudioProvider>
      <MainApp />
    </AudioProvider>
  );
}


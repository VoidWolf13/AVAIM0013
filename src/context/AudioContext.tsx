import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { Track, PlaybackMode, VisualizerMode, EQSettings, EQPreset, GitHubSyncConfig } from '../types';
import { TRACKS, getTrackAudioUrl } from '../data/tracks';
import {
  fetchTracksFromGitHub,
  getStoredGitHubConfig,
  saveGitHubConfig,
  getCachedGitHubTracks,
  cacheGitHubTracks,
  DEFAULT_GITHUB_CONFIG,
} from '../utils/githubScanner';
import { analyzeAudioUrl, AudioAnalysisResult } from '../utils/audioGenreClassifier';

interface AudioContextType {
  tracks: Track[];
  currentTrack: Track;
  currentTrackIndex: number;
  isPlaying: boolean;
  isLoading: boolean;
  currentTime: number;
  duration: number;
  buffered: number;
  volume: number;
  isMuted: boolean;
  playbackMode: PlaybackMode;
  playbackRate: number;
  visualizerMode: VisualizerMode;
  eqSettings: EQSettings;
  sleepTimerRemaining: number | null;
  sleepTimerDuration: number | null;
  favorites: number[];
  queue: Track[];
  analyserNode: AnalyserNode | null;
  audioElement: HTMLAudioElement | null;
  isSyncingGitHub: boolean;
  githubSyncError: string | null;
  githubConfig: GitHubSyncConfig;
  lastSyncTime: Date | null;
  isAnalyzingTracks: boolean;
  
  // Actions
  playTrack: (trackOrIndex: Track | number) => void;
  togglePlayPause: () => void;
  playNext: () => void;
  playPrevious: () => void;
  seek: (seconds: number) => void;
  seekRelative: (offsetSeconds: number) => void;
  setVolume: (vol: number) => void;
  toggleMute: () => void;
  setPlaybackMode: (mode: PlaybackMode) => void;
  setPlaybackRate: (rate: number) => void;
  setVisualizerMode: (mode: VisualizerMode) => void;
  setEQPreset: (preset: EQPreset) => void;
  setCustomEQ: (band: 'bass' | 'mid' | 'treble', value: number) => void;
  setSleepTimer: (minutes: number | null) => void;
  toggleFavorite: (trackId: number) => void;
  isFavorite: (trackId: number) => boolean;
  addToQueue: (track: Track) => void;
  removeFromQueue: (index: number) => void;
  clearQueue: () => void;
  syncWithGitHub: (customConfig?: GitHubSyncConfig) => Promise<{ success: boolean; count?: number; error?: string }>;
  updateGitHubConfig: (config: GitHubSyncConfig) => void;
  resetToDefaultTracks: () => void;
  analyzeTrackGenre: (trackId: number) => Promise<AudioAnalysisResult | undefined>;
  analyzeAllTracks: () => Promise<void>;
}

const AudioContext = createContext<AudioContextType | undefined>(undefined);

const EQ_PRESETS: Record<EQPreset, { bass: number; mid: number; treble: number }> = {
  'flat': { bass: 0, mid: 0, treble: 0 },
  'bass-boost': { bass: 7, mid: 1, treble: -1 },
  'ambient-spatial': { bass: 3, mid: -2, treble: 5 },
  'cyber-treble': { bass: -1, mid: 2, treble: 6 },
  'lofi-warmth': { bass: 5, mid: -1, treble: -4 },
  'vocal-clarity': { bass: -2, mid: 5, treble: 3 },
};

export const EMPTY_TRACK: Track = {
  id: 0,
  title: 'Аудио не загружено',
  filename: '',
  format: 'mp3',
  category: 'ambient',
  moodTag: 'Ожидание музыки',
  durationEst: '0:00',
  description: 'Загрузите аудиофайлы в папку music/ вашего репозитория GitHub (VoidWolf13/AVAIM0013) и нажмите «Синхронизация».',
  bitrate: '—',
  sampleRate: '—',
  bpm: 0,
};

export const AudioProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tracks, setTracks] = useState<Track[]>(() => {
    const cached = getCachedGitHubTracks();
    return (cached && cached.length > 0) ? cached : TRACKS;
  });

  const [githubConfig, setGithubConfig] = useState<GitHubSyncConfig>(() => getStoredGitHubConfig());
  const [isSyncingGitHub, setIsSyncingGitHub] = useState<boolean>(false);
  const [githubSyncError, setGithubSyncError] = useState<string | null>(null);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [isAnalyzingTracks, setIsAnalyzingTracks] = useState<boolean>(false);

  const [currentTrackIndex, setCurrentTrackIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [buffered, setBuffered] = useState<number>(0);
  const [volume, setVolumeState] = useState<number>(() => {
    const saved = localStorage.getItem('anton_void_volume');
    return saved !== null ? parseFloat(saved) : 0.85;
  });
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [playbackMode, setPlaybackModeState] = useState<PlaybackMode>(() => {
    const saved = localStorage.getItem('anton_void_mode');
    return (saved as PlaybackMode) || 'sequential';
  });
  const [playbackRate, setPlaybackRateState] = useState<number>(1.0);
  const [visualizerMode, setVisualizerMode] = useState<VisualizerMode>('particles');
  
  const [eqSettings, setEqSettings] = useState<EQSettings>({
    bass: 0,
    mid: 0,
    treble: 0,
    preset: 'flat',
  });

  const [sleepTimerRemaining, setSleepTimerRemaining] = useState<number | null>(null);
  const [sleepTimerDuration, setSleepTimerDuration] = useState<number | null>(null);
  
  const [favorites, setFavorites] = useState<number[]>(() => {
    try {
      const saved = localStorage.getItem('anton_void_favorites');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [queue, setQueue] = useState<Track[]>([]);

  // Refs for Web Audio API & Audio Element
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const bassFilterRef = useRef<BiquadFilterNode | null>(null);
  const midFilterRef = useRef<BiquadFilterNode | null>(null);
  const trebleFilterRef = useRef<BiquadFilterNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const isWebAudioInitialized = useRef<boolean>(false);

  const currentTrack = tracks[currentTrackIndex] || tracks[0] || EMPTY_TRACK;

  // Sync with GitHub function
  const syncWithGitHub = useCallback(async (customConfig?: GitHubSyncConfig) => {
    const activeConfig = customConfig || githubConfig;
    setIsSyncingGitHub(true);
    setGithubSyncError(null);

    try {
      const result = await fetchTracksFromGitHub(activeConfig);
      if (result.tracks && result.tracks.length > 0) {
        setTracks(result.tracks);
        setLastSyncTime(new Date());
        setIsSyncingGitHub(false);
        return { success: true, count: result.tracks.length };
      } else {
        throw new Error('Треки не найдены в указанной папке.');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Не удалось загрузить треки из GitHub';
      setGithubSyncError(msg);
      setIsSyncingGitHub(false);
      return { success: false, error: msg };
    }
  }, [githubConfig]);

  const updateGitHubConfig = useCallback((newConfig: GitHubSyncConfig) => {
    setGithubConfig(newConfig);
    saveGitHubConfig(newConfig);
  }, []);

  const resetToDefaultTracks = useCallback(() => {
    setTracks(TRACKS);
    try {
      localStorage.removeItem('avaim_github_cached_tracks');
    } catch {
      // ignore
    }
  }, []);

  // Auto-sync on mount if enabled
  useEffect(() => {
    if (githubConfig.autoSync) {
      syncWithGitHub(githubConfig);
    }
  }, []); // Run once on initial load

  // Initialize Web Audio graph lazily on first user interaction
  const initWebAudio = useCallback(() => {
    if (isWebAudioInitialized.current || !audioRef.current) return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;

      const ctx = new AudioCtx();
      audioContextRef.current = ctx;

      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.82;
      analyserRef.current = analyser;

      // Equalizer Biquad Filters
      const bass = ctx.createBiquadFilter();
      bass.type = 'lowshelf';
      bass.frequency.value = 180;
      bassFilterRef.current = bass;

      const mid = ctx.createBiquadFilter();
      mid.type = 'peaking';
      mid.frequency.value = 1000;
      mid.Q.value = 1.0;
      midFilterRef.current = mid;

      const treble = ctx.createBiquadFilter();
      treble.type = 'highshelf';
      treble.frequency.value = 4500;
      trebleFilterRef.current = treble;

      const gain = ctx.createGain();
      gain.gain.value = isMuted ? 0 : volume;
      gainNodeRef.current = gain;

      // Connect source -> bass -> mid -> treble -> gain -> analyser -> destination
      const source = ctx.createMediaElementSource(audioRef.current);
      sourceNodeRef.current = source;

      source.connect(bass);
      bass.connect(mid);
      mid.connect(treble);
      treble.connect(gain);
      gain.connect(analyser);
      analyser.connect(ctx.destination);

      isWebAudioInitialized.current = true;
    } catch (err) {
      console.warn('Web Audio initialization error:', err);
    }
  }, [isMuted, volume]);

  // Load and play specific track
  const playTrack = useCallback(async (trackOrIndex: Track | number) => {
    const audio = audioRef.current;
    if (!audio || tracks.length === 0) return;

    let targetIndex = 0;
    if (typeof trackOrIndex === 'number') {
      targetIndex = Math.max(0, Math.min(tracks.length - 1, trackOrIndex));
    } else {
      const idx = tracks.findIndex(t => t.id === trackOrIndex.id || t.filename === trackOrIndex.filename);
      targetIndex = idx !== -1 ? idx : 0;
    }

    const targetTrack = tracks[targetIndex] || EMPTY_TRACK;
    if (!targetTrack.filename && !targetTrack.audioUrl) {
      return;
    }
    setCurrentTrackIndex(targetIndex);
    setIsLoading(true);

    initWebAudio();
    if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
      await audioContextRef.current.resume();
    }

    const audioUrl = getTrackAudioUrl(targetTrack);
    audio.src = audioUrl;
    audio.playbackRate = playbackRate;
    audio.currentTime = 0;

    try {
      await audio.play();
      setIsPlaying(true);

      // Auto-analyze audio signal in background if not yet analyzed
      if (!targetTrack.isAnalyzed && audioUrl) {
        analyzeAudioUrl(audioUrl).then(result => {
          setTracks(prev => {
            const updated = prev.map(t => {
              if (t.id === targetTrack.id) {
                return {
                  ...t,
                  category: result.genre,
                  moodTag: result.moodTag,
                  description: result.description,
                  bpm: result.detectedBpm,
                  isAnalyzed: true,
                };
              }
              return t;
            });
            cacheGitHubTracks(updated);
            return updated;
          });
        }).catch(err => console.warn('Background audio analysis notice:', err));
      }
    } catch (err) {
      console.warn('Error starting playback for track:', targetTrack.title, err);
      setIsPlaying(false);
    } finally {
      setIsLoading(false);
    }
  }, [initWebAudio, playbackRate, tracks]);

  // Handle Play/Pause
  const togglePlayPause = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (tracks.length === 0 || (!currentTrack.filename && !currentTrack.audioUrl)) {
      return;
    }

    initWebAudio();

    if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
      await audioContextRef.current.resume();
    }

    if (!audio.src || audio.src === window.location.href) {
      playTrack(currentTrackIndex);
      return;
    }

    if (audio.paused) {
      try {
        await audio.play();
        setIsPlaying(true);
      } catch (err) {
        console.warn('Playback play failed:', err);
      }
    } else {
      audio.pause();
      setIsPlaying(false);
    }
  }, [initWebAudio, tracks.length, currentTrack, currentTrackIndex, playTrack]);

  // Play Next
  const playNext = useCallback(() => {
    // Check if there is an item in the queue first
    if (queue.length > 0) {
      const nextFromQueue = queue[0];
      setQueue(prev => prev.slice(1));
      playTrack(nextFromQueue);
      return;
    }

    if (tracks.length === 0) return;

    if (playbackMode === 'random') {
      let randomIndex = Math.floor(Math.random() * tracks.length);
      if (tracks.length > 1 && randomIndex === currentTrackIndex) {
        randomIndex = (randomIndex + 1) % tracks.length;
      }
      playTrack(randomIndex);
    } else {
      const nextIndex = (currentTrackIndex + 1) % tracks.length;
      playTrack(nextIndex);
    }
  }, [currentTrackIndex, playbackMode, playTrack, queue, tracks]);

  // Play Previous
  const playPrevious = useCallback(() => {
    const audio = audioRef.current;
    if (audio && audio.currentTime > 3) {
      audio.currentTime = 0;
      return;
    }

    if (tracks.length === 0) return;

    if (playbackMode === 'random') {
      const randomIndex = Math.floor(Math.random() * tracks.length);
      playTrack(randomIndex);
    } else {
      const prevIndex = (currentTrackIndex - 1 + tracks.length) % tracks.length;
      playTrack(prevIndex);
    }
  }, [currentTrackIndex, playbackMode, playTrack, tracks]);

  // Seek
  const seek = useCallback((seconds: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = Math.max(0, Math.min(duration || 0, seconds));
    setCurrentTime(audio.currentTime);
  }, [duration]);

  const seekRelative = useCallback((offsetSeconds: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    const target = Math.max(0, Math.min(duration || 0, audio.currentTime + offsetSeconds));
    audio.currentTime = target;
    setCurrentTime(target);
  }, [duration]);

  // Volume
  const setVolume = useCallback((vol: number) => {
    const clamped = Math.max(0, Math.min(1, vol));
    setVolumeState(clamped);
    localStorage.setItem('anton_void_volume', clamped.toString());

    if (audioRef.current) {
      audioRef.current.volume = clamped;
    }

    if (gainNodeRef.current && audioContextRef.current) {
      gainNodeRef.current.gain.setTargetAtTime(
        isMuted ? 0 : clamped,
        audioContextRef.current.currentTime,
        0.05
      );
    }

    if (clamped > 0 && isMuted) {
      setIsMuted(false);
    }
  }, [isMuted]);

  const toggleMute = useCallback(() => {
    setIsMuted(prev => {
      const next = !prev;
      if (audioRef.current) {
        audioRef.current.muted = next;
      }
      if (gainNodeRef.current && audioContextRef.current) {
        gainNodeRef.current.gain.setTargetAtTime(
          next ? 0 : volume,
          audioContextRef.current.currentTime,
          0.05
        );
      }
      return next;
    });
  }, [volume]);

  // Playback Mode
  const setPlaybackMode = useCallback((mode: PlaybackMode) => {
    setPlaybackModeState(mode);
    localStorage.setItem('anton_void_mode', mode);
  }, []);

  // Playback Rate
  const setPlaybackRate = useCallback((rate: number) => {
    setPlaybackRateState(rate);
    if (audioRef.current) {
      audioRef.current.playbackRate = rate;
    }
  }, []);

  // Equalizer
  const applyEQ = useCallback((settings: EQSettings) => {
    setEqSettings(settings);
    if (!audioContextRef.current) return;
    const now = audioContextRef.current.currentTime;

    if (bassFilterRef.current) {
      bassFilterRef.current.gain.setTargetAtTime(settings.bass, now, 0.05);
    }
    if (midFilterRef.current) {
      midFilterRef.current.gain.setTargetAtTime(settings.mid, now, 0.05);
    }
    if (trebleFilterRef.current) {
      trebleFilterRef.current.gain.setTargetAtTime(settings.treble, now, 0.05);
    }
  }, []);

  const setEQPreset = useCallback((preset: EQPreset) => {
    const presetValues = EQ_PRESETS[preset];
    applyEQ({
      ...presetValues,
      preset,
    });
  }, [applyEQ]);

  const setCustomEQ = useCallback((band: 'bass' | 'mid' | 'treble', value: number) => {
    setEqSettings(prev => {
      const updated = {
        ...prev,
        [band]: value,
        preset: 'flat' as EQPreset,
      };
      applyEQ(updated);
      return updated;
    });
  }, [applyEQ]);

  // Sleep Timer
  const setSleepTimer = useCallback((minutes: number | null) => {
    if (minutes === null || minutes <= 0) {
      setSleepTimerRemaining(null);
      setSleepTimerDuration(null);
    } else {
      setSleepTimerDuration(minutes);
      setSleepTimerRemaining(minutes * 60);
    }
  }, []);

  // Countdown for Sleep Timer
  useEffect(() => {
    if (sleepTimerRemaining === null) return;
    if (sleepTimerRemaining <= 0) {
      if (audioRef.current) {
        audioRef.current.pause();
        setIsPlaying(false);
      }
      setSleepTimerRemaining(null);
      setSleepTimerDuration(null);
      return;
    }

    const interval = setInterval(() => {
      setSleepTimerRemaining(prev => (prev !== null && prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(interval);
  }, [sleepTimerRemaining]);

  // Favorites
  const toggleFavorite = useCallback((trackId: number) => {
    setFavorites(prev => {
      const next = prev.includes(trackId)
        ? prev.filter(id => id !== trackId)
        : [...prev, trackId];
      localStorage.setItem('anton_void_favorites', JSON.stringify(next));
      return next;
    });
  }, []);

  const isFavorite = useCallback((trackId: number) => {
    return favorites.includes(trackId);
  }, [favorites]);

  // Queue
  const addToQueue = useCallback((track: Track) => {
    setQueue(prev => [...prev, track]);
  }, []);

  const removeFromQueue = useCallback((index: number) => {
    setQueue(prev => prev.filter((_, i) => i !== index));
  }, []);

  const clearQueue = useCallback(() => {
    setQueue([]);
  }, []);

  // Automatic Audio Signal Genre Analysis for a single track
  const analyzeTrackGenre = useCallback(async (trackId: number) => {
    const target = tracks.find(t => t.id === trackId);
    if (!target) return;
    const audioUrl = getTrackAudioUrl(target);
    if (!audioUrl) return;

    try {
      const result = await analyzeAudioUrl(audioUrl);
      setTracks(prev => {
        const updated = prev.map(t => {
          if (t.id === trackId) {
            return {
              ...t,
              category: result.genre,
              moodTag: result.moodTag,
              description: result.description,
              bpm: result.detectedBpm,
              isAnalyzed: true,
            };
          }
          return t;
        });
        cacheGitHubTracks(updated);
        return updated;
      });
      return result;
    } catch (err) {
      console.warn('Audio genre analysis failed:', err);
    }
  }, [tracks]);

  // Batch analysis for all tracks in playlist
  const analyzeAllTracks = useCallback(async () => {
    if (tracks.length === 0 || isAnalyzingTracks) return;
    setIsAnalyzingTracks(true);

    try {
      for (const track of tracks) {
        const audioUrl = getTrackAudioUrl(track);
        if (audioUrl) {
          try {
            const result = await analyzeAudioUrl(audioUrl);
            setTracks(prev => {
              const updated = prev.map(t => {
                if (t.id === track.id) {
                  return {
                    ...t,
                    category: result.genre,
                    moodTag: result.moodTag,
                    description: result.description,
                    bpm: result.detectedBpm,
                    isAnalyzed: true,
                  };
                }
                return t;
              });
              cacheGitHubTracks(updated);
              return updated;
            });
          } catch (e) {
            console.warn('Batch track analysis error:', track.title, e);
          }
        }
      }
    } finally {
      setIsAnalyzingTracks(false);
    }
  }, [tracks, isAnalyzingTracks]);

  // Audio Event Listeners Setup
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.crossOrigin = 'anonymous';
    audio.volume = volume;

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
      if (audio.buffered.length > 0) {
        const bufferedEnd = audio.buffered.end(audio.buffered.length - 1);
        setBuffered(bufferedEnd);
      }
    };

    const handleDurationChange = () => {
      if (audio.duration && !isNaN(audio.duration)) {
        setDuration(audio.duration);
      }
    };

    const handleEnded = () => {
      if (playbackMode === 'loop') {
        audio.currentTime = 0;
        audio.play().catch(console.warn);
      } else {
        playNext();
      }
    };

    const handleWaiting = () => setIsLoading(true);
    const handleCanPlay = () => setIsLoading(false);
    const handlePlaying = () => {
      setIsPlaying(true);
      setIsLoading(false);
    };
    const handlePause = () => setIsPlaying(false);

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('durationchange', handleDurationChange);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('waiting', handleWaiting);
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('playing', handlePlaying);
    audio.addEventListener('pause', handlePause);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('durationchange', handleDurationChange);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('waiting', handleWaiting);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('playing', handlePlaying);
      audio.removeEventListener('pause', handlePause);
    };
  }, [playbackMode, playNext, volume]);

  // Keyboard Shortcuts (Space, Arrow keys, M, S, R)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }

      switch (e.code) {
        case 'Space':
          e.preventDefault();
          togglePlayPause();
          break;
        case 'ArrowRight':
          e.preventDefault();
          seekRelative(5);
          break;
        case 'ArrowLeft':
          e.preventDefault();
          seekRelative(-5);
          break;
        case 'ArrowUp':
          e.preventDefault();
          setVolume(Math.min(1, volume + 0.05));
          break;
        case 'ArrowDown':
          e.preventDefault();
          setVolume(Math.max(0, volume - 0.05));
          break;
        case 'KeyM':
          e.preventDefault();
          toggleMute();
          break;
        case 'KeyN':
          e.preventDefault();
          playNext();
          break;
        case 'KeyP':
          e.preventDefault();
          playPrevious();
          break;
        case 'KeyS':
          e.preventDefault();
          setPlaybackMode(playbackMode === 'random' ? 'sequential' : 'random');
          break;
        case 'KeyR':
          e.preventDefault();
          setPlaybackMode(playbackMode === 'loop' ? 'sequential' : 'loop');
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [togglePlayPause, seekRelative, setVolume, volume, toggleMute, playNext, playPrevious, playbackMode, setPlaybackMode]);

  return (
    <AudioContext.Provider
      value={{
        tracks,
        currentTrack,
        currentTrackIndex,
        isPlaying,
        isLoading,
        currentTime,
        duration,
        buffered,
        volume,
        isMuted,
        playbackMode,
        playbackRate,
        visualizerMode,
        eqSettings,
        sleepTimerRemaining,
        sleepTimerDuration,
        favorites,
        queue,
        analyserNode: analyserRef.current,
        audioElement: audioRef.current,
        isSyncingGitHub,
        githubSyncError,
        githubConfig,
        lastSyncTime,
        isAnalyzingTracks,
        playTrack,
        togglePlayPause,
        playNext,
        playPrevious,
        seek,
        seekRelative,
        setVolume,
        toggleMute,
        setPlaybackMode,
        setPlaybackRate,
        setVisualizerMode,
        setEQPreset,
        setCustomEQ,
        setSleepTimer,
        toggleFavorite,
        isFavorite,
        addToQueue,
        removeFromQueue,
        clearQueue,
        syncWithGitHub,
        updateGitHubConfig,
        resetToDefaultTracks,
        analyzeTrackGenre,
        analyzeAllTracks,
      }}
    >
      {/* Hidden core audio element */}
      <audio
        ref={audioRef}
        id="anton-void-audio-player"
        crossOrigin="anonymous"
        preload="metadata"
      />
      {children}
    </AudioContext.Provider>
  );
};

export const useAudio = (): AudioContextType => {
  const context = useContext(AudioContext);
  if (!context) {
    throw new Error('useAudio must be used within an AudioProvider');
  }
  return context;
};

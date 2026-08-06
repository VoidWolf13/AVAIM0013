import { Track } from '../types';

export interface AudioAnalysisResult {
  detectedBpm: number;
  genre: Track['category'];
  moodTag: string;
  description: string;
  confidence: number; // 0 to 1
  features: {
    bassEnergy: number; // 0 to 1
    rhythmicPresence: number; // 0 to 1
    spectralBrightness: number; // 0 to 1
    dynamicVariance: number; // 0 to 1
  };
}

/**
 * Stage 1: Smart semantic heuristic analysis based on filenames, subpaths and keywords
 */
export function classifyByFilename(filename: string): {
  genre: Track['category'];
  moodTag: string;
  description: string;
  estimatedBpm: number;
} {
  const clean = filename.toLowerCase();

  // Extract explicit BPM from filename if present (e.g., "track_128bpm.wav", "140 bpm - loop.mp3")
  const bpmMatch = clean.match(/(\d{2,3})\s*(?:bpm|tempo)/i) || clean.match(/_(\d{2,3})_/);
  let estimatedBpm = bpmMatch ? parseInt(bpmMatch[1], 10) : 0;

  // Keyword rules
  if (
    clean.includes('techno') ||
    clean.includes('industrial') ||
    clean.includes('beat') ||
    clean.includes('club') ||
    clean.includes('rave') ||
    clean.includes('dance') ||
    clean.includes('edm') ||
    clean.includes('hardstyle') ||
    (estimatedBpm >= 125 && estimatedBpm <= 155)
  ) {
    return {
      genre: 'edm',
      moodTag: 'Industrial Beat / Techno',
      description: 'High-energy rhythmic electronic groove with driving pulses, crisp transients and punchy basslines.',
      estimatedBpm: estimatedBpm || 128,
    };
  }

  if (
    clean.includes('dark') ||
    clean.includes('void') ||
    clean.includes('shadow') ||
    clean.includes('horror') ||
    clean.includes('abyss') ||
    clean.includes('cyber') ||
    clean.includes('drone') ||
    clean.includes('dystopia')
  ) {
    return {
      genre: 'dark',
      moodTag: 'Void Atmospheric / Dark Wave',
      description: 'Submerged sub-bass frequencies and eerie reverberations exploring solitary, dystopian depths.',
      estimatedBpm: estimatedBpm || 90,
    };
  }

  if (
    clean.includes('chill') ||
    clean.includes('lofi') ||
    clean.includes('lo-fi') ||
    clean.includes('downtempo') ||
    clean.includes('relax') ||
    clean.includes('lounge') ||
    clean.includes('slow') ||
    clean.includes('trip') ||
    (estimatedBpm >= 65 && estimatedBpm <= 100)
  ) {
    return {
      genre: 'downtempo',
      moodTag: 'Deep Downtempo / Chill',
      description: 'Gentle melancholic rhythms and warm pads designed for unwinding, focus, and contemplation.',
      estimatedBpm: estimatedBpm || 85,
    };
  }

  if (
    clean.includes('glitch') ||
    clean.includes('noise') ||
    clean.includes('idm') ||
    clean.includes('modular') ||
    clean.includes('experimental') ||
    clean.includes('distort') ||
    clean.includes('fractal')
  ) {
    return {
      genre: 'experimental',
      moodTag: 'Experimental / Modular Glitch',
      description: 'Unconventional sound synthesis, modular frequency modulations, and textural sound design.',
      estimatedBpm: estimatedBpm || 110,
    };
  }

  if (
    clean.includes('cinematic') ||
    clean.includes('space') ||
    clean.includes('epic') ||
    clean.includes('orchestr') ||
    clean.includes('soundtrack') ||
    clean.includes('universe') ||
    clean.includes('stellar') ||
    clean.includes('dawn')
  ) {
    return {
      genre: 'cinematic',
      moodTag: 'Cinematic Soundscape',
      description: 'Expansive cinematic orchestration and panoramic synth sweeps creating grand auditory landscapes.',
      estimatedBpm: estimatedBpm || 75,
    };
  }

  // Default Ambient
  return {
    genre: 'ambient',
    moodTag: 'Atmospheric Ambient',
    description: 'Atmospheric sonic landscape with deep textures, organic drones, and introspective synth layers.',
    estimatedBpm: estimatedBpm || 70,
  };
}

/**
 * Stage 2: Web Audio Signal Processing (Client-Side Spectral & Beat Analysis)
 * Analyzes raw audio waveform data to determine BPM, bass energy, spectral brightness and genre.
 */
export async function analyzeAudioUrl(audioUrl: string): Promise<AudioAnalysisResult> {
  try {
    // Fetch first ~1.5MB of audio (sufficient for 20-30s sample analysis)
    const response = await fetch(audioUrl, {
      headers: {
        'Range': 'bytes=0-1500000',
      },
    });

    const arrayBuffer = await response.arrayBuffer();

    // Create an offline audio context to decode and analyze
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) {
      throw new Error('Web Audio API is not supported in this browser');
    }

    const tempCtx = new AudioContextClass();
    let audioBuffer: AudioBuffer;

    try {
      audioBuffer = await tempCtx.decodeAudioData(arrayBuffer.slice(0));
    } finally {
      if (tempCtx.state !== 'closed') {
        tempCtx.close().catch(() => {});
      }
    }

    const channelData = audioBuffer.getChannelData(0);
    const sampleRate = audioBuffer.sampleRate;
    const length = channelData.length;

    // 1. RMS Energy & Dynamic Variance Calculation
    let sumSquares = 0;
    let peak = 0;
    const windowSize = Math.floor(sampleRate * 0.05); // 50ms window
    const energies: number[] = [];

    for (let i = 0; i < length; i += windowSize) {
      let windowSum = 0;
      const end = Math.min(i + windowSize, length);
      for (let j = i; j < end; j++) {
        const val = channelData[j];
        const absVal = Math.abs(val);
        if (absVal > peak) peak = absVal;
        windowSum += val * val;
      }
      const windowRms = Math.sqrt(windowSum / (end - i));
      energies.push(windowRms);
      sumSquares += windowSum;
    }

    const totalRms = Math.sqrt(sumSquares / length);

    // Dynamic Variance (Ambient has low variance, EDM/Techno has sharp rhythmic spikes)
    let varianceSum = 0;
    for (const e of energies) {
      varianceSum += Math.pow(e - totalRms, 2);
    }
    const dynamicVariance = Math.min(1, Math.sqrt(varianceSum / energies.length) * 4);

    // 2. Simple Beat Detection & BPM Estimation (Peak Interval Auto-Correlation)
    // Filter energy peaks above average threshold
    const avgEnergy = energies.reduce((a, b) => a + b, 0) / (energies.length || 1);
    const peakThreshold = avgEnergy * 1.4;
    const peakIndices: number[] = [];

    for (let i = 1; i < energies.length - 1; i++) {
      if (energies[i] > peakThreshold && energies[i] > energies[i - 1] && energies[i] > energies[i + 1]) {
        // Min distance between beats (~200ms = max 300 BPM)
        const minDistanceInWindows = Math.floor((0.2 * sampleRate) / windowSize);
        if (peakIndices.length === 0 || i - peakIndices[peakIndices.length - 1] >= minDistanceInWindows) {
          peakIndices.push(i);
        }
      }
    }

    let detectedBpm = 0;
    let rhythmicPresence = 0;

    if (peakIndices.length >= 4) {
      // Calculate intervals between peaks
      const intervals: number[] = [];
      for (let i = 1; i < peakIndices.length; i++) {
        const intervalSec = ((peakIndices[i] - peakIndices[i - 1]) * windowSize) / sampleRate;
        if (intervalSec > 0.25 && intervalSec < 1.5) {
          intervals.push(intervalSec);
        }
      }

      if (intervals.length > 0) {
        // Median interval
        intervals.sort((a, b) => a - b);
        const medianInterval = intervals[Math.floor(intervals.length / 2)];
        const rawBpm = Math.round(60 / medianInterval);

        // Normalize BPM to standard range 60 - 170
        if (rawBpm < 60) detectedBpm = rawBpm * 2;
        else if (rawBpm > 175) detectedBpm = Math.round(rawBpm / 2);
        else detectedBpm = rawBpm;

        rhythmicPresence = Math.min(1, peakIndices.length / (energies.length * 0.3));
      }
    }

    // 3. Zero-Crossing Rate & Spectral Brightness (Approximation)
    let zeroCrossings = 0;
    for (let i = 1; i < length; i++) {
      if ((channelData[i] >= 0 && channelData[i - 1] < 0) || (channelData[i] < 0 && channelData[i - 1] >= 0)) {
        zeroCrossings++;
      }
    }
    const zeroCrossingRate = zeroCrossings / length; // high for noise/glitch/treble, low for bass/pads
    const spectralBrightness = Math.min(1, zeroCrossingRate * 8);

    // 4. Bass Energy Estimation (Difference in energy after adjacent smoothing)
    let lowFreqEnergy = 0;
    for (let i = 1; i < length; i++) {
      const smoothed = (channelData[i] + channelData[i - 1]) * 0.5;
      lowFreqEnergy += smoothed * smoothed;
    }
    const bassEnergy = Math.min(1, (lowFreqEnergy / (sumSquares || 1)) * 1.1);

    // 5. Classification Decision Matrix
    let genre: Track['category'] = 'ambient';
    let moodTag = 'Atmospheric Drone';
    let description = 'Deep ambient soundscape with smooth sustained pads and subtle harmonic shifts.';
    let confidence = 0.75;

    if (detectedBpm >= 120 && dynamicVariance > 0.35 && bassEnergy > 0.45) {
      genre = 'edm';
      moodTag = `Industrial Techno (${detectedBpm} BPM)`;
      description = `High-energy rhythmic structure with detected tempo around ${detectedBpm} BPM and punchy low-end impact.`;
      confidence = 0.88;
    } else if (bassEnergy > 0.6 && dynamicVariance < 0.4) {
      genre = 'dark';
      moodTag = 'Dark Sub-Bass Void';
      description = 'Heavy sub-bass presence with dark harmonic resonances and atmospheric depth.';
      confidence = 0.82;
    } else if (detectedBpm >= 70 && detectedBpm <= 105 && dynamicVariance > 0.2) {
      genre = 'downtempo';
      moodTag = `Downtempo Groove (${detectedBpm} BPM)`;
      description = `Mellow tempo cadence detected at ~${detectedBpm} BPM with balanced warm frequency distribution.`;
      confidence = 0.84;
    } else if (spectralBrightness > 0.65 && dynamicVariance > 0.4) {
      genre = 'experimental';
      moodTag = 'Glitch & Modular Noise';
      description = 'High textural variance and rich high-frequency modular synthesis elements.';
      confidence = 0.8;
    } else if (dynamicVariance > 0.25 && totalRms > 0.15) {
      genre = 'cinematic';
      moodTag = 'Cinematic Odyssey';
      description = 'Wide dynamic range with evolving orchestral or sweeping synthesizer layers.';
      confidence = 0.78;
    } else {
      genre = 'ambient';
      moodTag = detectedBpm > 0 ? `Ambient (${detectedBpm} BPM)` : 'Sublime Ambient';
      description = 'Continuous, evolving sonic atmosphere with subtle micro-textures and gentle resonance.';
      confidence = 0.85;
    }

    return {
      detectedBpm: detectedBpm || (genre === 'edm' ? 128 : genre === 'downtempo' ? 85 : 72),
      genre,
      moodTag,
      description,
      confidence,
      features: {
        bassEnergy: Math.round(bassEnergy * 100) / 100,
        rhythmicPresence: Math.round(rhythmicPresence * 100) / 100,
        spectralBrightness: Math.round(spectralBrightness * 100) / 100,
        dynamicVariance: Math.round(dynamicVariance * 100) / 100,
      },
    };
  } catch (err) {
    console.warn('Audio signal analysis fallback to heuristic:', err);
    // Fallback to filename classification
    const fallback = classifyByFilename(audioUrl);
    return {
      detectedBpm: fallback.estimatedBpm,
      genre: fallback.genre,
      moodTag: fallback.moodTag,
      description: fallback.description,
      confidence: 0.6,
      features: {
        bassEnergy: 0.5,
        rhythmicPresence: 0.5,
        spectralBrightness: 0.5,
        dynamicVariance: 0.5,
      },
    };
  }
}

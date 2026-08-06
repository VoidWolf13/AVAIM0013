import { Track } from '../types';

export interface AudioAnalysisResult {
  detectedBpm: number;
  genre: string;
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
 * Clean metadata extraction from filename without arbitrary keyword stereotyping
 */
export function classifyByFilename(filename: string): {
  genre: string;
  moodTag: string;
  description: string;
  estimatedBpm: number;
} {
  const clean = filename.toLowerCase();

  // Extract explicit BPM from filename if explicitly declared by artist (e.g., "track_128bpm.wav", "140 bpm - loop.mp3")
  const bpmMatch = clean.match(/(\d{2,3})\s*(?:bpm|tempo)/i) || clean.match(/_(\d{2,3})_/);
  const estimatedBpm = bpmMatch ? parseInt(bpmMatch[1], 10) : 0;

  // Clean, neutral default without making up fake genres
  return {
    genre: 'all',
    moodTag: 'AVAIM0013',
    description: 'Оригинальная композиция проекта AVAIM0013.',
    estimatedBpm: estimatedBpm,
  };
}

/**
 * Client-Side Audio Signal Feature Extraction (for real waveform dynamics & visualizer stats)
 */
export async function analyzeAudioUrl(audioUrl: string): Promise<AudioAnalysisResult> {
  try {
    const response = await fetch(audioUrl, {
      headers: {
        'Range': 'bytes=0-1500000',
      },
    });

    const arrayBuffer = await response.arrayBuffer();

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

    let sumSquares = 0;
    const windowSize = Math.floor(sampleRate * 0.05); // 50ms window
    const energies: number[] = [];

    for (let i = 0; i < length; i += windowSize) {
      let windowSum = 0;
      const end = Math.min(i + windowSize, length);
      for (let j = i; j < end; j++) {
        const val = channelData[j];
        windowSum += val * val;
      }
      const windowRms = Math.sqrt(windowSum / (end - i));
      energies.push(windowRms);
      sumSquares += windowSum;
    }

    const totalRms = Math.sqrt(sumSquares / length);

    let varianceSum = 0;
    for (const e of energies) {
      varianceSum += Math.pow(e - totalRms, 2);
    }
    const dynamicVariance = Math.min(1, Math.sqrt(varianceSum / (energies.length || 1)) * 4);

    // Peak cadence
    const avgEnergy = energies.reduce((a, b) => a + b, 0) / (energies.length || 1);
    const peakThreshold = avgEnergy * 1.4;
    const peakIndices: number[] = [];

    for (let i = 1; i < energies.length - 1; i++) {
      if (energies[i] > peakThreshold && energies[i] > energies[i - 1] && energies[i] > energies[i + 1]) {
        const minDistanceInWindows = Math.floor((0.2 * sampleRate) / windowSize);
        if (peakIndices.length === 0 || i - peakIndices[peakIndices.length - 1] >= minDistanceInWindows) {
          peakIndices.push(i);
        }
      }
    }

    let detectedBpm = 0;
    let rhythmicPresence = 0;

    if (peakIndices.length >= 4) {
      const intervals: number[] = [];
      for (let i = 1; i < peakIndices.length; i++) {
        const intervalSec = ((peakIndices[i] - peakIndices[i - 1]) * windowSize) / sampleRate;
        if (intervalSec > 0.25 && intervalSec < 1.5) {
          intervals.push(intervalSec);
        }
      }

      if (intervals.length > 0) {
        intervals.sort((a, b) => a - b);
        const medianInterval = intervals[Math.floor(intervals.length / 2)];
        const rawBpm = Math.round(60 / medianInterval);

        if (rawBpm >= 60 && rawBpm <= 180) {
          detectedBpm = rawBpm;
        }
        rhythmicPresence = Math.min(1, peakIndices.length / (energies.length * 0.3));
      }
    }

    let zeroCrossings = 0;
    for (let i = 1; i < length; i++) {
      if ((channelData[i] >= 0 && channelData[i - 1] < 0) || (channelData[i] < 0 && channelData[i - 1] >= 0)) {
        zeroCrossings++;
      }
    }
    const zeroCrossingRate = zeroCrossings / length;
    const spectralBrightness = Math.min(1, zeroCrossingRate * 8);

    let lowFreqEnergy = 0;
    for (let i = 1; i < length; i++) {
      const smoothed = (channelData[i] + channelData[i - 1]) * 0.5;
      lowFreqEnergy += smoothed * smoothed;
    }
    const bassEnergy = Math.min(1, (lowFreqEnergy / (sumSquares || 1)) * 1.1);

    return {
      detectedBpm: detectedBpm,
      genre: 'AVAIM0013',
      moodTag: 'AVAIM0013',
      description: 'AVAIM0013',
      confidence: 0.9,
      features: {
        bassEnergy: Math.round(bassEnergy * 100) / 100,
        rhythmicPresence: Math.round(rhythmicPresence * 100) / 100,
        spectralBrightness: Math.round(spectralBrightness * 100) / 100,
        dynamicVariance: Math.round(dynamicVariance * 100) / 100,
      },
    };
  } catch {
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

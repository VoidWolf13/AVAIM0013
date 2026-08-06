import React, { useEffect, useRef } from 'react';
import { useAudio } from '../context/AudioContext';
import { VisualizerMode } from '../types';

interface VisualizerCanvasProps {
  className?: string;
  mode?: VisualizerMode;
  showOverlayStats?: boolean;
}

export const VisualizerCanvas: React.FC<VisualizerCanvasProps> = ({
  className = 'w-full h-28',
  mode: propMode,
  showOverlayStats = false,
}) => {
  const { analyserNode, isPlaying, visualizerMode: contextMode, currentTrack } = useAudio();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const activeMode = propMode || contextMode;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let phase = 0;

    const palette = {
      primary: '#e4e4e7',
      secondary: '#a1a1aa',
      accent: '#71717a',
      glow: 'rgba(255, 255, 255, 0.25)',
      peak: '#ffffff',
      particles: ['#ffffff', '#e4e4e7', '#a1a1aa', '#71717a'],
    };

    // Persistent particle array for particle mode
    const particleCount = 45;
    const particles = Array.from({ length: particleCount }, () => ({
      x: Math.random(),
      y: Math.random(),
      vx: (Math.random() - 0.5) * 0.002,
      vy: (Math.random() - 0.5) * 0.002,
      size: Math.random() * 2.5 + 1,
      baseAlpha: Math.random() * 0.4 + 0.2,
      color: palette.particles[Math.floor(Math.random() * palette.particles.length)],
    }));

    // Dynamic sizing with ResizeObserver
    const handleResize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
    };

    handleResize();
    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(canvas);

    const bufferLength = analyserNode ? analyserNode.frequencyBinCount : 64;
    const dataArray = new Uint8Array(bufferLength);
    const timeDataArray = new Uint8Array(bufferLength);

    const render = () => {
      animationFrameId = requestAnimationFrame(render);
      const width = canvas.getBoundingClientRect().width;
      const height = canvas.getBoundingClientRect().height;

      if (width <= 0 || height <= 0) return;

      // Fetch real audio data if available
      let hasRealData = false;
      if (analyserNode && isPlaying) {
        analyserNode.getByteFrequencyData(dataArray);
        analyserNode.getByteTimeDomainData(timeDataArray);
        const sum = dataArray.reduce((acc, val) => acc + val, 0);
        if (sum > 50) hasRealData = true;
      }

      phase += 0.035;

      // Clear canvas
      ctx.clearRect(0, 0, width, height);

      // 1. MODE: BARS
      if (activeMode === 'bars') {
        const barCount = 32;
        const barWidth = (width / barCount) * 0.72;
        const gap = (width - barWidth * barCount) / (barCount + 1);

        for (let i = 0; i < barCount; i++) {
          let magnitude = 0;
          if (hasRealData) {
            const dataIndex = Math.floor((i / barCount) * (bufferLength * 0.8));
            magnitude = dataArray[dataIndex] / 255;
          } else if (isPlaying) {
            magnitude = 0.2 + 0.3 * Math.sin(phase + i * 0.25) * Math.cos(phase * 0.5 + i * 0.1);
          } else {
            magnitude = 0.06 + 0.03 * Math.sin(phase * 0.5 + i * 0.3);
          }

          magnitude = Math.max(0.04, Math.min(0.96, magnitude));
          const barHeight = magnitude * (height * 0.82);
          const x = gap + i * (barWidth + gap);
          const y = height - barHeight - 4;

          const grad = ctx.createLinearGradient(0, y, 0, height);
          grad.addColorStop(0, palette.primary);
          grad.addColorStop(0.5, palette.secondary);
          grad.addColorStop(1, 'rgba(10, 10, 15, 0.2)');

          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.roundRect(x, y, barWidth, barHeight, [3, 3, 0, 0]);
          ctx.fill();

          // Peak cap
          ctx.fillStyle = palette.peak;
          ctx.fillRect(x, Math.max(0, y - 2), barWidth, 1.5);
        }
      }

      // 2. MODE: WAVEFORM
      else if (activeMode === 'waveform') {
        ctx.beginPath();
        const sliceWidth = width / (bufferLength - 1);
        ctx.lineWidth = 2.5;

        const grad = ctx.createLinearGradient(0, 0, width, 0);
        grad.addColorStop(0, palette.accent);
        grad.addColorStop(0.5, palette.primary);
        grad.addColorStop(1, palette.secondary);
        ctx.strokeStyle = grad;
        ctx.shadowBlur = 8;
        ctx.shadowColor = palette.glow;

        let x = 0;
        for (let i = 0; i < bufferLength; i++) {
          let v = 0.5;
          if (hasRealData) {
            v = timeDataArray[i] / 255.0;
          } else if (isPlaying) {
            v = 0.5 + 0.22 * Math.sin(phase * 2 + i * 0.15) * Math.sin(i * 0.08);
          } else {
            v = 0.5 + 0.04 * Math.sin(phase + i * 0.1);
          }

          const y = v * height;
          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
          x += sliceWidth;
        }
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Subtle mirror glow under baseline
        ctx.lineTo(width, height);
        ctx.lineTo(0, height);
        ctx.fillStyle = palette.glow;
        ctx.fill();
      }

      // 3. MODE: RADIAL
      else if (activeMode === 'radial') {
        const centerX = width / 2;
        const centerY = height / 2;
        const baseRadius = Math.min(centerX, centerY) * 0.45;
        const rayCount = 44;

        let avgEnergy = 0;
        if (hasRealData) {
          avgEnergy = dataArray.slice(0, 16).reduce((a, b) => a + b, 0) / (16 * 255);
        } else if (isPlaying) {
          avgEnergy = 0.3 + 0.2 * Math.sin(phase * 2);
        }

        ctx.beginPath();
        ctx.arc(centerX, centerY, baseRadius * (0.85 + avgEnergy * 0.25), 0, Math.PI * 2);
        ctx.fillStyle = palette.glow;
        ctx.fill();
        ctx.strokeStyle = palette.primary;
        ctx.lineWidth = 2;
        ctx.shadowBlur = 6;
        ctx.shadowColor = palette.glow;
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Radiating rays
        for (let i = 0; i < rayCount; i++) {
          const angle = (i / rayCount) * Math.PI * 2 + phase * 0.18;
          let mag = 0;
          if (hasRealData) {
            const dataIndex = Math.floor((i / rayCount) * (bufferLength * 0.6));
            mag = dataArray[dataIndex] / 255;
          } else if (isPlaying) {
            mag = 0.2 + 0.25 * Math.sin(phase + i * 0.4);
          } else {
            mag = 0.05 + 0.02 * Math.sin(phase + i * 0.2);
          }

          const r1 = baseRadius;
          const r2 = baseRadius + mag * (Math.min(centerX, centerY) * 0.48);

          const x1 = centerX + Math.cos(angle) * r1;
          const y1 = centerY + Math.sin(angle) * r1;
          const x2 = centerX + Math.cos(angle) * r2;
          const y2 = centerY + Math.sin(angle) * r2;

          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.strokeStyle = i % 2 === 0 ? palette.primary : palette.secondary;
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }
      }

      // 4. MODE: PARTICLES (Cosmic Nebula)
      else if (activeMode === 'particles') {
        let bassEnergy = 0;
        if (hasRealData) {
          bassEnergy = dataArray.slice(0, 8).reduce((a, b) => a + b, 0) / (8 * 255);
        } else if (isPlaying) {
          bassEnergy = 0.25 + 0.2 * Math.sin(phase * 1.5);
        }

        particles.forEach((p, idx) => {
          p.x += p.vx * (1 + bassEnergy * 2);
          p.y += p.vy * (1 + bassEnergy * 2);

          if (p.x < 0) p.x = 1;
          if (p.x > 1) p.x = 0;
          if (p.y < 0) p.y = 1;
          if (p.y > 1) p.y = 0;

          const px = p.x * width;
          const py = p.y * height;
          const currentSize = p.size * (1 + bassEnergy * 1.5);

          ctx.beginPath();
          ctx.arc(px, py, currentSize, 0, Math.PI * 2);
          ctx.fillStyle = p.color;
          ctx.globalAlpha = Math.min(1, p.baseAlpha + bassEnergy * 0.5);
          ctx.fill();

          for (let j = idx + 1; j < particles.length; j++) {
            const p2 = particles[j];
            const dx = (p.x - p2.x) * width;
            const dy = (p.y - p2.y) * height;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 75) {
              ctx.beginPath();
              ctx.moveTo(px, py);
              ctx.lineTo(p2.x * width, p2.y * height);
              ctx.strokeStyle = palette.primary;
              ctx.globalAlpha = (1 - dist / 75) * 0.18 * (1 + bassEnergy);
              ctx.lineWidth = 1;
              ctx.stroke();
            }
          }
        });
        ctx.globalAlpha = 1.0;
      }
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
    };
  }, [analyserNode, isPlaying, activeMode]);

  return (
    <div className={`relative overflow-hidden rounded-xl bg-black/40 border border-white/10 ${className}`}>
      <canvas
        ref={canvasRef}
        className="w-full h-full block"
      />

      {showOverlayStats && (
        <div className="absolute top-2 left-3 flex items-center gap-2 pointer-events-none text-[11px] font-mono text-neutral-300 bg-neutral-950/80 px-2 py-0.5 rounded border border-neutral-800">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
          <span>{activeMode.toUpperCase()}</span>
          <span className="text-neutral-600">•</span>
          <span className="text-neutral-400">{currentTrack.format.toUpperCase()}</span>
        </div>
      )}
    </div>
  );
};

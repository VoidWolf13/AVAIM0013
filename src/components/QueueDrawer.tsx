import React from 'react';
import { useAudio } from '../context/AudioContext';
import { ListMusic, X, Trash2, Play, Music } from 'lucide-react';

interface QueueDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const QueueDrawer: React.FC<QueueDrawerProps> = ({ isOpen, onClose }) => {
  const { queue, removeFromQueue, clearQueue, playTrack, currentTrack } = useAudio();

  if (!isOpen) return null;

  return (
    <div
      id="queue-drawer-overlay"
      className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
    >
      <div
        id="queue-drawer-content"
        className="w-full max-w-sm h-full bg-neutral-900 border-l border-neutral-800 shadow-2xl p-5 flex flex-col justify-between text-neutral-100 animate-slideInRight"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header & List */}
        <div className="space-y-4 flex-1 flex flex-col min-h-0">
          <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-neutral-800 text-white border border-neutral-700">
                <ListMusic className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold font-mono text-white">Очередь воспроизведения</h3>
                <p className="text-[11px] text-neutral-400 font-mono">
                  {queue.length} {queue.length === 1 ? 'трек' : queue.length > 1 && queue.length < 5 ? 'трека' : 'треков'} в очереди
                </p>
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

          {/* Currently Playing Card */}
          <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-3 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-neutral-800 border border-neutral-700 flex items-center justify-center text-white shrink-0">
              <Music className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider block">
                Сейчас играет
              </span>
              <p className="text-xs font-bold text-white truncate font-mono">{currentTrack.title}</p>
            </div>
          </div>

          {/* Up Next List */}
          <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 min-h-0">
            <span className="text-[11px] font-mono text-neutral-500 uppercase tracking-wider block mb-1">
              Следующие в очереди
            </span>

            {queue.length === 0 ? (
              <div className="p-6 text-center text-neutral-500 text-xs font-mono border border-dashed border-neutral-800 rounded-xl">
                Очередь пуста
              </div>
            ) : (
              queue.map((track, idx) => (
                <div
                  key={`${track.id}-${idx}`}
                  className="group flex items-center justify-between p-2 rounded-xl bg-neutral-950/60 border border-neutral-800/80 hover:border-neutral-700 transition text-xs font-mono"
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <button
                      onClick={() => {
                        playTrack(track);
                        removeFromQueue(idx);
                      }}
                      className="w-6 h-6 rounded-md bg-neutral-800 text-neutral-300 group-hover:text-white flex items-center justify-center shrink-0"
                      title="Воспроизвести сейчас"
                    >
                      <Play className="w-3 h-3 fill-current ml-0.5" />
                    </button>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-white truncate">{track.title}</p>
                      <p className="text-[10px] text-neutral-500 truncate">{track.moodTag}</p>
                    </div>
                  </div>

                  <button
                    onClick={() => removeFromQueue(idx)}
                    className="p-1 text-neutral-500 hover:text-rose-400 transition ml-2"
                    title="Удалить из очереди"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Footer actions */}
        {queue.length > 0 && (
          <div className="pt-3 border-t border-neutral-800 flex items-center justify-between">
            <button
              onClick={clearQueue}
              className="text-xs font-mono text-neutral-500 hover:text-rose-400 flex items-center gap-1.5 transition"
              title="Очистить всю очередь"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Очистить очередь</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

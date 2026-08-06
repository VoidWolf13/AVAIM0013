import React, { useState } from 'react';
import { useAudio } from '../context/AudioContext';
import {
  FolderGit2,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  X,
  ExternalLink,
  Info,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { GitHubSyncConfig } from '../types';

interface GitHubSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShowToast: (msg: string) => void;
}

export const GitHubSyncModal: React.FC<GitHubSyncModalProps> = ({
  isOpen,
  onClose,
  onShowToast,
}) => {
  const {
    tracks,
    isSyncingGitHub,
    githubSyncError,
    githubConfig,
    lastSyncTime,
    syncWithGitHub,
    updateGitHubConfig,
    resetToDefaultTracks,
  } = useAudio();

  const [owner, setOwner] = useState(githubConfig.owner);
  const [repo, setRepo] = useState(githubConfig.repo);
  const [folder, setFolder] = useState(githubConfig.folder);
  const [branch, setBranch] = useState(githubConfig.branch);
  const [autoSync, setAutoSync] = useState(githubConfig.autoSync);
  const [syncStatusMsg, setSyncStatusMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSaveAndSync = async (e: React.FormEvent) => {
    e.preventDefault();
    const newConfig: GitHubSyncConfig = {
      owner: owner.trim(),
      repo: repo.trim(),
      folder: folder.trim(),
      branch: branch.trim() || 'main',
      autoSync,
    };
    updateGitHubConfig(newConfig);

    setSyncStatusMsg('Сканирование папки на GitHub...');
    const res = await syncWithGitHub(newConfig);
    if (res.success) {
      setSyncStatusMsg(`Успешно! Загружено ${res.count} треков из GitHub.`);
      onShowToast(`Синхронизировано: ${res.count} треков из ${newConfig.owner}/${newConfig.repo}/${newConfig.folder}`);
    } else {
      setSyncStatusMsg(res.error || 'Ошибка синхронизации');
      onShowToast(res.error || 'Ошибка синхронизации');
    }
  };

  const handleResetToEmbedded = () => {
    resetToDefaultTracks();
    setSyncStatusMsg('Плейлист сброшен к исходному состоянию.');
    onShowToast('Плейлист сброшен к исходному состоянию');
  };

  const repoWebUrl = `https://github.com/${owner}/${repo}/tree/${branch}/${folder}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div
        id="github-sync-modal-card"
        className="w-full max-w-lg rounded-2xl bg-neutral-900 border border-neutral-800 p-6 shadow-2xl space-y-5 text-neutral-200"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-neutral-800 flex items-center justify-center text-neutral-200 border border-neutral-700">
              <FolderGit2 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold font-mono tracking-wide text-neutral-100">
                GitHub Music Sync
              </h2>
              <p className="text-[11px] text-neutral-400 font-mono">
                Автоматическое чтение треков из папки репозитория
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Current status summary */}
        <div className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800 space-y-2 text-xs font-mono">
          <div className="flex items-center justify-between">
            <span className="text-neutral-400">Текущий плейлист:</span>
            <span className="font-bold text-neutral-100">{tracks.length} треков</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-neutral-400">Источник папки:</span>
            <span className="text-neutral-300">
              {githubConfig.owner}/{githubConfig.repo}/{githubConfig.folder || 'music'}
            </span>
          </div>
          {lastSyncTime && (
            <div className="flex items-center justify-between text-[11px] text-neutral-500">
              <span>Посл. обновление:</span>
              <span>{lastSyncTime.toLocaleTimeString()}</span>
            </div>
          )}
        </div>

        {/* Form to configure GitHub parameters */}
        <form onSubmit={handleSaveAndSync} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-mono text-neutral-400 mb-1">
                GitHub Владелец (Owner)
              </label>
              <input
                type="text"
                value={owner}
                onChange={(e) => setOwner(e.target.value)}
                placeholder="VoidWolf13"
                className="w-full px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-neutral-200 text-xs font-mono focus:outline-none focus:border-neutral-700"
                required
              />
            </div>
            <div>
              <label className="block text-[11px] font-mono text-neutral-400 mb-1">
                Имя репозитория (Repo)
              </label>
              <input
                type="text"
                value={repo}
                onChange={(e) => setRepo(e.target.value)}
                placeholder="AVAIM0013"
                className="w-full px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-neutral-200 text-xs font-mono focus:outline-none focus:border-neutral-700"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-mono text-neutral-400 mb-1">
                Папка с музыкой (Folder)
              </label>
              <input
                type="text"
                value={folder}
                onChange={(e) => setFolder(e.target.value)}
                placeholder="music"
                className="w-full px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-neutral-200 text-xs font-mono focus:outline-none focus:border-neutral-700"
              />
            </div>
            <div>
              <label className="block text-[11px] font-mono text-neutral-400 mb-1">
                Ветка (Branch)
              </label>
              <input
                type="text"
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
                placeholder="main"
                className="w-full px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-neutral-200 text-xs font-mono focus:outline-none focus:border-neutral-700"
              />
            </div>
          </div>

          {/* Auto-sync checkbox */}
          <label className="flex items-center gap-2.5 text-xs font-mono text-neutral-300 cursor-pointer pt-1">
            <input
              type="checkbox"
              checked={autoSync}
              onChange={(e) => setAutoSync(e.target.checked)}
              className="rounded bg-neutral-950 border-neutral-700 text-neutral-100 focus:ring-0"
            />
            <span>Автоматически сканировать GitHub при открытии сайта</span>
          </label>

          {/* Feedback message */}
          {syncStatusMsg && (
            <div
              className={`p-3 rounded-xl text-xs font-mono flex items-start gap-2 ${
                githubSyncError
                  ? 'bg-rose-950/40 border border-rose-900/50 text-rose-300'
                  : 'bg-neutral-800/60 border border-neutral-700 text-neutral-200'
              }`}
            >
              {githubSyncError ? (
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              )}
              <div className="flex-1">{syncStatusMsg}</div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2 pt-2">
            <button
              type="submit"
              disabled={isSyncingGitHub}
              className="flex-1 py-2.5 px-4 rounded-xl bg-neutral-100 hover:bg-white text-neutral-950 font-bold text-xs font-mono flex items-center justify-center gap-2 transition disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncingGitHub ? 'animate-spin' : ''}`} />
              {isSyncingGitHub ? 'Сканирование...' : 'Сканировать папку & Обновить'}
            </button>

            <button
              type="button"
              onClick={handleResetToEmbedded}
              className="py-2.5 px-3 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-mono flex items-center gap-1.5 transition"
              title="Сбросить плейлист к исходному состоянию"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Сброс</span>
            </button>
          </div>
        </form>

        {/* How it works instruction box */}
        <div className="p-3.5 rounded-xl bg-neutral-950/60 border border-neutral-800 text-[11px] font-mono text-neutral-400 space-y-2">
          <div className="flex items-center gap-1.5 text-neutral-300 font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-neutral-400" />
            <span>Как это работает:</span>
          </div>
          <ol className="list-decimal list-inside space-y-1 text-neutral-400">
            <li>Вы загружаете аудиофайлы (<code className="text-neutral-200">.mp3</code>, <code className="text-neutral-200">.flac</code>, <code className="text-neutral-200">.wav</code>, <code className="text-neutral-200">.ogg</code>) в папку <code className="text-neutral-200">{folder || 'music'}</code> на GitHub.</li>
            <li>Сайт считывает список файлов через публичный GitHub API.</li>
            <li>Плеер мгновенно формирует названия, определяет теги и воспроизводит музыку прямо с GitHub!</li>
          </ol>
          <div className="pt-1">
            <a
              href={repoWebUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-neutral-300 hover:text-white underline text-[11px]"
            >
              <span>Открыть папку на GitHub</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

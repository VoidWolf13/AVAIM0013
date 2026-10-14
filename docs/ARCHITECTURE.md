# Архитектура

## Что это
Веб-аудиоплеер и архив треков AVAIM0013. SPA: React 19 + Vite 6, TypeScript, Tailwind CSS v4, Web Audio API.

## Поток данных
1. Браузер загружает SPA с GitHub Pages.
2. `src/utils/githubScanner.ts` запрашивает список файлов `music/` через GitHub REST API (`/repos/VoidWolf13/AVAIM0013/contents/music`).
3. Отбираются аудиофайлы по расширению; из имён формируются названия (`formatAudioTitle`).
4. Список кэшируется в `localStorage`; при 403 (rate limit) используется кэш.
5. Воспроизведение — `src/context/AudioContext.tsx` (Web Audio API: AnalyserNode, BiquadFilter).
6. Визуализаторы, эквалайзер, таймер сна — компоненты в `src/components/`.

## Структура
- `src/components/` — UI: Header, PlayerControls, TrackList, VisualizerCanvas, ZenVisualizerModal, AudioEqualizerModal, SleepTimerModal, KeyboardShortcutsModal, Toast.
- `src/context/AudioContext.tsx` — состояние плеера и аудио-граф.
- `src/utils/` — githubScanner (сканер репозитория), audioGenreClassifier, id3Parser, formatTime.
- `src/data/tracks.ts` — константы (артист, URL).
- `src/types.ts` — типы.
- `scripts/` — addTags.js/.mjs (проставление тегов, вспомогательное).
- `music/` — аудиоархив (110 треков).
- `.github/workflows/deploy.yml` — сборка и деплой на GitHub Pages.

## Деплой
Push в `main` → GitHub Actions (`npm ci && npm run build`) → публикация `dist/` на Pages.

## Известные особенности
- Метаданные треков — заглушки: `classifyByFilename` возвращает фиксированные значения; реальные ID3-теги не читаются (`id3Parser` не подключён).
- `inferMoodAndCategory`, `saveCustomTrackMetadata` — не используются / недоделаны.
- GitHub REST API без токена ограничен 60 запросами/час на IP.

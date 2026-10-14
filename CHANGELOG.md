# Changelog

Формат — Keep a Changelog (keepachangelog.com/ru/1.1.0/).
Версии — SemVer (semver.org/lang/ru/).

## [Unreleased]

### Added
- `docs/PIPELINE.md` — спецификация конвейера обработки треков (зафиксированы принятые решения; не реализовано).

### Added (планируется)
- Чтение реальных ID3-тегов (`src/utils/id3Parser.ts` написан, но не подключён).
- Сохранение пользовательских метаданных треков (`saveCustomTrackMetadata` не вызывается).
- Теги релизов.

### Changed (планируется)
- Задействовать или удалить мёртвый код (`id3Parser`, `inferMoodAndCategory`).
- Устойчивость к лимиту GitHub API.

## [1.0.0] — 2026-10-15

### Added
- Комплект документации: `VERSION`, `CHANGELOG.md`, `docs/` (RULES, PLAN, ARCHITECTURE).
- `.gitattributes` — единые переводы строк LF; бинарные файлы не трогаются.
- `.gitignore` — игнор `desktop.ini`, `Thumbs.db`, `.DS_Store`.

### Changed
- Переводы строк в репозитории нормализованы в LF.

### Removed
- `music/desktop.ini` (артефакт Windows) удалён из репозитория.

## [0.1.0] — 2026-08-06

### Added
- Первый рабочий веб-плеер AVAIM0013: React 19 + Vite 6, TypeScript, Tailwind v4.
- Динамическое сканирование `music/` через GitHub REST API.
- 4 визуализатора, 3-полосный эквалайзер, таймер сна, Zen-режим, горячие клавиши, избранное.
- Деплой на GitHub Pages через GitHub Actions.

> История до 1.0.0 не детализирована: велись только git-коммиты без CHANGELOG.

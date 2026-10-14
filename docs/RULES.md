# Правила проекта

## Рабочая цепочка (как добавлять треки)
1. Положить аудиофайл (.mp3/.flac/.wav/.ogg/.m4a/.aac) в `music/`.
2. Закоммитить и запушить в `main`.
3. Сайт подхватывает автоматически: читает `music/` в рантайме через GitHub REST API; GitHub Actions пересобирает Pages.

## Git
- remote: `git@github.com:VoidWolf13/AVAIM0013.git` (SSH).
- Ветка по умолчанию — `main`; деплой триггерится пушем в `main`/`master`.
- Сообщения коммитов — Conventional Commits (feat/fix/docs/chore/...).

## Файлы
- Переводы строк — LF (`.gitattributes`).
- Мусор Windows/macOS (`desktop.ini`, `Thumbs.db`, `.DS_Store`) — в `.gitignore`.
- Аудио — только в `music/`; бинарные файлы git не трогает.

## Документация
- Единый источник истины: версия/статус — `VERSION`, история — `CHANGELOG.md`.
- При изменении поведения — обновлять CHANGELOG и, при необходимости, README/docs.

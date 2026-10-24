/**
 * Минимальный читатель ID3v2 — только название и исполнитель.
 *
 * Теги лежат в первых килобайтах файла, поэтому тянем не весь mp3,
 * а кусок через Range-запрос: raw.githubusercontent отдаёт 206 и
 * `Access-Control-Allow-Origin: *`. Результат кэшируется в памяти и в
 * localStorage — содержимое трека не меняется.
 *
 * Поддержаны ID3v2.3 и v2.4: TIT2 (название) и TPE1 (исполнитель).
 * Обложки и прочие фреймы не читаем — они не нужны карточке плеера.
 */

export interface Id3Tags {
  title?: string;
  artist?: string;
}

const CACHE_KEY = 'avaim_id3_cache';
const FIRST_CHUNK = 64 * 1024;

// url -> теги; null — тегов нет или файл не прочитался
const memory = new Map<string, Id3Tags | null>();

function readU32(b: Uint8Array, off: number): number {
  return ((b[off] << 24) | (b[off + 1] << 16) | (b[off + 2] << 8) | b[off + 3]) >>> 0;
}

/** Размер в ID3v2.4: по 7 бит на байт, старший бит всегда 0. */
function syncsafe(b: Uint8Array, off: number): number {
  return ((b[off] & 0x7f) << 21)
    | ((b[off + 1] & 0x7f) << 14)
    | ((b[off + 2] & 0x7f) << 7)
    | (b[off + 3] & 0x7f);
}

function stripNull(text: string): string {
  return text.replace(/\0+$/, '').trim();
}

/** Текст фрейма: первый байт — кодировка, остальное — строка. */
function decodeText(bytes: Uint8Array, encoding: number): string {
  if (encoding === 1 || encoding === 2) {
    let littleEndian = encoding === 1;
    let offset = 0;
    if (bytes[0] === 0xff && bytes[1] === 0xfe) {
      littleEndian = true;
      offset = 2;
    } else if (bytes[0] === 0xfe && bytes[1] === 0xff) {
      littleEndian = false;
      offset = 2;
    }
    const label = littleEndian ? 'utf-16le' : 'utf-16be';
    return stripNull(new TextDecoder(label).decode(bytes.subarray(offset)));
  }
  const label = encoding === 3 ? 'utf-8' : 'iso-8859-1';
  return stripNull(new TextDecoder(label).decode(bytes));
}

/** Убрать unsynchronisation: 0xFF 0x00 -> 0xFF. */
function deunsync(bytes: Uint8Array): Uint8Array {
  const out = new Uint8Array(bytes.length);
  let j = 0;
  for (let i = 0; i < bytes.length; i++) {
    out[j++] = bytes[i];
    if (bytes[i] === 0xff && bytes[i + 1] === 0x00) i++;
  }
  return out.subarray(0, j);
}

/** Разобрать начало файла. Возвращает null, если ID3v2 нет. */
export function parseId3(head: Uint8Array): Id3Tags | null {
  if (head.length < 10) return null;
  if (head[0] !== 0x49 || head[1] !== 0x44 || head[2] !== 0x33) return null; // "ID3"

  const version = head[3];
  const flags = head[5];
  const declared = syncsafe(head, 6);
  const end = Math.min(head.length, 10 + declared);

  let body: Uint8Array = head.subarray(10, end);
  if (flags & 0x80) body = deunsync(body);

  let pos = 0;
  // Расширенный заголовок (v2.3 — 4 байта размера, v2.4 — syncsafe).
  if (flags & 0x40 && body.length >= 4) {
    pos += version >= 4 ? syncsafe(body, 0) : readU32(body, 0) + 4;
  }

  const tags: Id3Tags = {};
  while (pos + 10 <= body.length) {
    const id = String.fromCharCode(body[pos], body[pos + 1], body[pos + 2], body[pos + 3]);
    if (!/^[A-Z0-9]{4}$/.test(id)) break;

    const size = version >= 4 ? syncsafe(body, pos + 4) : readU32(body, pos + 4);
    const start = pos + 10;
    if (size <= 0 || start + size > body.length) break;

    if (id === 'TIT2' || id === 'TPE1') {
      const encoding = body[start];
      const value = decodeText(body.subarray(start + 1, start + size), encoding);
      if (value && id === 'TIT2') tags.title = value;
      if (value && id === 'TPE1') tags.artist = value;
    }
    pos = start + size;
  }

  return tags.title || tags.artist ? tags : null;
}

function loadCache(): Record<string, Id3Tags> {
  try {
    const saved = localStorage.getItem(CACHE_KEY);
    return saved ? (JSON.parse(saved) as Record<string, Id3Tags>) : {};
  } catch {
    return {};
  }
}

function saveCache(url: string, tags: Id3Tags): void {
  try {
    const cache = loadCache();
    cache[url] = tags;
    const keys = Object.keys(cache);
    if (keys.length > 300) delete cache[keys[0]];
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch {
    // переполнение квоты — не критично, читаем заново
  }
}

/** Прочитать название и исполнителя из тегов файла по URL. */
export async function readTags(url: string): Promise<Id3Tags | null> {
  if (memory.has(url)) return memory.get(url) ?? null;

  const cached = loadCache()[url];
  if (cached) {
    memory.set(url, cached);
    return cached;
  }

  try {
    const resp = await fetch(url, {
      headers: { Range: `bytes=0-${FIRST_CHUNK - 1}` },
    });
    if (!resp.ok && resp.status !== 206) {
      memory.set(url, null);
      return null;
    }
    const tags = parseId3(new Uint8Array(await resp.arrayBuffer()));
    memory.set(url, tags);
    if (tags) saveCache(url, tags);
    return tags;
  } catch {
    memory.set(url, null);
    return null;
  }
}

import NodeID3 from 'node-id3';

export interface ID3Tags {
  title?: string;
  artist?: string;
  album?: string;
  genre?: string;
  year?: string;
}

/**
 * Читает ID3-теги из MP3 файла через fetch
 */
export async function readID3TagsFromUrl(url: string): Promise<ID3Tags> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch: ${response.status}`);
    }
    
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    const tags = NodeID3.read(buffer);
    
    return {
      title: tags.title || undefined,
      artist: tags.artist || undefined,
      album: tags.album || undefined,
      genre: tags.genre || undefined,
      year: tags.year || undefined,
    };
  } catch (error) {
    console.warn('Failed to read ID3 tags from URL:', url, error);
    return {};
  }
}

/**
 * Извлекает информацию из ID3-тегов и формирует название трека
 */
export function getTrackInfoFromID3(tags: ID3Tags): { title: string; artist: string } {
  const title = tags.title || '';
  const artist = tags.artist || '';
  
  return { title, artist };
}

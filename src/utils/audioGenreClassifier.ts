export function classifyByFilename(filename: string): {
  genre: string;
  moodTag: string;
  description: string;
  estimatedBpm: number;
} {
  const clean = filename.toLowerCase();

  const bpmMatch = clean.match(/(\d{2,3})\s*(?:bpm|tempo)/i) || clean.match(/_(\d{2,3})_/);
  const estimatedBpm = bpmMatch ? parseInt(bpmMatch[1], 10) : 0;

  return {
    genre: 'all',
    moodTag: 'AVAIM0013',
    description: 'Оригинальная композиция проекта AVAIM0013.',
    estimatedBpm: estimatedBpm,
  };
}

import NodeID3 from 'node-id3';
import fs from 'fs';

const filePath = process.argv[2];
const title = process.argv[3] || 'Intellectual acrobatics';
const artist = process.argv[4] || 'AVAIM0013';

if (!filePath) {
  console.error('Usage: node addTags.mjs <filePath> [title] [artist]');
  process.exit(1);
}

if (!fs.existsSync(filePath)) {
  console.error(`❌ Файл не найден: ${filePath}`);
  process.exit(1);
}

const tags = {
  title: title,
  artist: artist,
};

console.log(`📝 Добавляю теги в файл: ${filePath}`);
console.log(`   Название: ${title}`);
console.log(`   Исполнитель: ${artist}`);

const success = NodeID3.write(tags, filePath);

if (success) {
  console.log('✅ Теги успешно добавлены!');
} else {
  console.error('❌ Ошибка при записи тегов');
  process.exit(1);
}

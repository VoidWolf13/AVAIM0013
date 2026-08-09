const NodeID3 = require('node-id3');
const path = require('path');

const filePath = process.argv[2];
const title = process.argv[3] || 'Intellectual acrobatics';
const artist = process.argv[4] || 'AVAIM0013';

if (!filePath) {
  console.error('Usage: node addTags.js <filePath> [title] [artist]');
  process.exit(1);
}

const tags = {
  title: title,
  artist: artist,
};

const success = NodeID3.write(tags, filePath);

if (success) {
  console.log(`✅ Теги успешно добавлены в файл: ${filePath}`);
  console.log(`   Название: ${title}`);
  console.log(`   Исполнитель: ${artist}`);
} else {
  console.error('❌ Ошибка при записи тегов');
  process.exit(1);
}

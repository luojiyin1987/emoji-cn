const fs = require('fs');
const path = require('path');
const { pinyin } = require('pinyin-pro');

const EMOJI_DATA_FILE = path.join(__dirname, '../static/js/emoji-data.js');
const HAN_REGEX = /[\u3400-\u9fff]/;

function normalizeSyllable(token) {
  return token.toLowerCase().replace(/ü/g, 'v');
}

function buildPinyinIndex(text) {
  if (!text || !HAN_REGEX.test(text)) return null;

  const tokens = pinyin(text, {
    toneType: 'none',
    type: 'array',
    nonZh: 'consecutive'
  });

  const syllables = tokens
    .map(normalizeSyllable)
    .filter((token) => /^[a-zv]+$/.test(token));

  if (syllables.length === 0) return null;

  return {
    text: syllables.join(' '),
    compact: syllables.join(''),
    initials: syllables.map((syllable) => syllable[0] || '').join(''),
    syllables
  };
}

function readEmojiData() {
  const raw = fs.readFileSync(EMOJI_DATA_FILE, 'utf8');
  const start = raw.indexOf('{');
  const end = raw.lastIndexOf('}');
  return JSON.parse(raw.slice(start, end + 1));
}

function rebuildEmojiData(emojiData) {
  let count = 0;

  for (const emojis of Object.values(emojiData)) {
    for (const emoji of emojis) {
      emoji.pinyinKeywords = buildPinyinIndex(emoji.keywords);
      emoji.pinyinCategory = buildPinyinIndex(emoji.category);
      emoji.pinyinSubCategory = buildPinyinIndex(emoji.subCategory);
      count++;
    }
  }

  return count;
}

function writeEmojiData(emojiData) {
  const output = `// 自动生成的emoji数据 - ${new Date().toISOString()}\nexport const emojiData = ${JSON.stringify(emojiData, null, 2)};\n`;
  fs.writeFileSync(EMOJI_DATA_FILE, output, 'utf8');
}

function main() {
  const emojiData = readEmojiData();
  const count = rebuildEmojiData(emojiData);
  writeEmojiData(emojiData);
  console.log(`Pinyin index built for ${count} emojis.`);
}

main();

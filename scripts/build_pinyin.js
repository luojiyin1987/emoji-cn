const fs = require('fs');
const path = require('path');
const { pinyin } = require('pinyin-pro');

const CONFIG = {
  emojiDataFile: path.join(__dirname, '../static/js/emoji-data.js'),
  hanRegex: /[\u3400-\u9fff]/,
  syllableRegex: /^[a-zv]+$/,
  pinyinOptions: {
    toneType: 'none',
    type: 'array',
    nonZh: 'consecutive'
  },
  pinyinFields: ['keywords', 'category', 'subCategory']
};

function normalizeSyllable(token) {
  return token.toLowerCase().replace(/ü/g, 'v');
}

function toPinyinTokens(text) {
  return pinyin(text, CONFIG.pinyinOptions);
}

function extractSyllables(tokens) {
  return tokens
    .map(normalizeSyllable)
    .filter((token) => CONFIG.syllableRegex.test(token));
}

function assembleIndex(syllables) {
  return {
    text: syllables.join(' '),
    compact: syllables.join(''),
    initials: syllables.map((s) => s[0] || '').join(''),
    syllables
  };
}

function buildPinyinIndex(text) {
  if (!text || !CONFIG.hanRegex.test(text)) return null;

  const syllables = extractSyllables(toPinyinTokens(text));
  if (syllables.length === 0) return null;

  return assembleIndex(syllables);
}

function readEmojiData() {
  const raw = fs.readFileSync(CONFIG.emojiDataFile, 'utf8');
  const start = raw.indexOf('{');
  const end = raw.lastIndexOf('}');
  if (start === -1 || end === -1) {
    throw new Error(`Invalid emoji data file: ${CONFIG.emojiDataFile}`);
  }
  return JSON.parse(raw.slice(start, end + 1));
}

function addPinyinToEmoji(emoji) {
  for (const field of CONFIG.pinyinFields) {
    const key = 'pinyin' + field[0].toUpperCase() + field.slice(1);
    emoji[key] = buildPinyinIndex(emoji[field]);
  }
}

function enrichEmojiData(emojiData) {
  let count = 0;
  for (const emojis of Object.values(emojiData)) {
    for (const emoji of emojis) {
      addPinyinToEmoji(emoji);
      count++;
    }
  }
  return count;
}

function writeEmojiData(emojiData) {
  const output = `// 自动生成的emoji数据 - ${new Date().toISOString()}\nexport const emojiData = ${JSON.stringify(emojiData, null, 2)};\n`;
  fs.writeFileSync(CONFIG.emojiDataFile, output, 'utf8');
}

function main() {
  try {
    const emojiData = readEmojiData();
    const count = enrichEmojiData(emojiData);
    writeEmojiData(emojiData);
    console.log(`Pinyin index built for ${count} emojis.`);
  } catch (err) {
    console.error('Error building pinyin index:', err.message);
    process.exit(1);
  }
}

module.exports = { buildPinyinIndex, toPinyinTokens, extractSyllables, normalizeSyllable };

if (require.main === module) {
  main();
}

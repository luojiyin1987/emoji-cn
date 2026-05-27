const fs = require('fs');
const path = require('path');

const EMOJI_DATA_FILE = path.join(__dirname, '../static/js/emoji-data.js');
const TINY_PINYIN_FILE = path.join(__dirname, '../static/js/vendor/tiny-pinyin.js');

// ── Extract dictionary from tiny-pinyin vendor file ──

function loadDict() {
  // The vendor file is an ES module with CommonJS internals.
  // Parse the UNIHANS, PINYINS, EXCEPTIONS arrays directly from source.
  const src = fs.readFileSync(TINY_PINYIN_FILE, 'utf8');

  // Extract UNIHANS array
  const unihansMatch = src.match(/var UNIHANS = (\[[\s\S]*?\]);/);
  const pinyinsMatch = src.match(/var PINYINS = (\[[\s\S]*?\]);/);
  // Find EXCEPTIONS block between first "var EXCEPTIONS" and closing "};"
  const excStart = src.indexOf('var EXCEPTIONS = {');
  const excEnd = src.indexOf('};', excStart);
  const excBlock = src.slice(excStart + 'var EXCEPTIONS = '.length, excEnd + 1);

  if (!unihansMatch || !pinyinsMatch || excStart < 0) {
    throw new Error('Failed to parse tiny-pinyin dictionary');
  }

  const UNIHANS = JSON.parse(unihansMatch[1]);
  const PINYINS = JSON.parse(pinyinsMatch[1]);

  // Strip JS comments before parsing JSON
  const excClean = excBlock.replace(/\/\/.*$/gm, '').replace(/,\s*}/g, '}');
  const EXCEPTIONS = JSON.parse(excClean);

  // Apply patcher fixes (from 56l.js patcher)
  const patchExceptions = {
    "嗲": "DIA", "碡": "ZHOU", "聒": "GUO", "炔": "QUE",
    "蚵": "KE", "砉": "HUA", "嬷": "MO", "蹊": "XI",
    "丬": "PAN", "霰": "XIAN", "豉": "CHI", "饧": "XING",
    "帧": "ZHEN", "芎": "XIONG", "谁": "SHUI", "钶": "KE"
  };
  Object.assign(EXCEPTIONS, patchExceptions);

  UNIHANS[91] = "伕";
  UNIHANS[347] = "仚";
  UNIHANS[393] = "诌";
  UNIHANS[39] = "婤";
  UNIHANS[50] = "腠";
  UNIHANS[369] = "攸";
  UNIHANS[123] = "乯";
  UNIHANS[171] = "刕";
  UNIHANS[102] = "佝";
  UNIHANS[126] = "犿";
  UNIHANS[176] = "列";
  UNIHANS[178] = "刢";
  UNIHANS[252] = "娝";
  UNIHANS[330] = "偸";

  return { UNIHANS, PINYINS, EXCEPTIONS };
}

// ── Pinyin conversion (same logic as tiny-pinyin core.js) ──

function createConverter(dict) {
  const { UNIHANS, PINYINS, EXCEPTIONS } = dict;
  const FIRST = "阿";
  const LAST = "鿿";
  const COLLATOR = new Intl.Collator(["zh-Hans-CN", "zh-CN"]);
  const PINYIN_TYPE = 2;

  function genToken(ch) {
    if (ch in EXCEPTIONS) return { target: EXCEPTIONS[ch], type: PINYIN_TYPE };
    if (ch.charCodeAt(0) < 256) return { target: ch, type: 1 };

    let cmp = COLLATOR.compare(ch, FIRST);
    if (cmp < 0) return { target: ch, type: 3 };
    if (cmp === 0) return { target: PINYINS[0], type: PINYIN_TYPE };

    cmp = COLLATOR.compare(ch, LAST);
    if (cmp > 0) return { target: ch, type: 3 };
    if (cmp === 0) return { target: PINYINS[UNIHANS.length - 1], type: PINYIN_TYPE };

    let begin = 0, end = UNIHANS.length - 1, offset = -1;
    while (begin <= end) {
      offset = ~~((begin + end) / 2);
      cmp = COLLATOR.compare(ch, UNIHANS[offset]);
      if (cmp === 0) break;
      if (cmp > 0) begin = offset + 1;
      else end = offset - 1;
    }
    if (cmp < 0) offset--;

    const target = PINYINS[offset];
    return target ? { target, type: PINYIN_TYPE } : { target: ch, type: 3 };
  }

  return function convertToPinyin(str, separator, lowerCase) {
    return str.split('').map(ch => {
      const token = genToken(ch);
      if (lowerCase && token.type === PINYIN_TYPE) return token.target.toLowerCase();
      return token.target;
    }).join(separator || '');
  };
}

// ── Build pinyin index for a text string ──

function buildPinyinIndex(convertToPinyin, text) {
  if (!text) return null;
  const pinyinText = convertToPinyin(text, ' ', true).trim();
  if (!pinyinText) return null;

  const syllables = pinyinText.split(/\s+/).filter(Boolean);
  if (syllables.length === 0) return null;

  return {
    text: pinyinText,
    compact: syllables.join(''),
    initials: syllables.map(s => s[0] || '').join(''),
    syllables
  };
}

// ── Main ──

function main() {
  const dict = loadDict();
  const convertToPinyin = createConverter(dict);
  const buildPinyin = (text) => buildPinyinIndex(convertToPinyin, text);

  const raw = fs.readFileSync(EMOJI_DATA_FILE, 'utf8');
  const start = raw.indexOf('{');
  const end = raw.lastIndexOf('}');
  const emojiData = JSON.parse(raw.slice(start, end + 1));

  let count = 0;
  for (const emojis of Object.values(emojiData)) {
    for (const emoji of emojis) {
      if (emoji.keywords) emoji.pinyinKeywords = buildPinyin(emoji.keywords);
      if (emoji.category) emoji.pinyinCategory = buildPinyin(emoji.category);
      if (emoji.subCategory) emoji.pinyinSubCategory = buildPinyin(emoji.subCategory);
      count++;
    }
  }

  const output = `// 自动生成的emoji数据 - ${new Date().toISOString()}\nexport const emojiData = ${JSON.stringify(emojiData, null, 2)};\n`;
  fs.writeFileSync(EMOJI_DATA_FILE, output, 'utf8');
  console.log(`Pinyin index built for ${count} emojis.`);
}

main();

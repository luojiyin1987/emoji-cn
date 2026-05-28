const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { buildPinyinIndex } = require('./build_pinyin.js');

const cases = [
  {
    input: '笑哭了',
    expected: {
      text: 'xiao ku le',
      compact: 'xiaokule',
      initials: 'xkl',
      syllables: ['xiao', 'ku', 'le']
    }
  },
  {
    input: '睡着了',
    expected: {
      text: 'shui zhao le',
      compact: 'shuizhaole',
      initials: 'szl',
      syllables: ['shui', 'zhao', 'le']
    }
  },
  {
    input: '乐谱',
    expected: {
      text: 'yue pu',
      compact: 'yuepu',
      initials: 'yp',
      syllables: ['yue', 'pu']
    }
  },
  {
    input: '音乐键盘',
    expected: {
      text: 'yin yue jian pan',
      compact: 'yinyuejianpan',
      initials: 'yyjp',
      syllables: ['yin', 'yue', 'jian', 'pan']
    }
  },
  {
    input: '银行',
    expected: {
      text: 'yin hang',
      compact: 'yinhang',
      initials: 'yh',
      syllables: ['yin', 'hang']
    }
  },
  {
    input: '重复按钮',
    expected: {
      text: 'chong fu an niu',
      compact: 'chongfuanniu',
      initials: 'cfan',
      syllables: ['chong', 'fu', 'an', 'niu']
    }
  },
  {
    input: '旅行与地点',
    expected: {
      text: 'lv xing yu di dian',
      compact: 'lvxingyudidian',
      initials: 'lxydd',
      syllables: ['lv', 'xing', 'yu', 'di', 'dian']
    }
  },
  {
    input: '浅肤色',
    expected: {
      text: 'qian fu se',
      compact: 'qianfuse',
      initials: 'qfs',
      syllables: ['qian', 'fu', 'se']
    }
  },
  {
    input: '拿白手杖',
    expected: {
      text: 'na bai shou zhang',
      compact: 'nabaishouzhang',
      initials: 'nbsz',
      syllables: ['na', 'bai', 'shou', 'zhang']
    }
  }
];

describe('buildPinyinIndex', () => {
  it('returns null for non-Chinese text', () => {
    assert.strictEqual(buildPinyinIndex('hello'), null);
    assert.strictEqual(buildPinyinIndex(''), null);
    assert.strictEqual(buildPinyinIndex(null), null);
  });

  it('returns null for mixed text without Chinese characters', () => {
    assert.strictEqual(buildPinyinIndex('hello123'), null);
  });

  for (const { input, expected } of cases) {
    it(`generates correct pinyin index for "${input}"`, () => {
      const result = buildPinyinIndex(input);
      assert.notStrictEqual(result, null);
      assert.deepStrictEqual(result, expected);
    });
  }
});

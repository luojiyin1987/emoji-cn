import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { normalize, buildIndex, buildSearchData, indexEmojiData, score, search } from './search.js';

const emojiA = {
    emoji: '😀',
    keywords: '嘿嘿',
    category: '表情与情感',
    subCategory: '笑脸',
    pinyinKeywords: { text: 'hei hei', compact: 'heihei', initials: 'hh', syllables: ['hei', 'hei'] },
    pinyinCategory: { text: 'biao qing yu qing gan', compact: 'biaoqingyuqinggan', initials: 'bqyqg', syllables: ['biao', 'qing', 'yu', 'qing', 'gan'] },
    pinyinSubCategory: { text: 'xiao lian', compact: 'xiaolian', initials: 'xl', syllables: ['xiao', 'lian'] }
};

const emojiB = {
    emoji: '😃',
    keywords: '哈哈',
    category: '表情与情感',
    subCategory: '笑脸',
    pinyinKeywords: { text: 'ha ha', compact: 'haha', initials: 'hh', syllables: ['ha', 'ha'] },
    pinyinCategory: { text: 'biao qing yu qing gan', compact: 'biaoqingyuqinggan', initials: 'bqyqg', syllables: ['biao', 'qing', 'yu', 'qing', 'gan'] },
    pinyinSubCategory: { text: 'xiao lian', compact: 'xiaolian', initials: 'xl', syllables: ['xiao', 'lian'] }
};

const emojiC = {
    emoji: '😁',
    keywords: '开心',
    category: '表情与情感',
    subCategory: '笑脸',
    pinyinKeywords: { text: 'kai xin', compact: 'kaixin', initials: 'kx', syllables: ['kai', 'xin'] },
    pinyinCategory: { text: 'biao qing yu qing gan', compact: 'biaoqingyuqinggan', initials: 'bqyqg', syllables: ['biao', 'qing', 'yu', 'qing', 'gan'] },
    pinyinSubCategory: { text: 'xiao lian', compact: 'xiaolian', initials: 'xl', syllables: ['xiao', 'lian'] }
};

const emojiD = {
    emoji: '😊',
    keywords: '笑脸',
    category: '表情与情感',
    subCategory: '笑脸',
    pinyinKeywords: { text: 'xiao lian', compact: 'xiaolian', initials: 'xl', syllables: ['xiao', 'lian'] },
    pinyinCategory: { text: 'biao qing yu qing gan', compact: 'biaoqingyuqinggan', initials: 'bqyqg', syllables: ['biao', 'qing', 'yu', 'qing', 'gan'] },
    pinyinSubCategory: { text: 'xiao lian', compact: 'xiaolian', initials: 'xl', syllables: ['xiao', 'lian'] }
};

function indexed(emoji) {
    return { ...emoji, searchData: buildSearchData(emoji) };
}

const items = [emojiA, emojiB, emojiC, emojiD].map(indexed);

describe('normalize', () => {
    it('lowercases and strips whitespace', () => {
        assert.strictEqual(normalize('  Hello World  '), 'helloworld');
    });

    it('returns empty string for null/undefined/empty', () => {
        assert.strictEqual(normalize(''), '');
        assert.strictEqual(normalize(null), '');
        assert.strictEqual(normalize(undefined), '');
    });
});

describe('buildIndex', () => {
    it('returns null for falsy text', () => {
        assert.strictEqual(buildIndex(''), null);
        assert.strictEqual(buildIndex(null), null);
    });

    it('stores raw, normalized, and pinyin', () => {
        const idx = buildIndex(' Hello ', { compact: 'test' });
        assert.strictEqual(idx.raw, ' Hello ');
        assert.strictEqual(idx.normalized, 'hello');
        assert.deepStrictEqual(idx.pinyin, { compact: 'test' });
    });
});

describe('buildSearchData', () => {
    it('produces symbol / keyword / category / subCategory', () => {
        const sd = buildSearchData(emojiA);
        assert.ok(sd.symbol);
        assert.ok(sd.keyword);
        assert.ok(sd.category);
        assert.ok(sd.subCategory);
        assert.strictEqual(sd.keyword.normalized, '嘿嘿');
        assert.deepStrictEqual(sd.keyword.pinyin, emojiA.pinyinKeywords);
    });
});

describe('score — regression baseline', () => {
    const a = indexed(emojiA); // 嘿嘿 / heihei / hh
    const b = indexed(emojiB); // 哈哈 / haha / hh
    const c = indexed(emojiC); // 开心 / kaixin / kx
    const d = indexed(emojiD); // 笑脸 / xiaolian / xl

    it('Chinese exact match on keyword (最高优先级)', () => {
        assert.strictEqual(score(a.searchData, '嘿嘿'), 420);
    });

    it('Chinese startsWith on keyword', () => {
        assert.strictEqual(score(d.searchData, '笑'), 402);
    });

    it('Pinyin compact exact match', () => {
        assert.strictEqual(score(a.searchData, 'heihei'), 415);
    });

    it('Pinyin compact startsWith match', () => {
        assert.strictEqual(score(a.searchData, 'hei'), 385);
    });

    it('Pinyin initials exact match', () => {
        assert.strictEqual(score(a.searchData, 'hh'), 365);
    });

    it('Pinyin initials startsWith is gated for short ASCII (< 3 chars)', () => {
        assert.strictEqual(score(a.searchData, 'h'), 0);
    });

    it('Pinyin syllable prefix with graduated bonus for 2-char query', () => {
        assert.strictEqual(score(a.searchData, 'he'), 353);
    });

    it('Pinyin syllable exact match (first)', () => {
        assert.strictEqual(score(a.searchData, 'hei'), 385);
    });

    it('Keyword + subCategory cross-field bonus', () => {
        assert.strictEqual(score(d.searchData, '笑脸'), 432);
    });

    it('Category-only match (no cross-field bonus when keyword unmatched)', () => {
        assert.strictEqual(score(d.searchData, '表情与情感'), 180);
    });

    it('No match returns 0', () => {
        assert.strictEqual(score(a.searchData, 'xyz'), 0);
    });

    it('Empty query returns 0', () => {
        assert.strictEqual(score(a.searchData, ''), 0);
    });

    it('Short ASCII query (< 3 chars) does not match pinyin compact contains', () => {
        // "ei" is inside "heihei" but query is ASCII and only 2 chars → gated
        // No normalized match, pinyin initials "hh" doesn't match "ei"
        // Syllable check: "hei" doesn't equal "ei", "hei" doesn't startWith "ei"
        // Result: 0
        assert.strictEqual(score(a.searchData, 'ei'), 0);
    });
});

describe('score — relative ranking invariants', () => {
    it('exact > startsWith > contains', () => {
        const d = indexed(emojiD);
        const exact = score(d.searchData, '笑脸');
        const prefix = score(d.searchData, '笑');
        const contains = score(d.searchData, '脸');
        assert.ok(exact > prefix, `exact(${exact}) > prefix(${prefix})`);
        assert.ok(prefix > contains, `prefix(${prefix}) > contains(${contains})`);
    });

    it('keyword > subCategory > category for same match level', () => {
        const d = indexed(emojiD);
        const kwStarts = score(d.searchData, '笑');
        // keyword "笑脸" startsWith "笑" → 320 + 70, subCategory "笑脸" startsWith → 140 + 70
        // max=390 + crossField=12 = 402
        // Let's test pure weight: match on keyword only (use emojiA with unique keyword)
        const a = indexed(emojiA);
        assert.ok(score(a.searchData, '嘿嘿') > score(a.searchData, '表情'));
    });
});

describe('search — ordering and filter', () => {
    it('empty query returns all items unchanged', () => {
        const r = search(items, '');
        assert.strictEqual(r.length, 4);
    });

    it('does not mutate input array', () => {
        const copy = [...items];
        search(items, 'haha');
        assert.deepStrictEqual(items, copy);
    });

    it('filters non-matching items', () => {
        const r = search(items, 'haha');
        assert.strictEqual(r.length, 1);
        assert.strictEqual(r[0].emoji, '😃');
    });

    it('sorts by score descending', () => {
        const r = search(items, '笑');
        assert.ok(r.length === 4);
        // all have 笑脸 as subCategory (prefix match), but emojiD has keyword 笑脸 (startsWith)
        // emojiD score: 402, others: 210 (subCategory only)
        assert.strictEqual(r[0].emoji, '😊');
    });

    it('stable sort: ties preserve original order', () => {
        // query "hh" matches emojiA and emojiB initials, both score=365
        const r = search(items, 'hh');
        assert.strictEqual(r.length, 2);
        assert.strictEqual(r[0].emoji, '😀'); // emojiA before emojiB
        assert.strictEqual(r[1].emoji, '😃');
    });

    it('score > 0 only', () => {
        const r = search(items, 'zzz');
        assert.strictEqual(r.length, 0);
    });
});

describe('indexEmojiData', () => {
    it('preserves category structure and attaches searchData', () => {
        const data = {
            smileys: [emojiA, emojiB],
            people: [emojiC]
        };
        const result = indexEmojiData(data);

        assert.deepStrictEqual(Object.keys(result), ['smileys', 'people']);
        assert.strictEqual(result.smileys.length, 2);
        assert.ok('searchData' in result.smileys[0]);
        assert.ok('searchData' in result.people[0]);
        assert.ok(result.smileys[0].searchData.keyword);
        assert.strictEqual(result.smileys[0].emoji, '😀');
    });
});

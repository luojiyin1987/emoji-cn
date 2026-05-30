const FIELD_WEIGHT = {
    symbol: 500,
    keyword: 320,
    subCategory: 140,
    category: 80
};

const SCORE_BONUS = {
    match: 100,
    startsWith: 70,
    contains: 40,
    pinyinExact: 95,
    pinyinStartsWith: 65,
    pinyinContains: 20,
    initialsExact: 45,
    initialsStartsWith: 25,
    syllableExactFirst: 55,
    syllableExactOther: 45,
    syllablePrefixFirst: 40,
    syllablePrefixOther: 32,
    crossFieldKeyword: 20,
    crossFieldSubCategory: 12,
    crossFieldCategory: 6
};

export function normalize(text) {
    return String(text || '').toLowerCase().replace(/\s+/g, '');
}

export function buildIndex(text, pinyinData) {
    if (!text) return null;

    return {
        raw: text,
        normalized: normalize(text),
        pinyin: pinyinData || null
    };
}

export function buildSearchData(emoji) {
    return {
        symbol: buildIndex(emoji.emoji),
        keyword: buildIndex(emoji.keywords, emoji.pinyinKeywords),
        category: buildIndex(emoji.category, emoji.pinyinCategory),
        subCategory: buildIndex(emoji.subCategory, emoji.pinyinSubCategory)
    };
}

function prefixMultiplier(query) {
    if (!/^[a-z]+$/.test(query)) return 1;
    if (query.length >= 3) return 1;
    if (query.length === 2) return 0.5;
    return 0;
}

function containsMultiplier(query) {
    if (!/^[a-z]+$/.test(query)) return 1;
    if (query.length >= 3) return 1;
    return 0;
}

function scoreField(query, textIndex, weight) {
    if (!query || !textIndex) return 0;

    let max = 0;
    const { normalized, pinyin: pinyinIndex } = textIndex;
    const pfxMult = prefixMultiplier(query);
    const ctnMult = containsMultiplier(query);

    if (normalized) {
        if (normalized === query) {
            max = Math.max(max, weight + SCORE_BONUS.match);
        } else if (normalized.startsWith(query)) {
            max = Math.max(max, weight + SCORE_BONUS.startsWith);
        } else if (normalized.includes(query)) {
            max = Math.max(max, weight + SCORE_BONUS.contains);
        }
    }

    if (!pinyinIndex) return max;

    if (pinyinIndex.compact === query) {
        max = Math.max(max, weight + SCORE_BONUS.pinyinExact);
    } else if (pfxMult > 0 && pinyinIndex.compact.startsWith(query)) {
        max = Math.max(max, weight + Math.round(SCORE_BONUS.pinyinStartsWith * pfxMult));
    } else if (ctnMult > 0 && pinyinIndex.compact.includes(query)) {
        max = Math.max(max, weight + Math.round(SCORE_BONUS.pinyinContains * ctnMult));
    }

    if (query.length >= 2) {
        if (pinyinIndex.initials === query) {
            max = Math.max(max, weight + SCORE_BONUS.initialsExact);
        } else if (pfxMult > 0 && pinyinIndex.initials.startsWith(query)) {
            max = Math.max(max, weight + Math.round(SCORE_BONUS.initialsStartsWith * pfxMult));
        }
    }

    const syllableScore = pinyinIndex.syllables.reduce((best, syllable, index) => {
        if (syllable === query) {
            return Math.max(best, weight + (index === 0
                ? SCORE_BONUS.syllableExactFirst
                : SCORE_BONUS.syllableExactOther));
        }

        if (pfxMult > 0 && query.length >= 2 && syllable.startsWith(query)) {
            return Math.max(best, weight + Math.round((index === 0
                ? SCORE_BONUS.syllablePrefixFirst
                : SCORE_BONUS.syllablePrefixOther) * pfxMult));
        }

        return best;
    }, 0);

    return Math.max(max, syllableScore);
}

export function score(searchData, query) {
    if (!query) return 0;

    const symbolScore = scoreField(query, searchData.symbol, FIELD_WEIGHT.symbol);
    const keywordScore = scoreField(query, searchData.keyword, FIELD_WEIGHT.keyword);
    const subCategoryScore = scoreField(query, searchData.subCategory, FIELD_WEIGHT.subCategory);
    const categoryScore = scoreField(query, searchData.category, FIELD_WEIGHT.category);

    let total = Math.max(symbolScore, keywordScore, subCategoryScore, categoryScore);

    if (symbolScore && keywordScore) total += SCORE_BONUS.crossFieldKeyword;
    if (keywordScore && subCategoryScore) total += SCORE_BONUS.crossFieldSubCategory;
    if (keywordScore && categoryScore) total += SCORE_BONUS.crossFieldCategory;

    return total;
}

export function search(items, term) {
    const q = normalize(term);
    if (!q) return items;

    return items
        .map((item, index) => ({ item, index, score: score(item.searchData, q) }))
        .filter(({ score }) => score > 0)
        .sort((a, b) => b.score - a.score || a.index - b.index)
        .map(({ item }) => item);
}

export function indexEmojiData(data) {
    return Object.fromEntries(
        Object.entries(data).map(([category, emojis]) => [
            category,
            emojis.map(emoji => ({
                ...emoji,
                searchData: buildSearchData(emoji)
            }))
        ])
    );
}

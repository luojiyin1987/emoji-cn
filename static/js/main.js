import { emojiData } from './emoji-data.js';

document.addEventListener('DOMContentLoaded', () => {
    const emojiContainer = document.getElementById('emoji-container');
    const searchInput = document.getElementById('searchEmoji');
    const copyNotification = document.getElementById('copy-notification');
    const categoryButtons = document.querySelectorAll('.category-btn');
    const loadingIndicator = document.getElementById('loading-indicator');

    // 分页配置
    const PAGE_SIZE = 50; // 每页显示50个表情
    let currentPage = 1;
    let currentCategory = 'all';
    let currentSearchTerm = '';
    let isLoading = false;
    let hasMoreEmojis = true;
    let searchRequestId = 0;
    let pinyin = null;
    let pinyinEnabled = false;
    let pinyinLoadPromise = null;
    let searchableEmojiData = createSearchableEmojiData();
    let allEmojis = Object.values(searchableEmojiData).flat();

    function createSearchableEmojiData() {
        return Object.fromEntries(
            Object.entries(emojiData).map(([category, emojis]) => [
                category,
                emojis.map(emoji => ({
                    ...emoji,
                    searchData: buildSearchData(emoji)
                }))
            ])
        );
    }

    function refreshSearchIndex() {
        searchableEmojiData = createSearchableEmojiData();
        allEmojis = Object.values(searchableEmojiData).flat();
    }

    function normalizeSearchText(text) {
        return String(text || '').toLowerCase().replace(/\s+/g, '');
    }

    function isLikelyPinyinQuery(text) {
        return /^[a-z]+$/i.test(text);
    }

    async function ensurePinyinReady() {
        if (pinyinEnabled) return;

        if (!pinyinLoadPromise) {
            pinyinLoadPromise = import('./vendor/tiny-pinyin.js')
                .then((module) => module.default)
                .catch((error) => {
                    pinyinLoadPromise = null;
                    throw error;
                });
        }

        const loadedPinyin = await pinyinLoadPromise;
        if (!loadedPinyin || !loadedPinyin.isSupported()) return;

        pinyin = loadedPinyin;
        pinyinEnabled = true;
        refreshSearchIndex();
    }

    function buildPinyinIndex(text) {
        if (!pinyinEnabled || !text) return '';

        const pinyinText = pinyin.convertToPinyin(text, ' ', true).trim();
        if (!pinyinText) return '';

        const syllables = pinyinText.split(/\s+/).filter(Boolean);
        const compact = syllables.join('');
        const initials = syllables
            .map(part => part[0] || '')
            .join('');

        return {
            text: pinyinText,
            compact,
            initials,
            syllables
        };
    }

    function buildTextIndex(text) {
        if (!text) return null;

        return {
            raw: text,
            normalized: normalizeSearchText(text),
            pinyin: buildPinyinIndex(text)
        };
    }

    function buildSearchData(emoji) {
        return {
            symbol: buildTextIndex(emoji.emoji),
            keyword: buildTextIndex(emoji.keywords),
            category: buildTextIndex(emoji.category),
            subCategory: buildTextIndex(emoji.subCategory)
        };
    }

    function scoreTextIndex(query, textIndex, weight) {
        if (!query || !textIndex) return 0;

        let score = 0;
        const { normalized, pinyin: pinyinIndex } = textIndex;
        const isAsciiQuery = /^[a-z]+$/.test(query);
        const allowLoosePinyinPrefix = !isAsciiQuery || query.length >= 3;

        if (normalized) {
            if (normalized === query) {
                score = Math.max(score, weight + 100);
            } else if (normalized.startsWith(query)) {
                score = Math.max(score, weight + 70);
            } else if (normalized.includes(query)) {
                score = Math.max(score, weight + 40);
            }
        }

        if (!pinyinIndex) return score;

        if (pinyinIndex.compact === query) {
            score = Math.max(score, weight + 95);
        } else if (allowLoosePinyinPrefix && pinyinIndex.compact.startsWith(query)) {
            score = Math.max(score, weight + 65);
        } else if (allowLoosePinyinPrefix && pinyinIndex.compact.includes(query)) {
            score = Math.max(score, weight + 20);
        }

        if (query.length >= 2) {
            if (pinyinIndex.initials === query) {
                score = Math.max(score, weight + 60);
            } else if (allowLoosePinyinPrefix && pinyinIndex.initials.startsWith(query)) {
                score = Math.max(score, weight + 30);
            }
        }

        const syllableScore = pinyinIndex.syllables.reduce((bestScore, syllable, index) => {
            if (syllable === query) {
                return Math.max(bestScore, weight + (index === 0 ? 55 : 45));
            }

            if (allowLoosePinyinPrefix && query.length >= 2 && syllable.startsWith(query)) {
                return Math.max(bestScore, weight + (index === 0 ? 40 : 32));
            }

            return bestScore;
        }, 0);

        return Math.max(score, syllableScore);
    }

    function getSearchScore(emoji, query) {
        if (!query) return 0;

        const symbolScore = scoreTextIndex(query, emoji.searchData.symbol, 500);
        const keywordScore = scoreTextIndex(query, emoji.searchData.keyword, 320);
        const subCategoryScore = scoreTextIndex(query, emoji.searchData.subCategory, 140);
        const categoryScore = scoreTextIndex(query, emoji.searchData.category, 80);

        let score = Math.max(symbolScore, keywordScore, subCategoryScore, categoryScore);

        if (symbolScore && keywordScore) score += 20;
        if (keywordScore && subCategoryScore) score += 12;
        if (keywordScore && categoryScore) score += 6;

        return score;
    }

    function searchEmojis(emojis, searchTerm) {
        const normalizedSearchTerm = normalizeSearchText(searchTerm);
        if (!normalizedSearchTerm) return emojis;

        return emojis
            .map((emoji, index) => ({
                emoji,
                index,
                score: getSearchScore(emoji, normalizedSearchTerm)
            }))
            .filter(item => item.score > 0)
            .sort((a, b) => b.score - a.score || a.index - b.index)
            .map(item => item.emoji);
    }

    // 初始化分类按钮
    function initializeCategoryButtons() {
        categoryButtons.forEach(button => {
            button.addEventListener('click', () => {
                categoryButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                currentCategory = button.dataset.category;
                resetAndDisplay();
            });
        });
    }

    // 重置并显示
    function resetAndDisplay() {
        currentPage = 1;
        hasMoreEmojis = true;
        emojiContainer.innerHTML = '';
        displayEmojis();
    }

    // 显示表情符号
    function displayEmojis() {
        if (isLoading || !hasMoreEmojis) return;
        
        isLoading = true;
        loadingIndicator.classList.remove('hidden');

        let emojisToShow = [];

        // 获取表情数据
        if (currentCategory === 'all') {
            emojisToShow = allEmojis;
        } else {
            emojisToShow = searchableEmojiData[currentCategory] || [];
        }

        // 搜索过滤
        emojisToShow = searchEmojis(emojisToShow, currentSearchTerm);

        // 计算分页
        const startIndex = (currentPage - 1) * PAGE_SIZE;
        const endIndex = startIndex + PAGE_SIZE;
        const pageEmojis = emojisToShow.slice(startIndex, endIndex);

        // 检查是否还有更多数据
        hasMoreEmojis = endIndex < emojisToShow.length;

        // 使用 requestAnimationFrame 让浏览器有机会先渲染 loading 指示器
        requestAnimationFrame(() => {
            // 显示表情符号
            const fragment = document.createDocumentFragment();
            pageEmojis.forEach(emojiData => {
                const emojiDiv = document.createElement('div');
                emojiDiv.className = 'emoji-item';

                const emojiSpan = document.createElement('span');
                emojiSpan.className = 'emoji-char';
                emojiSpan.textContent = emojiData.emoji;

                const keywordSpan = document.createElement('span');
                keywordSpan.className = 'emoji-keyword';
                keywordSpan.textContent = emojiData.keywords;

                emojiDiv.appendChild(emojiSpan);
                emojiDiv.appendChild(keywordSpan);
                emojiDiv.dataset.emoji = emojiData.emoji;
                fragment.appendChild(emojiDiv);
            });
            emojiContainer.appendChild(fragment);

            isLoading = false;
            loadingIndicator.classList.add('hidden');

            // 如果没有更多数据，显示提示
            if (!hasMoreEmojis && currentPage > 1) {
                const endMessage = document.createElement('div');
                endMessage.className = 'end-message';
                endMessage.textContent = '已经到底啦 ~';
                emojiContainer.appendChild(endMessage);
            }
        });
    }

    // 复制表情符号（支持降级方案）
    function copyEmoji(emoji) {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(emoji).then(() => {
                onCopySuccess();
            }).catch(err => {
                console.error('Clipboard API failed: ', err);
                fallbackCopy(emoji);
            });
        } else {
            fallbackCopy(emoji);
        }
    }

    // 降级复制方案（兼容旧浏览器和 HTTP 环境）
    function fallbackCopy(text) {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.left = '-9999px';
        document.body.appendChild(textarea);
        textarea.select();
        try {
            document.execCommand('copy');
            onCopySuccess();
        } catch (err) {
            console.error('Fallback copy failed: ', err);
        }
        document.body.removeChild(textarea);
    }

    // 复制成功后的通用反馈
    function onCopySuccess() {
        showCopyNotification();
        if (navigator.vibrate) {
            navigator.vibrate(50);
        }
    }

    // 显示复制成功提示
    function showCopyNotification() {
        copyNotification.classList.remove('hidden');
        copyNotification.classList.add('show');
        
        setTimeout(() => {
            copyNotification.classList.remove('show');
            setTimeout(() => {
                copyNotification.classList.add('hidden');
            }, 300);
        }, 1000);
    }

    // 搜索功能
    let searchTimeout;
    searchInput.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        const requestId = ++searchRequestId;
        searchTimeout = setTimeout(async () => {
            const nextSearchTerm = e.target.value.trim();
            if (isLikelyPinyinQuery(nextSearchTerm)) {
                await ensurePinyinReady();
            }
            if (requestId !== searchRequestId) return;
            currentSearchTerm = nextSearchTerm;
            resetAndDisplay();
        }, 300);
    });

    // 滚动加载
    function handleScroll() {
        if (isLoading || !hasMoreEmojis) return;

        const container = document.documentElement;
        const windowHeight = window.innerHeight;
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const documentHeight = Math.max(
            document.body.scrollHeight,
            document.documentElement.scrollHeight,
            document.body.offsetHeight,
            document.documentElement.offsetHeight,
            document.body.clientHeight,
            document.documentElement.clientHeight
        );

        // 当距离底部 100px 时加载更多
        if (windowHeight + scrollTop >= documentHeight - 100) {
            currentPage++;
            displayEmojis();
        }
    }

    // 使用节流函数优化滚动事件
    function throttle(func, limit) {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        }
    }

    // 添加滚动事件监听
    window.addEventListener('scroll', throttle(handleScroll, 100));

    // 添加触摸事件监听（针对移动端）
    let touchStartY = 0;
    window.addEventListener('touchstart', (e) => {
        touchStartY = e.touches[0].pageY;
    }, { passive: true });

    window.addEventListener('touchmove', throttle((e) => {
        const touchEndY = e.touches[0].pageY;
        if (touchStartY > touchEndY) { // 向上滑动
            handleScroll();
        }
        touchStartY = touchEndY;
    }, 100), { passive: true });

    // 使用事件委托处理 emoji 点击复制
    emojiContainer.addEventListener('click', (e) => {
        const item = e.target.closest('.emoji-item');
        if (item && item.dataset.emoji) {
            copyEmoji(item.dataset.emoji);
        }
    });

    // 初始化显示
    initializeCategoryButtons();
    displayEmojis();
});

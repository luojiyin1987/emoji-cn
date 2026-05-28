import { emojiData } from './emoji-data.js';
import { indexEmojiData, search } from './search.js';

document.addEventListener('DOMContentLoaded', () => {
    const emojiContainer = document.getElementById('emoji-container');
    const searchInput = document.getElementById('searchEmoji');
    const copyNotification = document.getElementById('copy-notification');
    const categoryButtons = document.querySelectorAll('.category-btn');
    const loadingIndicator = document.getElementById('loading-indicator');

    const PAGE_SIZE = 50;
    let currentPage = 1;
    let currentCategory = 'all';
    let currentSearchTerm = '';
    let isLoading = false;
    let hasMoreEmojis = true;
    let searchRequestId = 0;
    const searchableEmojiData = indexEmojiData(emojiData);
    const allEmojis = Object.values(searchableEmojiData).flat();

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

    function resetAndDisplay() {
        currentPage = 1;
        hasMoreEmojis = true;
        emojiContainer.innerHTML = '';
        displayEmojis();
    }

    function displayEmojis() {
        if (isLoading || !hasMoreEmojis) return;

        isLoading = true;
        loadingIndicator.classList.remove('hidden');

        let emojisToShow = [];

        if (currentCategory === 'all') {
            emojisToShow = allEmojis;
        } else {
            emojisToShow = searchableEmojiData[currentCategory] || [];
        }

        emojisToShow = search(emojisToShow, currentSearchTerm);

        const startIndex = (currentPage - 1) * PAGE_SIZE;
        const endIndex = startIndex + PAGE_SIZE;
        const pageEmojis = emojisToShow.slice(startIndex, endIndex);

        hasMoreEmojis = endIndex < emojisToShow.length;

        requestAnimationFrame(() => {
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

            if (!hasMoreEmojis && currentPage > 1) {
                const endMessage = document.createElement('div');
                endMessage.className = 'end-message';
                endMessage.textContent = '已经到底啦 ~';
                emojiContainer.appendChild(endMessage);
            }
        });
    }

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

    function onCopySuccess() {
        showCopyNotification();
        if (navigator.vibrate) {
            navigator.vibrate(50);
        }
    }

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

    let searchTimeout;
    searchInput.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        const requestId = ++searchRequestId;
        searchTimeout = setTimeout(() => {
            const nextSearchTerm = e.target.value.trim();
            if (requestId !== searchRequestId) return;
            currentSearchTerm = nextSearchTerm;
            resetAndDisplay();
        }, 300);
    });

    function handleScroll() {
        if (isLoading || !hasMoreEmojis) return;

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

        if (windowHeight + scrollTop >= documentHeight - 100) {
            currentPage++;
            displayEmojis();
        }
    }

    function throttle(func, limit) {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func(...args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    window.addEventListener('scroll', throttle(handleScroll, 100));

    let touchStartY = 0;
    window.addEventListener('touchstart', (e) => {
        touchStartY = e.touches[0].pageY;
    }, { passive: true });

    window.addEventListener('touchmove', throttle((e) => {
        const touchEndY = e.touches[0].pageY;
        if (touchStartY > touchEndY) {
            handleScroll();
        }
        touchStartY = touchEndY;
    }, 100), { passive: true });

    emojiContainer.addEventListener('click', (e) => {
        const item = e.target.closest('.emoji-item');
        if (item && item.dataset.emoji) {
            copyEmoji(item.dataset.emoji);
        }
    });

    initializeCategoryButtons();
    displayEmojis();
});

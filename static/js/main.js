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
            emojisToShow = Object.values(emojiData).flat();
        } else {
            emojisToShow = emojiData[currentCategory] || [];
        }

        // 搜索过滤
        if (currentSearchTerm) {
            emojisToShow = emojisToShow.filter(emoji => 
                emoji.keywords.toLowerCase().includes(currentSearchTerm.toLowerCase()) ||
                emoji.category.toLowerCase().includes(currentSearchTerm.toLowerCase()) ||
                (emoji.subCategory && emoji.subCategory.toLowerCase().includes(currentSearchTerm.toLowerCase()))
            );
        }

        // 计算分页
        const startIndex = (currentPage - 1) * PAGE_SIZE;
        const endIndex = startIndex + PAGE_SIZE;
        const pageEmojis = emojisToShow.slice(startIndex, endIndex);

        // 检查是否还有更多数据
        hasMoreEmojis = endIndex < emojisToShow.length;

        // 使用 setTimeout 来模拟加载延迟，让加载动画更明显
        setTimeout(() => {
            // 显示表情符号
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
                emojiDiv.addEventListener('click', () => copyEmoji(emojiData.emoji));
                emojiContainer.appendChild(emojiDiv);
            });

            isLoading = false;
            loadingIndicator.classList.add('hidden');

            // 如果没有更多数据，显示提示
            if (!hasMoreEmojis && currentPage > 1) {
                const endMessage = document.createElement('div');
                endMessage.className = 'end-message';
                endMessage.textContent = '已经到底啦 ~';
                emojiContainer.appendChild(endMessage);
            }
        }, 300);
    }

    // 复制表情符号
    function copyEmoji(emoji) {
        navigator.clipboard.writeText(emoji).then(() => {
            showCopyNotification();
        }).catch(err => {
            console.error('Failed to copy: ', err);
        });
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
        searchTimeout = setTimeout(() => {
            currentSearchTerm = e.target.value.trim();
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

    // 初始化显示
    initializeCategoryButtons();
    displayEmojis();
});

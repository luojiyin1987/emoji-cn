document.addEventListener('DOMContentLoaded', () => {
    const emojiContainer = document.getElementById('emoji-container');
    const searchInput = document.getElementById('searchEmoji');
    const copyNotification = document.getElementById('copy-notification');
    const categoryButtons = document.querySelectorAll('.category-btn');

    // 初始化类别按钮
    function initializeCategoryButtons() {
        const categories = {
            'all': '全部',
            'smileys': '表情与情感',
            'people': '人物',
            'animals': '动物与自然',
            'food': '食物与饮料',
            'activities': '活动',
            'travel': '旅行与地点',
            'objects': '物品',
            'symbols': '符号'
        };

        // 更新现有按钮的data-category属性
        document.querySelectorAll('.category-btn').forEach(button => {
            const categoryKey = button.getAttribute('data-category');
            if (categories[categoryKey]) {
                button.textContent = categories[categoryKey];
            }
        });

        // 绑定事件监听器
        document.querySelectorAll('.category-btn').forEach(button => {
            button.addEventListener('click', () => {
                document.querySelectorAll('.category-btn').forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                button.classList.add('clicked');
                setTimeout(() => button.classList.remove('clicked'), 200);
                displayEmojis(button.dataset.category, searchInput.value.trim());
            });
        });
    }

    function displayEmojis(category = 'all', searchTerm = '') {
        emojiContainer.innerHTML = '';
        
        // 移除旧的搜索结果计数
        const oldResultCount = document.querySelector('.result-count');
        if (oldResultCount) {
            oldResultCount.remove();
        }
        
        let displayedCount = 0;
        const searchTermLower = searchTerm.toLowerCase();
        
        // 处理所有类别或特定类别
        Object.entries(emojiData).forEach(([categoryKey, emojis]) => {
            if (category === 'all' || category === categoryKey) {
                emojis.forEach(item => {
                    // 搜索匹配：检查emoji字符、关键词和类别
                    if (!searchTerm || 
                        item.emoji.includes(searchTerm) ||
                        item.keywords.toLowerCase().includes(searchTermLower) ||
                        item.category.toLowerCase().includes(searchTermLower)) {
                        
                        const div = document.createElement('div');
                        div.className = 'emoji-item';
                        
                        // 创建emoji显示区域
                        const emojiSpan = document.createElement('span');
                        emojiSpan.className = 'emoji';
                        emojiSpan.textContent = item.emoji;
                        div.appendChild(emojiSpan);
                        
                        // 创建关键词显示区域
                        const keywordsDiv = document.createElement('div');
                        keywordsDiv.className = 'keywords';
                        // 只显示前两个中文关键词
                        const chineseKeywords = item.keywords.split(' ')
                            .filter(k => /[\u4e00-\u9fa5]/.test(k))
                            .slice(0, 2)
                            .join('、');
                        keywordsDiv.textContent = chineseKeywords;
                        div.appendChild(keywordsDiv);
                        
                        // 添加悬停提示（显示所有关键词和类别）
                        div.title = `${item.category}\n${item.keywords}`;
                        
                        // 点击复制功能
                        div.onclick = () => copyEmoji(item.emoji);
                        
                        // 添加动画延迟
                        div.style.animationDelay = `${displayedCount * 30}ms`;
                        
                        emojiContainer.appendChild(div);
                        displayedCount++;
                    }
                });
            }
        });

        // 显示搜索结果数量
        const resultCount = document.createElement('div');
        resultCount.className = 'result-count';
        resultCount.textContent = `找到 ${displayedCount} 个表情符号`;
        emojiContainer.insertAdjacentElement('beforebegin', resultCount);
    }

    function copyEmoji(emoji) {
        navigator.clipboard.writeText(emoji).then(() => {
            showCopyNotification();
        }).catch(err => {
            console.error('复制失败:', err);
            // 使用备用复制方法
            const textArea = document.createElement('textarea');
            textArea.value = emoji;
            document.body.appendChild(textArea);
            textArea.select();
            try {
                document.execCommand('copy');
                showCopyNotification();
            } catch (e) {
                console.error('备用复制方法也失败:', e);
            }
            document.body.removeChild(textArea);
        });
    }

    function showCopyNotification() {
        copyNotification.textContent = '已复制到剪贴板！';
        copyNotification.classList.remove('hidden');
        copyNotification.classList.add('show');
        
        setTimeout(() => {
            copyNotification.classList.remove('show');
            copyNotification.classList.add('hidden');
        }, 2000);
    }

    // 搜索功能
    let searchTimeout;
    searchInput.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        const searchTerm = e.target.value.trim();
        
        // 添加搜索提示
        if (searchTerm.length > 0) {
            searchInput.classList.add('searching');
        } else {
            searchInput.classList.remove('searching');
        }
        
        // 使用防抖来优化搜索性能
        searchTimeout = setTimeout(() => {
            const activeCategory = document.querySelector('.category-btn.active').dataset.category;
            displayEmojis(activeCategory, searchTerm);
        }, 500);
    });

    // 初始化类别按钮并显示所有表情符号
    initializeCategoryButtons();
    displayEmojis();
});

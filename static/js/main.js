document.addEventListener('DOMContentLoaded', () => {
    const emojiContainer = document.getElementById('emoji-container');
    const searchInput = document.getElementById('searchEmoji');
    const copyNotification = document.getElementById('copy-notification');
    const categoryButtons = document.querySelectorAll('.category-btn');

    // 当前选中的类别和子类别
    let currentCategory = 'all';
    let currentSubCategory = 'all';

    // 初始化类别按钮
    function initializeCategoryButtons() {
        categoryButtons.forEach(button => {
            button.addEventListener('click', () => {
                categoryButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                currentCategory = button.dataset.category;
                displayEmojis(currentCategory, searchInput.value.trim());
            });
        });
    }

    // 创建子类别过滤器
    function createSubCategoryFilter(category) {
        const subCategories = new Set();
        
        // 收集所有子类别
        if (category === 'all') {
            Object.values(emojiData).forEach(categoryEmojis => {
                categoryEmojis.forEach(emoji => {
                    if (emoji.subCategory) {
                        subCategories.add(emoji.subCategory);
                    }
                });
            });
        } else if (emojiData[category]) {
            emojiData[category].forEach(emoji => {
                if (emoji.subCategory) {
                    subCategories.add(emoji.subCategory);
                }
            });
        }

        // 创建子类别过滤器UI
        const subCategoryFilter = document.getElementById('subcategory-filter') || document.createElement('div');
        subCategoryFilter.id = 'subcategory-filter';
        subCategoryFilter.className = 'subcategory-filter';
        subCategoryFilter.innerHTML = ''; // 清空现有内容
        
        // 添加"全部"选项
        const allOption = document.createElement('button');
        allOption.textContent = '全部';
        allOption.className = 'subcategory-btn' + (currentSubCategory === 'all' ? ' active' : '');
        allOption.addEventListener('click', () => {
            document.querySelectorAll('.subcategory-btn').forEach(btn => btn.classList.remove('active'));
            allOption.classList.add('active');
            currentSubCategory = 'all';
            displayEmojis(currentCategory, searchInput.value.trim());
        });
        subCategoryFilter.appendChild(allOption);
        
        // 添加其他子类别选项
        Array.from(subCategories).sort().forEach(subCategory => {
            const button = document.createElement('button');
            const displayName = SUBCATEGORY_MAP[subCategory] || subCategory; // 使用中文名称
            button.textContent = displayName;
            button.className = 'subcategory-btn' + (currentSubCategory === subCategory ? ' active' : '');
            button.addEventListener('click', () => {
                document.querySelectorAll('.subcategory-btn').forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                currentSubCategory = subCategory;
                displayEmojis(currentCategory, searchInput.value.trim());
            });
            subCategoryFilter.appendChild(button);
        });

        // 如果过滤器还没有添加到页面，添加它
        const categoriesDiv = document.querySelector('.categories');
        if (!document.getElementById('subcategory-filter')) {
            categoriesDiv.after(subCategoryFilter);
        }
    }

    // 显示表情符号
    function displayEmojis(category = 'all', searchTerm = '') {
        emojiContainer.innerHTML = '';
        let filteredEmojis = [];
        
        // 根据类别筛选
        if (category === 'all') {
            filteredEmojis = Object.values(emojiData).flat();
        } else if (emojiData[category]) {
            filteredEmojis = emojiData[category];
        }

        // 根据子类别筛选
        if (currentSubCategory !== 'all') {
            filteredEmojis = filteredEmojis.filter(emoji => emoji.subCategory === currentSubCategory);
        }

        // 搜索筛选
        if (searchTerm) {
            const searchLower = searchTerm.toLowerCase();
            filteredEmojis = filteredEmojis.filter(emoji => {
                const keywords = emoji.keywords.toLowerCase();
                return keywords.includes(searchLower);
            });
        }

        // 创建并显示表情符号元素
        filteredEmojis.forEach(emoji => {
            const emojiElement = document.createElement('div');
            emojiElement.className = 'emoji-item';
            
            // 主要表情符号
            const emojiSymbol = document.createElement('span');
            emojiSymbol.className = 'emoji-symbol';
            emojiSymbol.textContent = emoji.emoji;
            emojiElement.appendChild(emojiSymbol);
            
            // 关键词信息
            const keywordInfo = document.createElement('div');
            keywordInfo.className = 'emoji-info';
            
            // 获取中文描述
            const chineseDesc = emoji.keywords.split(' ')
                .find(word => /[\u4e00-\u9fa5]/.test(word)) || // 查找中文词
                emoji.keywords.split(' ').slice(2).join(' '); // 如果没有中文，使用英文描述
            
            keywordInfo.textContent = chineseDesc;
            emojiElement.appendChild(keywordInfo);
            
            // 点击复制功能
            emojiElement.addEventListener('click', () => {
                copyEmoji(emoji.emoji);
            });
            
            emojiContainer.appendChild(emojiElement);
        });

        updateResultCount(filteredEmojis.length, searchTerm);
        
        // 更新子类别过滤器
        createSubCategoryFilter(category);
    }

    // 更新结果计数
    function updateResultCount(count, searchTerm) {
        const resultCount = document.createElement('div');
        resultCount.className = 'result-count';
        resultCount.textContent = searchTerm 
            ? `找到 ${count} 个匹配的表情符号` 
            : `共显示 ${count} 个表情符号`;
        
        const oldResultCount = document.querySelector('.result-count');
        if (oldResultCount) {
            oldResultCount.replaceWith(resultCount);
        } else {
            document.querySelector('.search-container').appendChild(resultCount);
        }
    }

    // 复制表情符号
    async function copyEmoji(emoji) {
        try {
            await navigator.clipboard.writeText(emoji);
            showCopyNotification();
        } catch (err) {
            // 回退方案
            const textArea = document.createElement('textarea');
            textArea.value = emoji;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            showCopyNotification();
        }
    }

    // 显示复制成功提示
    function showCopyNotification() {
        copyNotification.classList.remove('hidden');
        copyNotification.classList.add('show');
        setTimeout(() => {
            copyNotification.classList.remove('show');
            copyNotification.classList.add('hidden');
        }, 1000);
    }

    // 搜索功能
    let searchTimeout;
    searchInput.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            const searchTerm = e.target.value.trim();
            displayEmojis(currentCategory, searchTerm);
        }, 300);
    });

    // 初始化
    initializeCategoryButtons();
    displayEmojis('all');
});

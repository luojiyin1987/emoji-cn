document.addEventListener('DOMContentLoaded', () => {
    const emojiContainer = document.getElementById('emoji-container');
    const searchInput = document.getElementById('searchEmoji');
    const copyNotification = document.getElementById('copy-notification');
    const categoryButtons = document.querySelectorAll('.category-btn');

    // 分页配置
    const PAGE_SIZE = 50; // 每页显示50个表情
    let currentPage = 1;
    let isLoading = false;
    let allEmojis = []; // 存储所有过滤后的表情

    // 当前选中的类别和子类别
    let currentCategory = 'all';
    let currentSubCategory = 'all';

    // 子类别映射
    const SUBCATEGORY_MAP = {
        'face-smiling': '笑脸',
        'face-affection': '爱心脸',
        'face-tongue': '吐舌头',
        'face-hand': '捂脸',
        'face-neutral-skeptical': '中性脸',
        'face-sleepy': '困脸',
        'face-unwell': '不适',
        'face-hat': '帽子脸',
        'face-glasses': '眼镜脸',
        'face-concerned': '担心',
        'face-negative': '消极',
        'face-costume': '装扮',
        'cat-face': '猫脸',
        'monkey-face': '猴脸',
        'heart': '心形',
        'emotion': '情感',

        'hand-fingers-open': '张开手指',
        'hand-fingers-partial': '部分手指',
        'hand-single-finger': '单个手指',
        'hand-fingers-closed': '闭合手指',
        'hands': '手',
        'body-parts': '身体部位',
        'person': '人物',
        'person-gesture': '人物手势',
        'person-role': '人物角色',
        'person-fantasy': '幻想人物',
        'person-activity': '人物活动',
        'person-sport': '运动人物',
        'person-resting': '休息人物',
        'family': '家庭',

        'animal-mammal': '哺乳动物',
        'animal-bird': '鸟类',
        'animal-amphibian': '两栖动物',
        'animal-reptile': '爬行动物',
        'animal-marine': '海洋动物',
        'animal-bug': '昆虫',
        'plant-flower': '花',
        'plant-other': '其他植物',

        'food-fruit': '水果',
        'food-vegetable': '蔬菜',
        'food-prepared': '熟食',
        'food-asian': '亚洲食物',
        'food-marine': '海鲜',
        'food-sweet': '甜点',
        'drink': '饮品',
        'dishware': '餐具',

        'place-map': '地图',
        'place-geographic': '地理位置',
        'place-building': '建筑',
        'place-religious': '宗教场所',
        'place-other': '其他地点',
        'transport-ground': '陆地交通',
        'transport-water': '水上交通',
        'transport-air': '空中交通',
        'hotel': '酒店',
        'time': '时间',
        'sky-weather': '天气',

        'event': '事件',
        'award-medal': '奖牌',
        'sport': '运动',
        'game': '游戏',
        'arts-crafts': '艺术',

        'clothing': '服装',
        'sound': '声音',
        'music': '音乐',
        'musical-instrument': '乐器',
        'phone': '电话',
        'computer': '电脑',
        'light-video': '灯光视频',
        'book-paper': '书籍纸张',
        'money': '钱',
        'mail': '邮件',
        'writing': '书写',
        'office': '办公',
        'lock': '锁',
        'tool': '工具',
        'science': '科学',
        'medical': '医疗',
        'household': '家居',
        'other-object': '其他物品',

        'transport-sign': '交通标志',
        'warning': '警告',
        'arrow': '箭头',
        'religion': '宗教',
        'zodiac': '星座',
        'av-symbol': '视听符号',
        'gender': '性别',
        'math': '数学',
        'punctuation': '标点',
        'currency': '货币',
        'other-symbol': '其他符号',
        'keycap': '按键',
        'alphanum': '字母数字',
        'geometric': '几何',
    };

    // 初始化类别按钮
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
        emojiContainer.innerHTML = '';
        displayEmojis(currentCategory, searchInput.value.trim());
    }

    // 创建子类别过滤器
    function createSubCategoryFilter(category) {
        const subCategories = new Set();
        
        // 收集所有子类别
        if (category === 'all') {
            Object.values(emojiData).forEach(categoryEmojis => {
                if (Array.isArray(categoryEmojis)) {
                    categoryEmojis.forEach(emoji => {
                        if (emoji.subCategory) {
                            subCategories.add(emoji.subCategory);
                        }
                    });
                }
            });
        } else if (emojiData[category]) {
            emojiData[category].forEach(emoji => {
                if (emoji.subCategory) {
                    subCategories.add(emoji.subCategory);
                }
            });
        }
        
        // 获取子类别过滤器容器
        const subCategoryFilter = document.getElementById('subcategory-filter') || document.createElement('div');
        subCategoryFilter.id = 'subcategory-filter';
        subCategoryFilter.innerHTML = '';
        
        // 创建"全部"按钮
        const allButton = document.createElement('button');
        allButton.textContent = '全部';
        allButton.className = 'subcategory-btn' + (currentSubCategory === 'all' ? ' active' : '');
        allButton.addEventListener('click', () => {
            document.querySelectorAll('.subcategory-btn').forEach(btn => btn.classList.remove('active'));
            allButton.classList.add('active');
            currentSubCategory = 'all';
            resetAndDisplay();
        });
        subCategoryFilter.appendChild(allButton);
        
        // 创建子类别按钮
        Array.from(subCategories).sort().forEach(subCategory => {
            const button = document.createElement('button');
            button.textContent = SUBCATEGORY_MAP[subCategory] || subCategory;
            button.className = 'subcategory-btn' + (currentSubCategory === subCategory ? ' active' : '');
            button.addEventListener('click', () => {
                document.querySelectorAll('.subcategory-btn').forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                currentSubCategory = subCategory;
                resetAndDisplay();
            });
            subCategoryFilter.appendChild(button);
        });
        
        // 将子类别过滤器添加到类别按钮下方
        const categoriesContainer = document.querySelector('.categories');
        if (!document.getElementById('subcategory-filter')) {
            categoriesContainer.insertAdjacentElement('afterend', subCategoryFilter);
        }
    }

    // 显示表情符号
    function displayEmojis(category = 'all', searchTerm = '') {
        if (isLoading) return;
        isLoading = true;

        // 如果是第一页，重新过滤所有表情
        if (currentPage === 1) {
            // 根据类别筛选
            if (category === 'all') {
                allEmojis = [];
                Object.values(emojiData).forEach(categoryEmojis => {
                    if (Array.isArray(categoryEmojis)) {
                        allEmojis = allEmojis.concat(categoryEmojis);
                    }
                });
            } else if (emojiData[category]) {
                allEmojis = emojiData[category];
            }

            // 根据子类别筛选
            if (currentSubCategory !== 'all') {
                allEmojis = allEmojis.filter(emoji => emoji.subCategory === currentSubCategory);
            }

            // 搜索筛选
            if (searchTerm) {
                const searchLower = searchTerm.toLowerCase();
                allEmojis = allEmojis.filter(emoji => {
                    const keywords = emoji.keywords.toLowerCase();
                    return keywords.includes(searchLower);
                });
            }

            updateResultCount(allEmojis.length, searchTerm);
            createSubCategoryFilter(category);
        }

        // 计算当前页的表情范围
        const start = (currentPage - 1) * PAGE_SIZE;
        const end = start + PAGE_SIZE;
        const pageEmojis = allEmojis.slice(start, end);

        // 创建并显示表情符号元素
        pageEmojis.forEach(emoji => {
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
            keywordInfo.textContent = emoji.keywords;
            emojiElement.appendChild(keywordInfo);
            
            // 点击复制功能
            emojiElement.addEventListener('click', () => {
                copyEmoji(emoji.emoji);
            });
            
            emojiContainer.appendChild(emojiElement);
        });

        isLoading = false;
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
            resetAndDisplay();
        }, 300);
    });

    // 滚动加载
    window.addEventListener('scroll', () => {
        if (isLoading) return;

        const { scrollTop, clientHeight, scrollHeight } = document.documentElement;
        if (scrollTop + clientHeight >= scrollHeight - 100) {
            if (currentPage * PAGE_SIZE < allEmojis.length) {
                currentPage++;
                displayEmojis(currentCategory, searchInput.value.trim());
            }
        }
    });

    // 初始化
    initializeCategoryButtons();
    displayEmojis('all');
});

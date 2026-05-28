const fs = require('fs');
const path = require('path');
const axios = require('axios');

const OUTPUT_FILE = path.join(__dirname, '../static/js/emoji-data.js');
const UNICODE_URL = 'https://unicode.org/Public/emoji/latest/emoji-test.txt';
const CLDR_ZH_URL = 'https://raw.githubusercontent.com/unicode-org/cldr/main/common/annotations/zh.xml';

const chineseAnnotations = new Map();

const englishToChinese = {
    'smiling face': '笑脸',
    'grinning face': '咧嘴笑脸',
    'face with tears of joy': '笑哭',
    'rolling on the floor laughing': '笑得在地上打滚',
    'face with hand over mouth': '捂嘴',
    'face savoring food': '馋嘴',
    'winking face': '眨眼',
    'smiling face with smiling eyes': '眯眼笑',
    'smiling face with halo': '天使笑脸',
    'smiling face with hearts': '爱心笑脸',
    'smiling face with heart-eyes': '爱心眼',
    'star-struck': '星星眼',
    'face blowing a kiss': '飞吻',
    'kissing face': '亲吻',
    'smiling face with tear': '破涕为笑',
    'face with tongue': '吐舌',
    'winking face with tongue': '眨眼吐舌',
    'zany face': '疯狂',
    'squinting face with tongue': '眯眼吐舌',
    'money-mouth face': '财迷',
    'smiling face with open hands': '笑脸张开双手',
    'thinking face': '思考',
    'zipper-mouth face': '拉链嘴',
    'face with raised eyebrow': '挑眉',
    'neutral face': '中性表情',
    'expressionless face': '面无表情',
    'face without mouth': '无嘴脸',
    'face in clouds': '云里雾里',
    'smirking face': '得意',
    'unamused face': '不爽',
    'face with rolling eyes': '翻白眼',
    'grimacing face': '扭曲',
    'lying face': '说谎',
    'relieved face': '如释重负',
    'pensive face': '沉思',
    'sleepy face': '困',
    'drooling face': '流口水',
    'sleeping face': '睡觉',
    'face with medical mask': '戴口罩',
    'face with thermometer': '发烧',
    'face with head-bandage': '受伤',
    'nauseated face': '恶心',
    'face vomiting': '呕吐',
    'sneezing face': '打喷嚏',
    'hot face': '热',
    'cold face': '冷',
    'woozy face': '晕',
    'face with crossed-out eyes': '晕厥',
    'face with exploding head': '头炸了',
    'face with monocle': '戴单片眼镜',
    'confused face': '困惑',
    'worried face': '担心',
    'slightly frowning face': '轻皱眉',
    'frowning face': '皱眉',
    'face with open mouth': '张嘴',
    'hushed face': '安静',
    'astonished face': '惊讶',
    'flushed face': '脸红',
    'pleading face': '恳求',
    'face holding back tears': '忍住眼泪',
    'crying face': '哭泣',
    'loudly crying face': '大哭',
    'face screaming in fear': '尖叫',
    'fearful face': '害怕',
    'anxious face with sweat': '焦虑出汗',
    'sad but relieved face': '如释重负的悲伤',
    'downcast face with sweat': '沮丧出汗',
    'hugging face': '拥抱',
    'face with steam from nose': '生气',
    'pouting face': '噘嘴',
    'angry face': '生气',
    'face with symbols on mouth': '脏话',
    'smiling face with horns': '笑脸恶魔',
    'angry face with horns': '生气恶魔',
    'skull': '骷髅',
    'pile of poo': '便便',
    'clown face': '小丑',
    'ogre': '怪物',
    'goblin': '妖精',
    'ghost': '鬼魂',
    'alien': '外星人',
    'robot': '机器人',
    'cat face': '猫脸',
    'cat': '猫',
    'dog face': '狗脸',
    'dog': '狗',
    'mouse face': '老鼠脸',
    'mouse': '老鼠',
    'hamster': '仓鼠',
    'rabbit face': '兔子脸',
    'rabbit': '兔子',
    'fox': '狐狸',
    'bear': '熊',
    'panda': '熊猫',
    'koala': '考拉',
    'tiger face': '老虎脸',
    'tiger': '老虎',
    'lion': '狮子',
    'cow face': '牛脸',
    'cow': '牛',
    'pig face': '猪脸',
    'pig': '猪',
    'boar': '野猪',
    'monkey face': '猴子脸',
    'monkey': '猴子',
    'see-no-evil monkey': '非礼勿视猴子',
    'hear-no-evil monkey': '非礼勿听猴子',
    'speak-no-evil monkey': '非礼勿言猴子'
};

const skinToneMap = {
    'light skin tone': '浅肤色',
    'medium-light skin tone': '中浅肤色',
    'medium skin tone': '中等肤色',
    'medium-dark skin tone': '中深肤色',
    'dark skin tone': '深肤色'
};

const genderMap = {
    'man': '男性',
    'woman': '女性',
    'person': '人',
    'people': '人们',
    'baby': '婴儿',
    'child': '儿童',
    'boy': '男孩',
    'girl': '女孩'
};

const actionMap = {
    'holding hands': '牵手',
    'walking': '走路',
    'running': '跑步',
    'standing': '站立',
    'kneeling': '跪着',
    'sitting': '坐着',
    'facing right': '向右',
    'facing left': '向左',
    'bouncing ball': '拍球',
    'lifting weights': '举重',
    'biking': '骑自行车',
    'surfing': '冲浪',
    'swimming': '游泳',
    'dancing': '跳舞',
    'bowing': '鞠躬',
    'tipping hand': '伸手',
    'raising hand': '举手',
    'pouting': '撅嘴',
    'frowning': '皱眉',
    'gesturing': '做手势',
    'getting massage': '按摩',
    'getting haircut': '理发',
    'juggling': '杂耍',
    'cartwheeling': '侧手翻',
    'rowing boat': '划船',
    'in steamy room': '在蒸汽房',
    'in lotus position': '盘腿而坐'
};

const roleMap = {
    'police officer': '警察',
    'guard': '守卫',
    'construction worker': '建筑工人',
    'prince': '王子',
    'princess': '公主',
    'fairy': '仙子',
    'vampire': '吸血鬼',
    'mermaid': '美人鱼',
    'merman': '人鱼',
    'elf': '精灵',
    'genie': '精灵',
    'zombie': '僵尸',
    'superhero': '超级英雄',
    'supervillain': '超级反派',
    'health worker': '医护人员',
    'student': '学生',
    'teacher': '老师',
    'judge': '法官',
    'farmer': '农民',
    'cook': '厨师',
    'mechanic': '机械师',
    'factory worker': '工厂工人',
    'office worker': '办公室职员',
    'scientist': '科学家',
    'technologist': '技术人员',
    'singer': '歌手',
    'artist': '艺术家',
    'pilot': '飞行员',
    'astronaut': '宇航员',
    'firefighter': '消防员',
    'with veil': '戴面纱',
    'with headscarf': '戴头巾',
    'with white cane': '拿白手杖',
    'in motorized wheelchair': '坐电动轮椅',
    'in manual wheelchair': '坐手动轮椅',
    'pregnant': '孕'
};

const subCategoryFallback = {
    'hand-fingers-open': '张开手指',
    'hand-fingers-partial': '手指手势',
    'hand-single-finger': '单指手势',
    'hand-fingers-closed': '握拳',
    'hands': '双手手势',
    'body-parts': '身体部位',
    'person': '人物',
    'person-gesture': '人物手势',
    'person-role': '职业角色',
    'person-fantasy': '幻想角色',
    'person-activity': '人物活动',
    'person-sport': '运动人物',
    'person-resting': '休息',
    'family': '家庭'
};

function hasEnglish(text) {
    return /[a-zA-Z]/.test(text);
}

function escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function translateWithWordBoundary(text, map) {
    let result = text;
    for (const [eng, chn] of Object.entries(map)) {
        const regex = new RegExp(`\\b${escapeRegex(eng)}\\b`, 'gi');
        result = result.replace(regex, chn);
    }
    return result;
}

function cleanupKeywords(text) {
    return text
        .split(/\s+/)
        .filter((word) => {
            if (/^E\d+\.\d+$/.test(word)) return false;
            if (/^[➡👨👩🧑🏻🏼🏽🏾🏿]/.test(word)) return false;
            return true;
        })
        .join(' ');
}

function translateSkinTone(text) {
    let result = text;
    for (const [eng, chn] of Object.entries(skinToneMap)) {
        result = result.replace(new RegExp(escapeRegex(eng), 'gi'), chn);
    }
    return result;
}

function translateKeywords(englishDesc, subCategory) {
    let text = cleanupKeywords(englishDesc.toLowerCase().trim());

    text = translateSkinTone(text);
    text = translateWithWordBoundary(text, genderMap);

    for (const [eng, chn] of Object.entries(actionMap)) {
        text = text.replace(new RegExp(escapeRegex(eng), 'gi'), chn);
    }

    for (const [eng, chn] of Object.entries(roleMap)) {
        text = text.replace(new RegExp(escapeRegex(eng), 'gi'), chn);
    }

    if (!hasEnglish(text)) return text;

    for (const [key, fallback] of Object.entries(subCategoryFallback)) {
        if (subCategory && subCategory.includes(key)) {
            return fallback;
        }
    }

    return text;
}

function getChineseDescription(emoji, englishDescription, subCategory) {
    const annotation = chineseAnnotations.get(emoji);
    if (annotation) {
        const desc = annotation.tts || annotation.keywords.join('、');
        if (desc) return desc;
    }

    const normalized = englishDescription.toLowerCase().trim();
    if (englishToChinese[normalized]) {
        return englishToChinese[normalized];
    }

    for (const [eng, chn] of Object.entries(englishToChinese)) {
        if (normalized.includes(eng)) {
            return chn;
        }
    }

    return translateKeywords(englishDescription, subCategory || '');
}

async function fetchUnicodeData() {
    try {
        console.log('Fetching Unicode emoji data...');
        const response = await axios.get(UNICODE_URL);
        return response.data;
    } catch (error) {
        console.error('Error fetching Unicode data:', error);
        return null;
    }
}

async function fetchChineseAnnotations() {
    try {
        console.log('Fetching Chinese annotations...');
        const response = await axios.get(CLDR_ZH_URL);
        const xml = response.data;

        const annotationRegex = /<annotation cp="([^"]+)"(?:\s+type="tts")?>(.*?)<\/annotation>/g;
        let match;

        while ((match = annotationRegex.exec(xml)) !== null) {
            const [_, emoji, description] = match;

            if (!chineseAnnotations.has(emoji)) {
                chineseAnnotations.set(emoji, {
                    tts: '',
                    keywords: []
                });
            }

            const entry = chineseAnnotations.get(emoji);
            if (match[0].includes('type="tts"')) {
                entry.tts = description;
            } else {
                entry.keywords = description.split('|').map((k) => k.trim());
            }
        }

        console.log(`Loaded ${chineseAnnotations.size} Chinese annotations`);
    } catch (error) {
        console.error('Error fetching Chinese annotations:', error);
    }
}

async function processUnicodeData(data) {
    if (!data) {
        console.error('No Unicode data provided');
        return null;
    }

    const emojiData = {
        smileys: [],
        people: [],
        nature: [],
        food: [],
        activities: [],
        travel: [],
        objects: [],
        symbols: []
    };

    const lines = data.split('\n');
    let currentGroup = '';
    let currentSubGroup = '';

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (!line || line.trim() === '') continue;

        if (line.startsWith('# group:')) {
            currentGroup = line.replace('# group:', '').trim();
            continue;
        }

        if (line.startsWith('# subgroup:')) {
            currentSubGroup = line.replace('# subgroup:', '').trim();
            continue;
        }

        if (line.includes('; fully-qualified')) {
            try {
                const parts = line.split(';');
                if (parts.length < 2) continue;

                const codePointPart = parts[0].trim();
                const descriptionPart = parts[1].split('#')[1];

                if (!codePointPart || !descriptionPart) continue;

                const codePoints = codePointPart.split(' ')
                    .filter((cp) => cp.trim() !== '')
                    .map((cp) => parseInt(cp, 16));

                if (codePoints.length === 0) continue;

                const emoji = String.fromCodePoint(...codePoints);
                const description = descriptionPart.trim();
                const subCategory = mapSubCategory(currentSubGroup);
                const keywords = getChineseDescription(emoji, description, subCategory);
                const category = mapCategory(currentGroup);

                const emojiEntry = {
                    emoji: emoji,
                    keywords: keywords,
                    category: category,
                    subCategory: subCategory
                };

                const categoryKey = getCategoryKey(currentGroup);
                if (categoryKey && emojiData[categoryKey]) {
                    emojiData[categoryKey].push(emojiEntry);
                }
            } catch (error) {
                console.error('Error parsing emoji line:', error);
                continue;
            }
        }
    }

    return emojiData;
}

function mapCategory(unicodeCategory) {
    const categoryMap = {
        'Smileys & Emotion': '表情与情感',
        'People & Body': '人物',
        'Animals & Nature': '动物与自然',
        'Food & Drink': '食物与饮料',
        'Travel & Places': '旅行与地点',
        'Activities': '活动',
        'Objects': '物品',
        'Symbols': '符号'
    };
    return categoryMap[unicodeCategory] || unicodeCategory;
}

function mapSubCategory(subCategory) {
    const subCategoryMap = {
        'face-smiling': '笑脸',
        'face-affection': '喜爱',
        'face-tongue': '吐舌',
        'face-hand': '捂脸',
        'face-neutral-skeptical': '中性',
        'face-sleepy': '困倦',
        'face-unwell': '不适',
        'face-hat': '帽子',
        'face-glasses': '眼镜',
        'face-concerned': '担心',
        'face-negative': '消极',
        'face-costume': '装扮',
        'cat-face': '猫脸',
        'monkey-face': '猴脸',
        'emotion': '情感'
    };
    return subCategoryMap[subCategory] || subCategory;
}

function getCategoryKey(unicodeCategory) {
    const categoryKeyMap = {
        'Smileys & Emotion': 'smileys',
        'People & Body': 'people',
        'Animals & Nature': 'nature',
        'Food & Drink': 'food',
        'Activities': 'activities',
        'Travel & Places': 'travel',
        'Objects': 'objects',
        'Symbols': 'symbols'
    };
    return categoryKeyMap[unicodeCategory];
}

async function updateEmojiData() {
    try {
        await fetchChineseAnnotations();

        const unicodeData = await fetchUnicodeData();
        if (!unicodeData) {
            throw new Error('Failed to fetch Unicode data');
        }

        console.log('Processing emoji data...');
        const processedData = await processUnicodeData(unicodeData);
        if (!processedData) {
            throw new Error('Failed to process emoji data');
        }

        const fileContent = `// 自动生成的emoji数据 - ${new Date().toISOString()}\nexport const emojiData = ${JSON.stringify(processedData, null, 2)};\n`;

        fs.writeFileSync(OUTPUT_FILE, fileContent, 'utf8');
        console.log('Emoji data has been updated successfully!');

    } catch (error) {
        console.error('Error updating emoji data:', error);
    }
}

updateEmojiData().catch(console.error);

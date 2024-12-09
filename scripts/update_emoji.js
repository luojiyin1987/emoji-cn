const fs = require('fs');
const path = require('path');
const axios = require('axios');

const OUTPUT_FILE = path.join(__dirname, '../static/js/emoji-data.js');
const UNICODE_URL = 'https://unicode.org/Public/emoji/latest/emoji-test.txt';
const CLDR_ZH_URL = 'https://raw.githubusercontent.com/unicode-org/cldr/main/common/annotations/zh.xml';

// 存储中文注释数据
const chineseAnnotations = new Map();

// 英文描述到中文的映射
const englishToChinese = {
    'smiling face': '笑脸',
    'grinning face': '咧嘴笑脸',
    'face with tears of joy': '笑哭',
    'rolling on the floor laughing': '笑得在地上打滚',
    'face with hand over mouth': '捂嘴笑脸',
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
    'face with hand over mouth': '捂嘴',
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

        // 解析XML数据
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
                entry.keywords = description.split('|').map(k => k.trim());
            }
        }

        console.log(`Loaded ${chineseAnnotations.size} Chinese annotations`);
    } catch (error) {
        console.error('Error fetching Chinese annotations:', error);
    }
}

function translateDescription(englishDesc) {
    // 转换为小写并去除多余空格
    const normalizedDesc = englishDesc.toLowerCase().trim();
    
    // 尝试直接匹配
    if (englishToChinese[normalizedDesc]) {
        return englishToChinese[normalizedDesc];
    }
    
    // 尝试部分匹配
    for (const [eng, chn] of Object.entries(englishToChinese)) {
        if (normalizedDesc.includes(eng)) {
            return chn;
        }
    }
    
    return englishDesc;
}

function getChineseDescription(emoji, englishDescription) {
    const annotation = chineseAnnotations.get(emoji);
    const translatedDesc = translateDescription(englishDescription);
    
    if (annotation) {
        const desc = annotation.tts || annotation.keywords.join('、');
        if (desc) {
            // 如果 CLDR 中有注释，使用 CLDR 的注释
            return desc;
        }
    }
    
    // 如果没有 CLDR 注释，返回翻译后的描述
    return translatedDesc;
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

    for (const line of lines) {
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
                    .filter(cp => cp.trim() !== '')
                    .map(cp => parseInt(cp, 16));

                if (codePoints.length === 0) continue;

                const emoji = String.fromCodePoint(...codePoints);
                const description = descriptionPart.trim();
                const keywords = getChineseDescription(emoji, description);
                const category = mapCategory(currentGroup);
                const subCategory = mapSubCategory(currentSubGroup);

                const emojiEntry = {
                    emoji,
                    keywords,
                    category,
                    subCategory
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
        // 首先获取中文注释
        await fetchChineseAnnotations();

        // 然后获取 Unicode 数据
        const unicodeData = await fetchUnicodeData();
        if (!unicodeData) {
            throw new Error('Failed to fetch Unicode data');
        }

        console.log('Processing emoji data...');
        const processedData = await processUnicodeData(unicodeData);
        if (!processedData) {
            throw new Error('Failed to process emoji data');
        }

        const fileContent = `// 自动生成的emoji数据 - ${new Date().toISOString()}\nconst emojiData = ${JSON.stringify(processedData, null, 2)};`;
        
        fs.writeFileSync(OUTPUT_FILE, fileContent, 'utf8');
        console.log('Emoji data has been updated successfully!');
        
    } catch (error) {
        console.error('Error updating emoji data:', error);
    }
}

// 执行更新
updateEmojiData().catch(console.error);

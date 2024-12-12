#!/usr/bin/env python3
import json
import sys
from pathlib import Path

def translate_skin_tone(text):
    tone_map = {
        'light skin tone': '浅肤色',
        'medium-light skin tone': '中浅肤色',
        'medium skin tone': '中等肤色',
        'medium-dark skin tone': '中深肤色',
        'dark skin tone': '深肤色'
    }
    for eng, chn in tone_map.items():
        text = text.replace(eng, chn)
    return text

def translate_gender(text):
    gender_map = {
        'man': '男性',
        'woman': '女性',
        'person': '人',
        'people': '人们',
        'baby': '婴儿',
        'child': '儿童',
        'boy': '男孩',
        'girl': '女孩'
    }
    for eng, chn in gender_map.items():
        # 确保只替换完整的单词
        text = text.replace(f' {eng} ', f' {chn} ')
        text = text.replace(f'{eng} ', f'{chn} ')
        text = text.replace(f' {eng}', f' {chn}')
    return text

def translate_action(text):
    action_map = {
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
    }
    for eng, chn in action_map.items():
        text = text.replace(eng, chn)
    return text

def translate_role(text):
    role_map = {
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
    }
    for eng, chn in role_map.items():
        text = text.replace(eng, chn)
    return text

def process_emoji_data(input_file, output_file):
    # 读取原始数据
    with open(input_file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # 提取 JavaScript 对象
    try:
        start = content.index('const emojiData = {')
        if start == -1:
            raise ValueError("Cannot find 'const emojiData = {' in the input file")
        start = content.index('{', start)
        end = content.rindex('}')
        js_object = content[start:end+1]
        
        # 将 JavaScript 对象转换为 Python 字典
        data = json.loads(js_object)
        
        # 处理每个表情符号的 keywords
        for category in data:
            for emoji in data[category]:
                if isinstance(emoji.get('keywords'), str):
                    keywords = emoji['keywords']
                    
                    # 如果关键词是英文描述，进行翻译
                    if any(c.isascii() and c.isalpha() for c in keywords):
                        # 移除版本号、emoji代码和箭头
                        keywords = ' '.join(word for word in keywords.split() 
                                         if not any(prefix in word for prefix in ['E', '�', '➡', '🏻', '🏼', '🏽', '🏾', '🏿'])
                                         and not word.startswith('👨')
                                         and not word.startswith('👩')
                                         and not word.startswith('🧑'))
                        
                        # 应用翻译
                        keywords = translate_skin_tone(keywords)
                        keywords = translate_gender(keywords)
                        keywords = translate_action(keywords)
                        keywords = translate_role(keywords)
                        
                        # 如果翻译后还有英文，使用更具体的描述
                        if any(c.isascii() and c.isalpha() for c in keywords):
                            subcat = emoji.get('subCategory', '')
                            if 'hand-fingers-open' in subcat:
                                keywords = '张开手指'
                            elif 'hand-fingers-partial' in subcat:
                                keywords = '手指手势'
                            elif 'hand-single-finger' in subcat:
                                keywords = '单指手势'
                            elif 'hand-fingers-closed' in subcat:
                                keywords = '握拳'
                            elif 'hands' in subcat:
                                keywords = '双手手势'
                            elif 'body-parts' in subcat:
                                keywords = '身体部位'
                            elif 'person' in subcat:
                                keywords = '人物'
                            elif 'person-gesture' in subcat:
                                keywords = '人物手势'
                            elif 'person-role' in subcat:
                                keywords = '职业角色'
                            elif 'person-fantasy' in subcat:
                                keywords = '幻想角色'
                            elif 'person-activity' in subcat:
                                keywords = '人物活动'
                            elif 'person-sport' in subcat:
                                keywords = '运动人物'
                            elif 'person-resting' in subcat:
                                keywords = '休息'
                            elif 'family' in subcat:
                                keywords = '家庭'
                            else:
                                keywords = f"{emoji['category']}"
                        
                        emoji['keywords'] = keywords.strip()
        
        # 生成新的 JavaScript 文件内容
        output_content = '// 自动生成的emoji数据 - ' + content.split('-')[1].split('\n')[0].strip() + '\n'
        output_content += 'export const emojiData = ' + json.dumps(data, ensure_ascii=False, indent=2)
        
        # 写入新文件
        with open(output_file, 'w', encoding='utf-8') as f:
            f.write(output_content)
            
    except Exception as e:
        print(f'Error processing emoji data: {str(e)}')
        raise

if __name__ == '__main__':
    if len(sys.argv) != 3:
        print('Usage: python translate_emoji_data.py input_file output_file')
        sys.exit(1)
    
    input_file = sys.argv[1]
    output_file = sys.argv[2]
    
    try:
        process_emoji_data(input_file, output_file)
        print(f'Successfully processed emoji data from {input_file} to {output_file}')
    except Exception as e:
        print(f'Error processing emoji data: {str(e)}')
        sys.exit(1)

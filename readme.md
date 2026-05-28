# Emoji-CN 中文表情符号搜索工具

![License](https://img.shields.io/badge/license-MIT-blue.svg)

一个简单易用的中文表情符号搜索网站，支持拼音搜索、一键复制和分类浏览。纯静态网站，无需后端服务。

## 特性

- **拼音搜索** - 支持全拼、首字母缩写搜索，快速定位表情符号
- **一键复制** - 点击表情符号即可复制到剪贴板
- **分类浏览** - 按表情、人物、动物、食物、活动、旅行、物品、符号分类
- **响应式设计** - 完美适配桌面端和移动端
- **PWA 支持** - 可添加到主屏幕，离线使用
- **暗色模式** - 自动跟随系统主题
- **快速加载** - 优化的缓存策略和懒加载

## 技术栈

- **前端**: 原生 JavaScript (ES6+)
- **拼音转换**: [pinyin-pro](https://github.com/zh-lx/pinyin-pro)
- **缓存**: Service Worker + Cache API
- **部署**: 静态文件，支持 Vercel、GitHub Pages 等

## 项目结构

```
emoji-cn/
├── index.html              # 主页面
├── sw.js                   # Service Worker
├── manifest.json           # PWA 配置
├── package.json            # 项目配置
├── scripts/
│   ├── build_pinyin.js     # 拼音索引构建脚本
│   └── update_emoji.js     # 表情数据更新脚本
├── static/
│   ├── css/
│   │   └── style.css       # 样式文件
│   ├── js/
│   │   ├── main.js         # 主逻辑
│   │   ├── emoji-data.js   # 表情数据（自动生成）
│   │   └── vendor/
│   │       └── tiny-pinyin.js  # 拼音库
│   └── icons/
│       ├── icon-192x192.png
│       └── icon-512x512.png
└── tools/                  # 辅助工具
```

## 快速开始

### 本地开发

```bash
# 克隆仓库
git clone https://github.com/luojiyin1987/emoji-cn.git
cd emoji-cn

# 安装依赖
npm install

# 启动本地服务器
npx serve
# 或使用 Python
python -m http.server 8081
```

访问 `http://localhost:3000` 或 `http://localhost:8081` 即可。

### 构建拼音索引

如果修改了表情数据，需要重新构建拼音索引：

```bash
npm run build:pinyin
```

### 更新表情数据

```bash
cd scripts
node update_emoji.js
```

## 部署

### Vercel 部署（推荐）

1. Fork 这个仓库到你的 GitHub 账号
2. 在 [Vercel](https://vercel.com) 注册账号并连接 GitHub
3. 点击 "New Project"，选择 fork 的仓库
4. 部署设置：
   - Framework Preset: **Other**
   - Build Command: 留空
   - Output Directory: `.`
5. 点击 "Deploy"

### GitHub Pages

1. 在仓库 Settings > Pages
2. Source 选择 `main` 分支
3. 保存即可

## 使用方法

1. 在搜索框输入中文关键词或拼音（如 "kaixin" 或 "kx"）
2. 点击分类按钮筛选表情类型
3. 点击表情符号自动复制到剪贴板
4. 粘贴到任何支持表情的应用中

## 拼音搜索示例

| 输入 | 匹配结果 |
|------|----------|
| `kaixin` | 开心 😄 |
| `kx` | 开心、哭笑 😄😂 |
| `aini` | 爱你 ❤️ |
| `shengqi` | 生气 😠 |

## 许可证

MIT License

## 致谢

- 表情数据参考 [getemoji.com](https://getemoji.com/)
- 拼音转换使用 [pinyin-pro](https://github.com/zh-lx/pinyin-pro)

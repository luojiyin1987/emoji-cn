# Emoji-CN 中文表情符号网站

![License](https://img.shields.io/badge/license-MIT-blue.svg)

一个简单易用的中文表情符号网站，支持快速搜索和复制表情符号。

## ✨ 特性

- 🔍 智能中文搜索
- 📋 一键复制表情符号
- 🎨 优雅的用户界面
- 📱 响应式设计
- 🚀 快速加载
- 🌏 完全中文支持

## 🛠️ 技术栈

- 纯静态网站，无需后端
- 原生 JavaScript
- 支持一键部署到 Vercel

## 🚀 部署方法

### Vercel 部署（推荐）

1. Fork 这个仓库到你的 GitHub 账号
2. 在 [Vercel](https://vercel.com) 注册账号并连接你的 GitHub
3. 在 Vercel 中点击 "New Project"
4. 选择你 fork 的仓库
5. 在部署设置中：
   - Framework Preset: 选择 "Other"
   - Build Command: 留空（无需构建）
   - Output Directory: 保持默认 "."
6. 点击 "Deploy" 即可完成部署

注意事项：
- 项目是纯静态网站，入口文件是 `index.html`
- 无需配置环境变量
- 无需安装依赖或运行构建命令
- `vercel.json` 已配置好路由重写规则
- 部署后，Vercel 会自动为你的网站提供 HTTPS 和 CDN 加速

### 本地开发

1. 克隆仓库：
```bash
git clone https://github.com/luojiyin1987/emoji-cn.git
cd emoji-cn
```

2. 使用任何静态文件服务器运行项目，例如：
```bash
# 使用 Python 的简单 HTTP 服务器
python -m http.server 8081

# 或使用 Node.js 的 serve 包
npx serve
```

## 🎯 使用方法

1. 在搜索框输入关键词搜索表情符号
2. 点击表情符号即可复制到剪贴板
3. 使用分类按钮筛选不同类型的表情符号

## 📝 更新表情符号数据

如果你想更新表情符号数据：

1. 确保安装了 Node.js
2. 运行更新脚本：
```bash
cd scripts
node update_emoji.js
```

这将更新 `static/js/emoji-data.js` 文件中的表情符号数据。

## 🤝 贡献

欢迎提交 Pull Request 或创建 Issue！

## 📄 许可证

MIT License

search emoji by chinese

thanks by https://getemoji.com/
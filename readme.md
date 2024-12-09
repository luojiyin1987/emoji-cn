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

- 后端：Rust + Actix-web
- 前端：原生JavaScript
- 模板引擎：Tera
- 静态文件服务：Actix-files

## 📦 安装

1. 克隆仓库：
```bash
git clone https://github.com/yourusername/emoji-cn.git
cd emoji-cn
```

2. 安装依赖：
```bash
cargo build
```

3. 运行项目：
```bash
cargo run
```

访问 `http://127.0.0.1:8081` 即可使用。

## 🎯 使用方法

1. 在搜索框输入关键词搜索表情符号
2. 点击表情符号即可复制到剪贴板
3. 使用分类按钮筛选不同类型的表情符号

## 🐳 Docker 部署

### 使用 Docker Compose 部署

1. 确保已安装 Docker 和 Docker Compose：
```bash
docker --version
docker compose version
```

2. 克隆仓库：
```bash
git clone https://github.com/yourusername/emoji-cn.git
cd emoji-cn
```

3. 构建和启动容器：
```bash
docker compose up -d
```

4. 查看日志：
```bash
docker compose logs -f
```

5. 停止服务：
```bash
docker compose down
```

### 配置说明

- 默认端口：8081（可在 docker-compose.yml 中修改）
- 日志配置：最大 10MB，保留 3 个文件
- 自动重启：服务异常退出时自动重启
- 健康检查：每 30 秒检查一次服务状态

### 自定义构建

如需自定义构建参数，可以修改 Dockerfile 或 docker-compose.yml：

- 修改端口映射：编辑 docker-compose.yml 中的 ports 部分
- 调整日志配置：修改 logging 部分的 max-size 和 max-file
- 更改环境变量：在 environment 部分添加或修改

## 🔧 配置

项目配置在 `Cargo.toml` 中：

```toml
[dependencies]
actix-web = "4.4"
actix-files = "0.6"
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"
tera = "1.19"
tokio = { version = "1.35", features = ["full"] }
```

## 🤝 贡献

欢迎提交 Pull Request 或创建 Issue！

## 📝 开源协议

本项目采用 MIT 协议 - 查看 [LICENSE](LICENSE) 文件了解详情。

search emoji by chinese

thanks by https://getemoji.com/
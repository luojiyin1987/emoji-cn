# 使用多阶段构建
# 构建阶段
FROM rust:1.75-slim as builder

WORKDIR /app
COPY . .

# 构建发布版本
RUN cargo build --release

# 运行阶段
FROM debian:bookworm-slim

WORKDIR /app

# 复制构建产物和必要文件
COPY --from=builder /app/target/release/emoji-cn /app/
COPY --from=builder /app/templates /app/templates
COPY --from=builder /app/static /app/static

# 安装必要的系统库
RUN apt-get update && apt-get install -y \
    libssl-dev \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# 暴露端口
EXPOSE 8081

# 设置环境变量
ENV RUST_LOG=info

# 运行应用
CMD ["./emoji-cn"]

# 使用轻量级的 Node.js 镜像作为基础
FROM node:22

# 设置工作目录
WORKDIR /app

# 复制 package.json 和 package-lock.json (或 yarn.lock)
COPY package*.json ./

# 安装生产环境依赖
# 注意：由于我们不打算在容器内进行复杂的 AI 训练（在本地完成），所以只安装运行时需要的包
RUN npm install --production

# 复制项目所有文件
COPY . .

# 暴露端口 (本项目默认 server.js 监听 3000 或 80)
EXPOSE 3000

# 启动命令
# 默认运行 server.js 提供 Web 服务和统计 API
CMD ["node", "server.js"]

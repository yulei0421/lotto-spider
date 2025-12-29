# 双色球数据中心 - NestJS + React SSR

基于 **NestJS** 直接渲染 **React** 的服务端渲染（SSR）应用。

## 📁 项目结构

```
lotto-spider/
└── backend/              # 主项目目录
    ├── src/              # NestJS 后端代码
    │   ├── lottery/      # 彩票业务模块
    │   ├── stats/        # 统计模块
    │   ├── view/         # 视图渲染控制器
    │   └── main.ts       # 入口文件
    ├── client/           # React 前端代码
    │   ├── components/   # React 组件
    │   ├── styles/       # 样式文件
    │   ├── App.tsx       # 主应用组件
    │   └── index.tsx     # 客户端入口
    ├── views/            # EJS 模板
    ├── public/           # 静态资源
    │   └── dist/         # Webpack 打包输出
    ├── data/             # 数据存储
    └── webpack.config.js # Webpack 配置
```

## 🚀 快速开始

### 安装依赖

```bash
cd backend
npm install
```

### 配置环境变量

```bash
cp .env.example .env
```

### 首次运行 - 爬取数据

```bash
npm run spider
```

### 开发模式

```bash
npm run start:dev
```

这会同时启动：
- NestJS 服务器（自动重启）
- Webpack 监听模式（自动编译前端代码）

访问 `http://localhost:3000` 查看应用

### 生产环境

```bash
# 构建前端和后端
npm run build

# 启动生产服务器
npm run start:prod
```

## ✨ 技术架构

### 后端（NestJS）

- **框架**: NestJS 10
- **模板引擎**: EJS
- **API**: RESTful
- **定时任务**: @nestjs/schedule
- **数据存储**: JSON 文件

### 前端（React）

- **框架**: React 18
- **语言**: TypeScript
- **构建工具**: Webpack 5 + Babel
- **样式**: CSS Modules

### SSR 渲染流程

1. **服务端**：NestJS 通过 EJS 模板渲染 HTML 骨架
2. **数据注入**：将初始数据注入到 `window.__INITIAL_DATA__`
3. **客户端激活**：React 接管 DOM，实现交互功能

## 📡 API 接口

### 彩票数据

- `GET /api/lottery/history?page=1&pageSize=20` - 历史数据（分页）
- `GET /api/lottery/stats` - 统计信息
- `GET /api/lottery/generate` - 生成随机号码
- `GET /api/lottery/blue-analysis` - 蓝球分析
- `GET /api/lottery/trend?limit=30` - 走势数据
- `POST /api/lottery/crawl` - 手动触发爬虫

### 统计

- `GET /api/stats` - 站点访问统计

## 🎯 核心功能

- ✅ **服务端渲染**：首屏由 NestJS 渲染，SEO 友好
- ✅ **数据爬虫**：自动爬取双色球历史数据
- ✅ **智能选号**：过滤历史重复组合
- ✅ **蓝球分析**：遗漏期数、热度统计
- ✅ **走势图表**：历史数据可视化
- ✅ **访问统计**：记录用户访问信息
- ✅ **定时任务**：每天自动更新数据

## 🛠️ 开发命令

```bash
# 开发模式（推荐）
npm run start:dev

# 仅启动后端
npm start

# 仅构建前端
npm run webpack:build

# 前端监听模式
npm run webpack:watch

# 运行爬虫
npm run spider

# 生产构建
npm run build
```

## 📦 部署建议

### 使用 PM2

```bash
# 安装 PM2
npm install -g pm2

# 构建项目
npm run build

# 启动服务
pm2 start dist/main.js --name lotto-spider

# 查看日志
pm2 logs lotto-spider
```

### 使用 Docker

创建 `Dockerfile`:

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["node", "dist/main.js"]
```

构建并运行：

```bash
docker build -t lotto-spider .
docker run -p 3000:3000 lotto-spider
```

## 🔧 环境变量

```env
PORT=3000              # 服务端口
NODE_ENV=development   # 环境模式
```

## 📝 注意事项

1. **首次运行**必须先执行 `npm run spider` 爬取数据
2. **开发模式**需要同时运行 NestJS 和 Webpack
3. **生产环境**需要先构建再启动
4. 数据文件保存在 `data/ssq-full-data.json`
5. 访问日志保存在 `data/access_logs.json`

## 📄 许可证

MIT License

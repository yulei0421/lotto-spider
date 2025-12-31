# 🎱 双色球数据中心与 AI 预测系统

一个基于 **Node.js** 的全栈彩票数据分析与预测平台，集成自动化爬虫、深度学习预测模型以及多维度的可视化分析。

---

## 🌟 核心功能

- 🚀 **自动化数据采集**：实时同步双色球历史开奖数据，支持增量更新。
- 🧠 **AI 深度学习预测**：
  - 基于 **TensorFlow.js** 的残差神经网络模型。
  - **50 期时序回溯**：模型通过观察连续 50 期的规律（1350 维特征向量）进行推理。
  - **多维特征工程**：集成 Z-Score 标准化、冷热频率、遗漏值、红球和值、奇偶比、大小比及连号统计等 27 类核心指标。
- 📊 **可视化走势分析**：
  - **动态图表**：展示最近 20 期的红蓝球走势，支持多轴交互。
  - **蓝球深度分析**：遗漏周期可视化、加权概率分布、冷热号自动识别。
  - **马尔科夫链**：基于转移矩阵的蓝球状态转移预测。
- 📱 **响应式界面**：暗黑系高级美学设计，完美适配移动端与 PC 端。
- 🛡️ **管理监控面板**：后台实时统计 PV/UV 以及用户访问设备画像。

---

## 📁 项目结构

```
lotto-spider/
├── public/               # 前端前端资源与部署模型
│   ├── app.js            # 前端交互逻辑与 AI 推理
│   ├── index.html        # 核心视图
│   ├── model/            # 已训练好的 TensorFlow.js 模型 (JSON + Weights)
│   └── ...
├── data/                 # 数据存储
│   └── ssq-full-data.json # 全量历史开奖数据
├── train.js              # AI 模型设计与训练脚本
├── server.js             # 高性能 Express 后端服务
├── spider.js             # 自动化爬虫核心
└── caipiao.js            # 爬虫辅助逻辑
```

---

## 🚀 快速开始

### 1. 环境准备

确保已安装 Node.js (v18+) 及 Yarn/NPM。

### 2. 安装依赖

```bash
yarn install
```

### 3. 数据同步

首次运行需抓取历史数据：

```bash
node spider.js
```

### 4. AI 模型训练

如果你想根据最新的 50 期数据重新校准模型：

```bash
node train.js
```

### 5. 启动服务

```bash
yarn server
```

访问 `http://localhost:3000` 即可查看。

---

## 🧠 AI 技术选型

### 特征工程 (Feature Engineering)

每期数据被提取为 **27 维** 向量：

- **Base**: 6 红+1 蓝的 Z-Score 标准化值。
- **Frequency**: 全局出现频次。
- **Omit**: 归一化后的遗漏期数。
- **Advanced**: 红球区间、离散度、和值、奇偶比、大小比、连号数。

### 模型架构 (Architecture)

- **输入层**：`[null, 1350]` (50 期 × 27 特征)。
- **卷积层**：`Conv1D` 提取跨期时空关联特征。
- **残差快 (Residual Block)**：双层 512 神经元全连接，带 Batch Normalization 与 LeakyReLU。
- **输出层**：Sigmoid 激活，预测 0-1 之间的开奖分布，随后经反归一化算法还原为号码。

---

## � 常用命令

| 命令             | 说明                            |
| :--------------- | :------------------------------ |
| `yarn server`    | 启动开发服务器                  |
| `node spider.js` | 运行爬虫更新本地 JSON 数据      |
| `node train.js`  | 重新训练 AI 残差网络模型        |
| `git push`       | 触发 Vercel/Cloudflare 自动部署 |

---

## � 部署记录

```bash
git add . && git commit -m "feat: upgrade AI prediction window to 50 issues" && git push origin main
```

---

## 📄 许可证

MIT License

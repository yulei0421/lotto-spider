#!/bin/bash

# ========================================================
# 双色球数据自动化维护脚本 (本地运行版)
# ========================================================

# 1. 进入项目根目录 (请确保路径正确)
PROJECT_DIR="/Users/wikiglobal/Desktop/demo/lotto-spider"
cd "$PROJECT_DIR" || exit

echo "----------------------------------------------------"
echo "[$(date '+%Y-%m-%d %H:%M:%S')] 启动自动化任务..."

# 2. 执行爬虫抓取最新历史数据
echo "Step 1: 正在从官网抓取数据..."
/usr/local/bin/node spider.js

# 检查爬虫是否执行成功 (通过判断数据文件是否有更新)
if [ $? -ne 0 ]; then
    echo "❌ 爬虫执行失败，请检查网络或 Cookie 是否失效。"
    exit 1
fi

# 3. 将数据同步到 public 目录 (供 Zeabur/Vercel 访问)
echo "Step 2: 同步数据至公开目录..."
cp data/ssq-full-data.json public/data/ssq-full-data.json

# 4. 提交并推送到 GitHub (触发云端自动部署)
echo "Step 3: 准备推送到 GitHub..."
/usr/bin/git add .
/usr/bin/git commit -m "Auto-update: Latest ssq data $(date '+%Y-%m-%d %H:%M')"
/usr/bin/git push origin main

if [ $? -eq 0 ]; then
    echo "✅ [$(date '+%Y-%m-%d %H:%M:%S')] 任务圆满完成！"
    echo "🚀 Zeabur 和 GitHub Pages 将在 1 分钟内同步更新。"
else
    echo "❌ Git 推送失败，请检查网络或权限。"
    exit 1
fi
echo "----------------------------------------------------"

#!/bin/bash

# 获取脚本所在目录的绝对路径
PROJECT_DIR="/Users/wikiglobal/Desktop/demo/lotto-spider"
cd $PROJECT_DIR

echo "[$(date)] 开始定时更新任务..."

# 1. 运行爬虫抓取最新数据
/usr/local/bin/node spider.js

# 2. 同步数据到静态目录
cp data/ssq-full-data.json public/data/ssq-full-data.json

# 3. 提交并推送到 GitHub (会触发 Vercel 和 GitHub Pages 更新)
/usr/bin/git add .
/usr/bin/git commit -m "Auto-update: Latest lottery data $(date +'%Y-%m-%d %H:%M')"
/usr/bin/git push origin main

echo "[$(date)] 任务完成！数据已同步至云端。"

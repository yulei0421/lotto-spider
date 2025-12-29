# 爬虫 403 错误解决方案

## 问题原因

403 错误通常是因为：
1. 请求头不完整，被识别为爬虫
2. 请求频率过快，触发反爬虫机制
3. IP 被暂时封禁
4. 网站更新了反爬虫策略

## 解决方案

### 方案 1：优化后的爬虫（已更新）

我已经优化了 `spider.service.ts`，添加了：
- ✅ 更完整的请求头（模拟真实浏览器）
- ✅ 详细的错误日志
- ✅ 增加请求延迟（2秒）
- ✅ 更好的错误处理

**再次尝试：**
```bash
cd backend
npm run spider
```

### 方案 2：使用模拟数据（快速测试）

如果爬虫仍然失败，可以先生成模拟数据来测试项目：

```bash
cd backend
npm run mock
```

这会生成 500 条模拟的双色球数据，让你可以先测试整个系统。

### 方案 3：手动下载数据

1. 访问官网：https://www.cwl.gov.cn/ygkj/wqkjgg/ssq/
2. 手动复制数据
3. 保存为 `backend/data/ssq-full-data.json`

数据格式：
```json
[
  {
    "issue": "2024001",
    "date": "2024-01-02",
    "front": ["01", "05", "12", "18", "23", "33"],
    "back": "08"
  }
]
```

### 方案 4：使用浏览器手动获取

1. 打开浏览器开发者工具（F12）
2. 访问：https://www.cwl.gov.cn/ygkj/wqkjgg/ssq/
3. 在 Network 标签中找到 API 请求
4. 右键点击请求 → Copy → Copy as cURL
5. 使用 curl 命令获取数据

### 方案 5：修改 User-Agent

如果还是 403，尝试在浏览器中：
1. 访问官网并打开开发者工具
2. 查看实际的请求头
3. 复制你的浏览器 User-Agent
4. 更新 `spider.service.ts` 中的 `User-Agent`

## 调试技巧

### 查看详细错误信息

运行爬虫时会显示详细的错误信息：
- HTTP 状态码
- 响应头
- 响应数据

### 测试单个请求

你可以使用 curl 测试：

```bash
curl 'https://www.cwl.gov.cn/cwl_admin/front/cwlkj/search/kjxx/findDrawNotice?name=ssq&issueCount=&issueStart=&issueEnd=&dayStart=&dayStart=&pageNo=1&pageSize=30&week=&systemType=PC' \
  -H 'User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' \
  -H 'Referer: https://www.cwl.gov.cn/ygkj/wqkjgg/ssq/'
```

## 推荐流程

1. **先使用模拟数据测试项目**
   ```bash
   npm run mock
   npm run start:dev
   ```

2. **确认项目运行正常后，再尝试真实爬虫**
   ```bash
   npm run spider
   ```

3. **如果爬虫失败，检查错误日志并调整策略**

## 注意事项

- ⚠️ 爬虫可能随时失效，因为网站可能更新反爬虫策略
- ⚠️ 请遵守网站的 robots.txt 和使用条款
- ⚠️ 不要频繁请求，避免给服务器造成压力
- ⚠️ 生产环境建议使用官方 API 或购买数据服务

## 联系支持

如果以上方案都不行，可以：
1. 检查网络连接
2. 尝试使用代理
3. 联系网站管理员获取 API 权限

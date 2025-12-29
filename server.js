import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;

const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.bin': 'application/octet-stream'
};

const server = http.createServer((req, res) => {
  // 处理 URL，移除查询参数
  const urlPath = new URL(req.url, `http://${req.headers.host}`).pathname;
  let filePath = '';
  
  // API: 获取统计数据
  if (urlPath === '/api/stats') {
    fs.readFile(path.join(__dirname, 'data', 'access_logs.json'), 'utf8', (err, data) => {
      let logs = [];
      if (!err && data) {
        try { logs = JSON.parse(data); } catch (e) {}
      }
      
      // 按 IP 聚合统计
      const ipMap = new Map();
      logs.forEach(log => {
          if (!ipMap.has(log.ip)) {
              ipMap.set(log.ip, {
                  ip: log.ip,
                  count: 0,
                  lastTime: log.time,
                  ua: log.ua
              });
          }
          const item = ipMap.get(log.ip);
          item.count++;
          // 更新为最后访问时间
          if (new Date(log.time) > new Date(item.lastTime)) {
              item.lastTime = log.time;
              item.ua = log.ua;
          }
      });

      // 转为数组并按最后访问时间降序排列
      const aggregated = Array.from(ipMap.values())
        .sort((a, b) => new Date(b.lastTime) - new Date(a.lastTime));

      const stats = {
        total: logs.length,
        unique: ipMap.size,
        recent: aggregated.slice(0, 50) // 前 50 个唯一 IP
      };
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(stats));
    });
    return;
  }

  // 路由逻辑
  if (urlPath === '/') {
    filePath = path.join(__dirname, 'public', 'index.html');
    
    // === 记录访问日志 ===
    // 优先获取 Cloudflare 或 代理转发的真实 IP
    const clientIP = req.headers['cf-connecting-ip'] || 
                     req.headers['x-forwarded-for'] || 
                     req.socket.remoteAddress;
    
    const userAgent = req.headers['user-agent'];
    const logEntry = {
      time: new Date().toISOString(),
      ip: clientIP,
      ua: userAgent
    };

    const logFile = path.join(__dirname, 'data', 'access_logs.json');
    
    // 异步写入日志
    fs.readFile(logFile, 'utf8', (err, data) => {
      let logs = [];
      if (!err && data) {
        try { logs = JSON.parse(data); } catch (e) {}
      }
      logs.push(logEntry);
      // 限制日志文件大小，只保留最近 2000 条
      if (logs.length > 2000) logs = logs.slice(-2000);
      
      fs.writeFile(logFile, JSON.stringify(logs), () => {});
    });
    // ==================
  } else if (urlPath.startsWith('/data/')) {
    // 允许访问 data 目录下的文件
    filePath = path.join(__dirname, '.' + urlPath);
  } else {
    // 默认尝试在 public 目录下寻找
    filePath = path.join(__dirname, 'public', urlPath);
  }

  const extname = path.extname(filePath);
  const contentType = MIME_TYPES[extname] || 'application/octet-stream';

  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        res.writeHead(404);
        res.end('404 Not Found');
      } else {
        res.writeHead(500);
        res.end(`Server Error: ${err.code}`);
      }
    } else {
      // 性能优化：为静态文件添加缓存头
      const headers = { 'Content-Type': contentType };
      if (filePath.includes('data/') || filePath.includes('.js') || filePath.includes('.css')) {
          headers['Cache-Control'] = 'public, max-age=3600'; // 缓存1小时
      }
      res.writeHead(200, headers);
      res.end(content, 'utf-8');
    }
  });
});

// 确保 data 目录存在
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir);
}

server.listen(PORT, () => {
  console.log(`🚀 服务器运行在: http://localhost:${PORT}/`);
  console.log(`📂 数据文件服务已开启`);
});

// 防止进程因未捕获异常而退出
process.on('uncaughtException', (err) => {
  console.error('未捕获的异常:', err);
});

process.on('unhandledRejection', (reason, p) => {
  console.error('未处理的 Promise 拒绝:', reason);
});

import fs from 'fs';
import path from 'path';

export default function handler(req, res) {
  const logFile = path.join(process.cwd(), 'data', 'access_logs.json');
  
  try {
    let logs = [];
    if (fs.existsSync(logFile)) {
      const content = fs.readFileSync(logFile, 'utf8');
      logs = JSON.parse(content);
    }
    
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
      if (new Date(log.time) > new Date(item.lastTime)) {
        item.lastTime = log.time;
        item.ua = log.ua;
      }
    });

    const aggregated = Array.from(ipMap.values())
      .sort((a, b) => new Date(b.lastTime) - new Date(a.lastTime));

    const stats = {
      total: logs.length,
      unique: ipMap.size,
      recent: aggregated.slice(0, 50)
    };

    res.status(200).json(stats);
  } catch (error) {
    res.status(200).json({ total: 0, unique: 0, recent: [], info: "Vercel Serverless environment has limited file persistence." });
  }
}

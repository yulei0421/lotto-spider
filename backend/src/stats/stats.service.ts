import { Injectable } from '@nestjs/common';
import * as fs from 'fs-extra';
import * as path from 'path';

export interface AccessLog {
  time: string;
  ip: string;
  ua: string;
}

export interface AggregatedLog {
  ip: string;
  count: number;
  lastTime: string;
  ua: string;
}

@Injectable()
export class StatsService {
  private readonly logPath = path.join(__dirname, '../../data/access_logs.json');

  /**
   * 记录访问日志
   */
  async logAccess(ip: string, ua: string) {
    try {
      await fs.ensureDir(path.dirname(this.logPath));
      
      let logs: AccessLog[] = [];
      const exists = await fs.pathExists(this.logPath);
      
      if (exists) {
        logs = await fs.readJSON(this.logPath);
      }

      logs.push({
        time: new Date().toISOString(),
        ip,
        ua,
      });

      // 只保留最近2000条
      if (logs.length > 2000) {
        logs = logs.slice(-2000);
      }

      await fs.writeJSON(this.logPath, logs);
    } catch (error) {
      console.error('记录访问日志失败:', error);
    }
  }

  /**
   * 获取统计数据
   */
  async getStatistics() {
    try {
      const exists = await fs.pathExists(this.logPath);
      if (!exists) {
        return {
          total: 0,
          unique: 0,
          recent: [],
        };
      }

      const logs: AccessLog[] = await fs.readJSON(this.logPath);
      
      // 按IP聚合
      const ipMap = new Map<string, AggregatedLog>();
      
      logs.forEach(log => {
        if (!ipMap.has(log.ip)) {
          ipMap.set(log.ip, {
            ip: log.ip,
            count: 0,
            lastTime: log.time,
            ua: log.ua,
          });
        }
        
        const item = ipMap.get(log.ip);
        item.count++;
        
        if (new Date(log.time) > new Date(item.lastTime)) {
          item.lastTime = log.time;
          item.ua = log.ua;
        }
      });

      // 转为数组并按最后访问时间降序
      const aggregated = Array.from(ipMap.values())
        .sort((a, b) => new Date(b.lastTime).getTime() - new Date(a.lastTime).getTime());

      return {
        total: logs.length,
        unique: ipMap.size,
        recent: aggregated.slice(0, 50),
      };
    } catch (error) {
      console.error('获取统计数据失败:', error);
      return {
        total: 0,
        unique: 0,
        recent: [],
      };
    }
  }
}

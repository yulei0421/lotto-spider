'use client';

import { useEffect, useState } from 'react';
import { statsApi, type SiteStats } from '@/lib/api';
import dayjs from 'dayjs';
import styles from './StatsPanel.module.css';

export default function StatsPanel() {
  const [stats, setStats] = useState<SiteStats | null>(null);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const response = await statsApi.getStats();
      setStats(response.data);
    } catch (error) {
      console.error('加载站点统计失败:', error);
    }
  };

  if (!stats) return null;

  return (
    <section className="glass-panel">
      <div className="section-header">
        <h2>📊 站点访问统计</h2>
        <p>
          总访问量: <strong>{stats.total}</strong> | 
          独立访客: <strong>{stats.unique}</strong>
        </p>
      </div>

      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>最后访问</th>
              <th>IP</th>
              <th>次数</th>
              <th>设备</th>
            </tr>
          </thead>
          <tbody>
            {stats.recent.map((log, idx) => (
              <tr key={idx}>
                <td>{dayjs(log.lastTime).format('YYYY-MM-DD HH:mm:ss')}</td>
                <td>{log.ip}</td>
                <td>{log.count}</td>
                <td className={styles.ua}>{log.ua}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

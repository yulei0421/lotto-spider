'use client';

import { type Statistics } from '@/lib/api';
import styles from './Header.module.css';

interface HeaderProps {
  stats: Statistics | null;
  onStatsClick: () => void;
}

export default function Header({ stats, onStatsClick }: HeaderProps) {
  return (
    <header className={styles.header}>
      <div className={styles.headerContent}>
        <h1>双色球数据中心</h1>
        <p className={styles.subtitle}>历史开奖查询 & 智能随机选号</p>
      </div>
      
      <div className={styles.statsCard}>
        <div className={styles.statItem}>
          <span className={styles.statLabel}>总期数</span>
          <span className={styles.statValue}>
            {stats?.totalIssues || 'Loading...'}
          </span>
        </div>
        <div className={styles.statItem}>
          <span className={styles.statLabel}>最新期号</span>
          <span className={styles.statValue}>
            {stats?.latestIssue || 'Loading...'}
          </span>
        </div>
        <button 
          className={styles.statsBtn}
          onClick={onStatsClick}
          title="查看访问统计"
        >
          📊
        </button>
      </div>
    </header>
  );
}

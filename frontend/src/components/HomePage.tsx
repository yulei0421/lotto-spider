'use client';

import { useEffect, useState } from 'react';
import { lotteryApi, statsApi, type Statistics, type LotteryData } from '@/lib/api';
import Header from './Header';
import GeneratorSection from './GeneratorSection';
import TrendChart from './TrendChart';
import BlueAnalysis from './BlueAnalysis';
import HistoryTable from './HistoryTable';
import StatsPanel from './StatsPanel';
import styles from './HomePage.module.css';

export default function HomePage() {
  const [stats, setStats] = useState<Statistics | null>(null);
  const [showStats, setShowStats] = useState(false);

  useEffect(() => {
    loadStats();
    loadSiteStats();
  }, []);

  const loadStats = async () => {
    try {
      const response = await lotteryApi.getStats();
      setStats(response.data);
    } catch (error) {
      console.error('加载统计数据失败:', error);
    }
  };

  const loadSiteStats = async () => {
    try {
      await statsApi.getStats();
    } catch (error) {
      console.error('记录访问失败:', error);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.backgroundGlow}></div>
      
      <div className="container">
        <Header stats={stats} onStatsClick={() => setShowStats(!showStats)} />
        
        <main>
          <GeneratorSection />
          <TrendChart />
          <BlueAnalysis />
          <HistoryTable />
          {showStats && <StatsPanel />}
        </main>
      </div>
    </div>
  );
}

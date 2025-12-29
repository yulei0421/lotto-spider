import React, { useEffect, useState } from 'react';
import Header from './components/Header';
import GeneratorSection from './components/GeneratorSection';
import TrendChart from './components/TrendChart';
import AIPredictor from './components/AIPredictor';
import BlueAnalysis from './components/BlueAnalysis';
import HistoryTable from './components/HistoryTable';
import StatsPanel from './components/StatsPanel';
import { Statistics } from './types';
import { api } from './api';

const App: React.FC = () => {
  const [stats, setStats] = useState<Statistics | null>(
    (window as any).__INITIAL_DATA__?.stats || null
  );
  const [showStats, setShowStats] = useState(false);

  useEffect(() => {
    if (!stats) {
      loadStats();
    }
    recordVisit();
  }, []);

  const loadStats = async () => {
    try {
      const data = await api.getStats();
      setStats(data);
    } catch (error) {
      console.error('加载统计数据失败:', error);
    }
  };

  const recordVisit = async () => {
    try {
      await api.recordVisit();
    } catch (error) {
      console.error('记录访问失败:', error);
    }
  };

  return (
    <div className="page">
      <div className="background-glow"></div>
      
      <div className="container">
        <Header stats={stats} onStatsClick={() => setShowStats(!showStats)} />
        
        <main>
          <GeneratorSection />
          <TrendChart />
          <AIPredictor />
          <BlueAnalysis />
          <HistoryTable />
          {showStats && <StatsPanel />}
        </main>
      </div>
    </div>
  );
};

export default App;

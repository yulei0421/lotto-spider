'use client';

import { useEffect, useState } from 'react';
import { lotteryApi, type BlueAnalysis as BlueAnalysisType } from '@/lib/api';
import styles from './BlueAnalysis.module.css';

export default function BlueAnalysis() {
  const [analysis, setAnalysis] = useState<BlueAnalysisType | null>(null);

  useEffect(() => {
    loadAnalysis();
  }, []);

  const loadAnalysis = async () => {
    try {
      const response = await lotteryApi.getBlueAnalysis();
      setAnalysis(response.data);
    } catch (error) {
      console.error('加载蓝球分析失败:', error);
    }
  };

  if (!analysis) return null;

  return (
    <section className="glass-panel">
      <div className="section-header">
        <h2>🔵 蓝球遗漏与概率分析</h2>
        <p>1-16号蓝球遗漏期数与热度统计</p>
      </div>

      <div className={styles.recommendations}>
        <div className={styles.recCard}>
          <span className={styles.recLabel}>🔥 最热号码</span>
          <div className={styles.recValue}>
            <span className="ball blue">{analysis.recommendations.hot}</span>
          </div>
          <span className={styles.recDesc}>近期出现最频繁</span>
        </div>
        
        <div className={styles.recCard}>
          <span className={styles.recLabel}>❄️ 遗漏王</span>
          <div className={styles.recValue}>
            <span className="ball blue">{analysis.recommendations.cold}</span>
          </div>
          <span className={styles.recDesc}>
            当前遗漏 <strong>{analysis.recommendations.coldOmission}</strong> 期
          </span>
        </div>
      </div>

      <div className={styles.statsGrid}>
        {analysis.blueStats.map((stat) => (
          <div key={stat.number} className={styles.statCard}>
            <span className="ball blue small">{stat.number}</span>
            <div className={styles.statInfo}>
              <div>遗漏: {stat.omission}期</div>
              <div>出现: {stat.count}次</div>
              <div>频率: {stat.frequency}%</div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

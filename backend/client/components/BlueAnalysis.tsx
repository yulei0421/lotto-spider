import React, { useEffect, useState } from 'react';
import { BlueAnalysis as BlueAnalysisType } from '../types';
import { api } from '../api';
import './BlueAnalysis.css';

const BlueAnalysis: React.FC = () => {
  const [analysis, setAnalysis] = useState<BlueAnalysisType | null>(null);

  useEffect(() => {
    loadAnalysis();
  }, []);

  const loadAnalysis = async () => {
    try {
      const data = await api.getBlueAnalysis();
      setAnalysis(data);
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

      <div className="recommendations">
        <div className="rec-card">
          <span className="rec-label">🔥 最热号码</span>
          <div className="rec-value">
            <span className="ball blue">{analysis.recommendations.hot}</span>
          </div>
          <span className="rec-desc">近期出现最频繁</span>
        </div>
        
        <div className="rec-card">
          <span className="rec-label">❄️ 遗漏王</span>
          <div className="rec-value">
            <span className="ball blue">{analysis.recommendations.cold}</span>
          </div>
          <span className="rec-desc">
            当前遗漏 <strong>{analysis.recommendations.coldOmission}</strong> 期
          </span>
        </div>
      </div>

      <div className="stats-grid">
        {analysis.blueStats.map((stat) => (
          <div key={stat.number} className="stat-card">
            <span className="ball blue small">{stat.number}</span>
            <div className="stat-info">
              <div>遗漏: {stat.omission}期</div>
              <div>出现: {stat.count}次</div>
              <div>频率: {stat.frequency}%</div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default BlueAnalysis;

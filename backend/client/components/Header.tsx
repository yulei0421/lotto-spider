import React from 'react';
import { Statistics } from '../types';
import './Header.css';

interface HeaderProps {
  stats: Statistics | null;
  onStatsClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ stats, onStatsClick }) => {
  return (
    <header className="header">
      <div className="header-content">
        <h1>双色球数据中心</h1>
        <p className="subtitle">历史开奖查询 & 智能随机选号</p>
      </div>
      
      <div className="stats-card">
        <div className="stat-item">
          <span className="stat-label">总期数</span>
          <span className="stat-value">
            {stats?.totalIssues || 'Loading...'}
          </span>
        </div>
        <div className="stat-item">
          <span className="stat-label">最新期号</span>
          <span className="stat-value">
            {stats?.latestIssue || 'Loading...'}
          </span>
        </div>
        <button 
          className="stats-btn"
          onClick={onStatsClick}
          title="查看访问统计"
        >
          📊
        </button>
      </div>
    </header>
  );
};

export default Header;

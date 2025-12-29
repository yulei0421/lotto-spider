import React, { useEffect, useState } from 'react';
import { TrendData } from '../types';
import { api } from '../api';

const TrendChart: React.FC = () => {
  const [trendData, setTrendData] = useState<TrendData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTrendData();
  }, []);

  const loadTrendData = async () => {
    try {
      setLoading(true);
      const data = await api.getTrend(30);
      setTrendData(data);
    } catch (error) {
      console.error('加载走势数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !trendData) {
    return (
      <section className="glass-panel">
        <div className="section-header">
          <h2>📈 近期走势分析</h2>
          <p>数据加载中...</p>
        </div>
        <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ color: '#94a3b8', fontSize: '1rem' }}>⏳ 正在加载走势数据...</div>
        </div>
      </section>
    );
  }

  // 计算统计数据
  const maxValue = Math.max(...trendData.blueData);
  const minValue = Math.min(...trendData.blueData);
  const avgValue = (trendData.blueData.reduce((a, b) => a + b, 0) / trendData.blueData.length).toFixed(1);
  const latestValue = trendData.blueData[trendData.blueData.length - 1];

  return (
    <section className="glass-panel">
      <div className="section-header">
        <h2>📈 近期走势分析</h2>
        <p>最近 30 期蓝球号码分布趋势</p>
      </div>
      
      {/* 折线图可视化 */}
      <div style={{ 
        height: '300px', 
        background: 'rgba(255, 255, 255, 0.02)',
        borderRadius: '8px',
        padding: '1rem',
        position: 'relative',
        marginBottom: '1.5rem'
      }}>
        <svg width="100%" height="100%" style={{ overflow: 'visible' }}>
          {/* 绘制网格线 */}
          {[...Array(17)].map((_, i) => (
            <line
              key={`grid-${i}`}
              x1="0"
              y1={`${(i / 16) * 100}%`}
              x2="100%"
              y2={`${(i / 16) * 100}%`}
              stroke="rgba(255, 255, 255, 0.05)"
              strokeWidth="1"
            />
          ))}
          
          {/* 绘制折线 */}
          <polyline
            points={trendData.blueData.map((value, index) => {
              const x = (index / (trendData.blueData.length - 1)) * 100;
              const y = 100 - ((value / 16) * 100);
              return `${x}%,${y}%`;
            }).join(' ')}
            fill="none"
            stroke="#3b82f6"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          
          {/* 绘制填充区域 */}
          <polygon
            points={[
              '0%,100%',
              ...trendData.blueData.map((value, index) => {
                const x = (index / (trendData.blueData.length - 1)) * 100;
                const y = 100 - ((value / 16) * 100);
                return `${x}%,${y}%`;
              }),
              '100%,100%'
            ].join(' ')}
            fill="rgba(59, 130, 246, 0.1)"
          />
          
          {/* 绘制数据点 */}
          {trendData.blueData.map((value, index) => {
            const x = (index / (trendData.blueData.length - 1)) * 100;
            const y = 100 - ((value / 16) * 100);
            return (
              <g key={`point-${index}`}>
                <circle
                  cx={`${x}%`}
                  cy={`${y}%`}
                  r="4"
                  fill="#3b82f6"
                  stroke="#fff"
                  strokeWidth="2"
                />
                <title>{`${trendData.labels[index]}: ${value.toString().padStart(2, '0')}`}</title>
              </g>
            );
          })}
        </svg>
        
        {/* Y轴标签 */}
        <div style={{ 
          position: 'absolute', 
          left: '-30px', 
          top: '0', 
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          fontSize: '0.75rem',
          color: '#94a3b8'
        }}>
          {[16, 12, 8, 4, 0].map(v => (
            <div key={v}>{v.toString().padStart(2, '0')}</div>
          ))}
        </div>
      </div>

      {/* 最近10期数据表格 */}
      <div style={{ overflowX: 'auto', marginBottom: '1.5rem' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
              <th style={{ padding: '0.75rem', textAlign: 'left', color: '#cbd5e1' }}>期号</th>
              <th style={{ padding: '0.75rem', textAlign: 'center', color: '#cbd5e1' }}>蓝球</th>
            </tr>
          </thead>
          <tbody>
            {trendData.labels.slice(-10).map((label, idx) => {
              const value = trendData.blueData[trendData.blueData.length - 10 + idx];
              return (
                <tr key={label} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                  <td style={{ padding: '0.75rem', color: '#94a3b8', fontFamily: 'monospace' }}>{label}</td>
                  <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                    <span className="ball blue small">{value.toString().padStart(2, '0')}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* 数据统计摘要 */}
      <div style={{ 
        padding: '1rem', 
        background: 'rgba(255, 255, 255, 0.03)',
        borderRadius: '8px',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
        gap: '1rem'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: '0.25rem' }}>最高值</div>
          <div style={{ color: '#3b82f6', fontSize: '1.5rem', fontWeight: '700' }}>
            {maxValue.toString().padStart(2, '0')}
          </div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: '0.25rem' }}>最低值</div>
          <div style={{ color: '#3b82f6', fontSize: '1.5rem', fontWeight: '700' }}>
            {minValue.toString().padStart(2, '0')}
          </div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: '0.25rem' }}>平均值</div>
          <div style={{ color: '#3b82f6', fontSize: '1.5rem', fontWeight: '700' }}>
            {avgValue}
          </div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: '0.25rem' }}>最新值</div>
          <div style={{ color: '#10b981', fontSize: '1.5rem', fontWeight: '700' }}>
            {latestValue.toString().padStart(2, '0')}
          </div>
        </div>
      </div>
    </section>
  );
};

export default TrendChart;

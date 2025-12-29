'use client';

import { useEffect, useState } from 'react';
import { lotteryApi, type TrendData } from '@/lib/api';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function TrendChart() {
  const [trendData, setTrendData] = useState<TrendData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTrendData();
  }, []);

  const loadTrendData = async () => {
    try {
      setLoading(true);
      const response = await lotteryApi.getTrend(30);
      setTrendData(response.data);
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
        <div style={{ height: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ color: '#94a3b8', fontSize: '1rem' }}>⏳ 正在加载走势数据...</div>
        </div>
      </section>
    );
  }

  const chartData = {
    labels: trendData.labels,
    datasets: [
      {
        label: '蓝球号码',
        data: trendData.blueData,
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderWidth: 3,
        tension: 0.3,
        pointRadius: 5,
        pointHoverRadius: 7,
        pointBackgroundColor: '#3b82f6',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointHoverBackgroundColor: '#3b82f6',
        pointHoverBorderColor: '#fff',
        fill: true,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          color: '#fff',
          usePointStyle: true,
          padding: 20,
          font: {
            size: 13,
            weight: '500' as const,
          },
        },
      },
      title: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        titleColor: '#fff',
        bodyColor: '#cbd5e1',
        borderColor: 'rgba(59, 130, 246, 0.3)',
        borderWidth: 1,
        padding: 12,
        displayColors: true,
        callbacks: {
          label: (context: any) => {
            const value = context.parsed.y;
            return `蓝球: ${value.toString().padStart(2, '0')}`;
          },
        },
      },
    },
    scales: {
      y: {
        min: 0,
        max: 17,
        ticks: {
          color: '#a0aec0',
          stepSize: 1,
          font: {
            size: 11,
          },
          callback: (value: any) => {
            return value === 0 ? '' : value.toString().padStart(2, '0');
          },
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.08)',
          drawBorder: false,
        },
        title: {
          display: true,
          text: '蓝球号码 (1-16)',
          color: '#cbd5e1',
          font: {
            size: 12,
            weight: '600' as const,
          },
        },
      },
      x: {
        ticks: {
          color: '#a0aec0',
          maxRotation: 45,
          minRotation: 45,
          font: {
            size: 10,
          },
        },
        grid: {
          display: false,
          drawBorder: false,
        },
        title: {
          display: true,
          text: '期号',
          color: '#cbd5e1',
          font: {
            size: 12,
            weight: '600' as const,
          },
        },
      },
    },
  };

  return (
    <section className="glass-panel">
      <div className="section-header">
        <h2>📈 近期走势分析</h2>
        <p>最近 30 期蓝球号码分布趋势</p>
      </div>
      
      <div style={{ height: '400px', padding: '1rem 0' }}>
        <Line data={chartData} options={options} />
      </div>

      {/* 数据统计摘要 */}
      <div style={{ 
        marginTop: '1.5rem', 
        padding: '1rem', 
        background: 'rgba(255, 255, 255, 0.03)',
        borderRadius: '8px',
        display: 'flex',
        gap: '2rem',
        flexWrap: 'wrap',
        justifyContent: 'center'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: '0.25rem' }}>最高值</div>
          <div style={{ color: '#3b82f6', fontSize: '1.5rem', fontWeight: '700' }}>
            {Math.max(...trendData.blueData).toString().padStart(2, '0')}
          </div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: '0.25rem' }}>最低值</div>
          <div style={{ color: '#3b82f6', fontSize: '1.5rem', fontWeight: '700' }}>
            {Math.min(...trendData.blueData).toString().padStart(2, '0')}
          </div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: '0.25rem' }}>平均值</div>
          <div style={{ color: '#3b82f6', fontSize: '1.5rem', fontWeight: '700' }}>
            {(trendData.blueData.reduce((a, b) => a + b, 0) / trendData.blueData.length).toFixed(1)}
          </div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: '0.25rem' }}>最新值</div>
          <div style={{ color: '#10b981', fontSize: '1.5rem', fontWeight: '700' }}>
            {trendData.blueData[trendData.blueData.length - 1].toString().padStart(2, '0')}
          </div>
        </div>
      </div>
    </section>
  );
}

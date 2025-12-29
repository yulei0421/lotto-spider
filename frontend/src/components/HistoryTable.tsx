'use client';

import { useEffect, useState } from 'react';
import { lotteryApi, type LotteryData, type PaginationResponse } from '@/lib/api';
import styles from './HistoryTable.module.css';

export default function HistoryTable() {
  const [data, setData] = useState<PaginationResponse<LotteryData> | null>(null);
  const [page, setPage] = useState(1);
  const pageSize = 20;

  useEffect(() => {
    loadHistory();
  }, [page]);

  const loadHistory = async () => {
    try {
      const response = await lotteryApi.getHistory(page, pageSize);
      setData(response.data);
    } catch (error) {
      console.error('加载历史数据失败:', error);
    }
  };

  if (!data) return null;

  return (
    <section className="glass-panel">
      <div className={styles.sectionHeader}>
        <h2>📜 历史开奖记录</h2>
        <div className={styles.pagination}>
          <button
            className={styles.pageBtn}
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            &lt;
          </button>
          <span>
            第 {page} / {data.pagination.totalPages} 页
          </span>
          <button
            className={styles.pageBtn}
            onClick={() => setPage(p => Math.min(data.pagination.totalPages, p + 1))}
            disabled={page === data.pagination.totalPages}
          >
            &gt;
          </button>
        </div>
      </div>

      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>期号</th>
              <th>开奖日期</th>
              <th>中奖号码</th>
            </tr>
          </thead>
          <tbody>
            {data.data.map((item) => (
              <tr key={item.issue}>
                <td>{item.issue}</td>
                <td>{item.date}</td>
                <td>
                  <div className={styles.ballsRow}>
                    {item.front.map((num, idx) => (
                      <span key={idx} className="ball red small">
                        {num}
                      </span>
                    ))}
                    <span className="ball blue small">{item.back}</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

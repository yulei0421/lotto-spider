import React, { useEffect, useState } from 'react';
import { LotteryData, PaginationResponse } from '../types';
import { api } from '../api';
import './HistoryTable.css';

const HistoryTable: React.FC = () => {
  const [data, setData] = useState<PaginationResponse<LotteryData> | null>(null);
  const [page, setPage] = useState(1);
  const pageSize = 20;

  useEffect(() => {
    loadHistory();
  }, [page]);

  const loadHistory = async () => {
    try {
      const response = await api.getHistory(page, pageSize);
      setData(response);
    } catch (error) {
      console.error('加载历史数据失败:', error);
    }
  };

  if (!data) return null;

  return (
    <section className="glass-panel">
      <div className="section-header-row">
        <h2>📜 历史开奖记录</h2>
        <div className="pagination">
          <button
            className="page-btn"
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            &lt;
          </button>
          <span>第 {page} / {data.pagination.totalPages} 页</span>
          <button
            className="page-btn"
            onClick={() => setPage(p => Math.min(data.pagination.totalPages, p + 1))}
            disabled={page === data.pagination.totalPages}
          >
            &gt;
          </button>
        </div>
      </div>

      <div className="table-container">
        <table className="history-table">
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
                  <div className="balls-row">
                    {item.front.map((num, idx) => (
                      <span key={idx} className="ball red small">{num}</span>
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
};

export default HistoryTable;

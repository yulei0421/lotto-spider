import React, { useState } from 'react';
import { GeneratedNumber } from '../types';
import { api } from '../api';
import './GeneratorSection.css';

const GeneratorSection: React.FC = () => {
  const [generated, setGenerated] = useState<GeneratedNumber | null>(null);
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const data = await api.generateNumber();
      setGenerated(data);
    } catch (error) {
      console.error('生成号码失败:', error);
      alert('生成号码失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="glass-panel">
      <div className="section-header">
        <h2>🎲 幸运选号器</h2>
        <p>基于历史数据过滤重复组合</p>
      </div>

      <div className="lottery-display">
        <div className="balls-container">
          {generated ? (
            <>
              {generated.frontArea.map((num, idx) => (
                <span key={`red-${idx}`} className="ball red">{num}</span>
              ))}
              <span className="ball blue">{generated.backArea}</span>
            </>
          ) : (
            <>
              {[...Array(6)].map((_, idx) => (
                <span key={`placeholder-red-${idx}`} className="ball red placeholder">?</span>
              ))}
              <span className="ball blue placeholder">?</span>
            </>
          )}
        </div>
        
        {generated && (
          <p className="attempts">尝试次数: {generated.attempts}</p>
        )}
      </div>

      <div className="controls">
        <button className="primary-btn" onClick={handleGenerate} disabled={loading}>
          <span className="btn-text">{loading ? '生成中...' : '生成号码'}</span>
        </button>
      </div>
    </section>
  );
};

export default GeneratorSection;

'use client';

import { useState } from 'react';
import { lotteryApi, type GeneratedNumber } from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import styles from './GeneratorSection.module.css';

export default function GeneratorSection() {
  const [generated, setGenerated] = useState<GeneratedNumber | null>(null);
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const response = await lotteryApi.generateNumber();
      setGenerated(response.data);
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

      <div className={styles.lotteryDisplay}>
        <div className={styles.ballsContainer}>
          <AnimatePresence mode="wait">
            {generated ? (
              <>
                {generated.frontArea.map((num, idx) => (
                  <motion.span
                    key={`red-${idx}`}
                    className="ball red"
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ delay: idx * 0.1, type: 'spring' }}
                  >
                    {num}
                  </motion.span>
                ))}
                <motion.span
                  className="ball blue"
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.6, type: 'spring' }}
                >
                  {generated.backArea}
                </motion.span>
              </>
            ) : (
              <>
                {[...Array(6)].map((_, idx) => (
                  <span key={`placeholder-red-${idx}`} className={`ball red ${styles.placeholder}`}>
                    ?
                  </span>
                ))}
                <span className={`ball blue ${styles.placeholder}`}>?</span>
              </>
            )}
          </AnimatePresence>
        </div>
        
        {generated && (
          <p className={styles.attempts}>
            尝试次数: {generated.attempts}
          </p>
        )}
      </div>

      <div className={styles.controls}>
        <button
          className="primary-btn"
          onClick={handleGenerate}
          disabled={loading}
        >
          <span className="btn-text">
            {loading ? '生成中...' : '生成号码'}
          </span>
        </button>
      </div>
    </section>
  );
}

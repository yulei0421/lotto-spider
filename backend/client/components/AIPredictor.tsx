import React, { useState } from 'react';
import { api } from '../api';
import './AIPredictor.css';

// 声明 brain.js 全局变量
declare global {
  interface Window {
    brain: any;
  }
}

const AIPredictor: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [result, setResult] = useState<{ front: number[]; back: number } | null>(null);

  const loadBrainJS = async () => {
    if (window.brain) return;
    
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/brain.js';
      script.onload = resolve;
      document.head.appendChild(script);
    });
  };

  const runPrediction = async () => {
    setLoading(true);
    setStatus('正在加载 AI 核心库...');
    setResult(null);

    try {
      // 加载 brain.js
      await loadBrainJS();
      
      setStatus('正在获取历史数据...');
      
      // 获取历史数据
      const response = await api.getHistory(1, 100);
      const history = response.data.data.reverse(); // 从旧到新

      if (history.length < 10) {
        throw new Error('历史数据不足，无法训练模型');
      }

      setStatus('神经网络训练中...');

      // 延迟执行，让 UI 更新
      await new Promise(resolve => setTimeout(resolve, 100));

      // 准备训练数据
      const trainingData = [];
      for (let i = 0; i < history.length - 1; i++) {
        const input = [
          ...history[i].front.map(n => parseInt(n) / 33),
          parseInt(history[i].back) / 16
        ];
        const output = [
          ...history[i + 1].front.map(n => parseInt(n) / 33),
          parseInt(history[i + 1].back) / 16
        ];
        trainingData.push({ input, output });
      }

      // 创建并训练神经网络
      const net = new window.brain.NeuralNetwork({
        hiddenLayers: [10, 10],
      });

      net.train(trainingData, {
        iterations: 200,
        errorThresh: 0.005,
      });

      // 预测下一期
      const lastInput = [
        ...history[history.length - 1].front.map(n => parseInt(n) / 33),
        parseInt(history[history.length - 1].back) / 16
      ];

      const output = net.run(lastInput);

      // 处理输出
      let predFront = output.slice(0, 6).map((n: number) => 
        Math.max(1, Math.min(33, Math.round(n * 33)))
      );
      
      const predBack = Math.max(1, Math.min(16, Math.round(output[6] * 16)));

      // 确保红球不重复
      const uniqueFront: number[] = [];
      for (const n of predFront) {
        let value = n;
        while (uniqueFront.includes(value)) {
          value = (value % 33) + 1;
        }
        uniqueFront.push(value);
      }
      uniqueFront.sort((a, b) => a - b);

      setResult({
        front: uniqueFront,
        back: predBack
      });
      setStatus('');
    } catch (error) {
      console.error('AI 预测失败:', error);
      setStatus('运算出错，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="glass-panel">
      <div className="section-header">
        <h2>🤖 AI 深度学习预测</h2>
        <p>基于神经网络模型分析下期概率</p>
      </div>

      <div className="ai-controls">
        <button
          className="primary-btn ai-btn-style"
          onClick={runPrediction}
          disabled={loading}
        >
          <span className="btn-text">
            {loading ? '运算中...' : '开始 AI 模型运算'}
          </span>
        </button>
        
        {status && (
          <div className="status-text">{status}</div>
        )}
      </div>

      {result && (
        <div className="ai-result-container">
          <div className="ai-prediction-row">
            <span className="label">AI 预测:</span>
            <div className="balls-container small-gap">
              {result.front.map((num, idx) => (
                <span key={idx} className="ball red small animate">
                  {num.toString().padStart(2, '0')}
                </span>
              ))}
              <span className="ball blue small animate">
                {result.back.toString().padStart(2, '0')}
              </span>
            </div>
          </div>
          <div className="ai-info">
            <small>* 模型训练基于最近 100 期数据，预测结果仅供娱乐参考</small>
          </div>
        </div>
      )}
    </section>
  );
};

export default AIPredictor;

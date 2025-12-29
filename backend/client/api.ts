import { Statistics, GeneratedNumber, BlueAnalysis, TrendData, SiteStats, LotteryData, PaginationResponse } from './types';

const API_BASE = '/api';

async function fetchJSON<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });
  
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  
  return response.json();
}

export const api = {
  // 获取统计信息
  getStats: () => 
    fetchJSON<Statistics>(`${API_BASE}/lottery/stats`),

  // 获取历史数据
  getHistory: (page: number = 1, pageSize: number = 20) =>
    fetchJSON<PaginationResponse<LotteryData>>(`${API_BASE}/lottery/history?page=${page}&pageSize=${pageSize}`),

  // 生成随机号码
  generateNumber: () =>
    fetchJSON<GeneratedNumber>(`${API_BASE}/lottery/generate`),

  // 获取蓝球分析
  getBlueAnalysis: () =>
    fetchJSON<BlueAnalysis>(`${API_BASE}/lottery/blue-analysis`),

  // 获取走势数据
  getTrend: (limit: number = 30) =>
    fetchJSON<TrendData>(`${API_BASE}/lottery/trend?limit=${limit}`),

  // 记录访问
  recordVisit: () =>
    fetchJSON<SiteStats>(`${API_BASE}/stats`),

  // 获取站点统计
  getSiteStats: () =>
    fetchJSON<SiteStats>(`${API_BASE}/stats`),
};

import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface LotteryData {
  issue: string;
  date: string;
  front: string[];
  back: string;
}

export interface PaginationResponse<T> {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export interface Statistics {
  totalIssues: number;
  latestIssue: string | null;
  latestDate: string | null;
  dateRange: {
    start: string;
    end: string;
  } | null;
}

export interface GeneratedNumber {
  frontArea: string[];
  backArea: string;
  attempts: number;
}

export interface BlueStats {
  number: string;
  count: number;
  omission: number;
  frequency: string;
}

export interface BlueAnalysis {
  blueStats: BlueStats[];
  recommendations: {
    hot: string;
    cold: string;
    coldOmission: number;
  };
}

export interface TrendData {
  labels: string[];
  redData: number[][];
  blueData: number[];
}

export interface SiteStats {
  total: number;
  unique: number;
  recent: Array<{
    ip: string;
    count: number;
    lastTime: string;
    ua: string;
  }>;
}

export const lotteryApi = {
  // 获取历史数据
  getHistory: (page: number = 1, pageSize: number = 20) =>
    apiClient.get<PaginationResponse<LotteryData>>('/api/lottery/history', {
      params: { page, pageSize },
    }),

  // 获取统计信息
  getStats: () =>
    apiClient.get<Statistics>('/api/lottery/stats'),

  // 生成随机号码
  generateNumber: () =>
    apiClient.get<GeneratedNumber>('/api/lottery/generate'),

  // 获取蓝球分析
  getBlueAnalysis: () =>
    apiClient.get<BlueAnalysis>('/api/lottery/blue-analysis'),

  // 获取走势数据
  getTrend: (limit: number = 30) =>
    apiClient.get<TrendData>('/api/lottery/trend', {
      params: { limit },
    }),

  // 触发爬虫
  triggerCrawl: () =>
    apiClient.post('/api/lottery/crawl'),
};

export const statsApi = {
  // 获取站点统计
  getStats: () =>
    apiClient.get<SiteStats>('/api/stats'),
};

export default apiClient;

export interface LotteryData {
  issue: string;
  date: string;
  front: string[];
  back: string;
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

export interface PaginationResponse<T> {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

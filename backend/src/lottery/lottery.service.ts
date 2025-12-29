import { Injectable } from '@nestjs/common';
import * as fs from 'fs-extra';
import * as path from 'path';

export interface LotteryData {
  issue: string;
  date: string;
  front: string[];
  back: string;
}

@Injectable()
export class LotteryService {
  private readonly dataPath = path.join(__dirname, '../../data/ssq-full-data.json');

  /**
   * 读取历史数据
   */
  async loadHistoryData(): Promise<LotteryData[]> {
    try {
      const exists = await fs.pathExists(this.dataPath);
      if (!exists) {
        return [];
      }
      return await fs.readJSON(this.dataPath);
    } catch (error) {
      console.error('读取数据失败:', error);
      return [];
    }
  }

  /**
   * 获取分页历史数据
   */
  async getHistoryData(page: number = 1, pageSize: number = 20) {
    const allData = await this.loadHistoryData();
    const total = allData.length;
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    
    // 倒序显示（最新的在前）
    const reversedData = [...allData].reverse();
    const data = reversedData.slice(start, end);

    return {
      data,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  /**
   * 获取统计信息
   */
  async getStatistics() {
    const allData = await this.loadHistoryData();
    
    if (allData.length === 0) {
      return {
        totalIssues: 0,
        latestIssue: null,
        latestDate: null,
        dateRange: null,
      };
    }

    const latest = allData[allData.length - 1];
    const oldest = allData[0];

    return {
      totalIssues: allData.length,
      latestIssue: latest.issue,
      latestDate: latest.date,
      dateRange: {
        start: oldest.date,
        end: latest.date,
      },
    };
  }

  /**
   * 生成随机号码（过滤历史重复）
   */
  async generateFilteredNumber() {
    const historicalData = await this.loadHistoryData();
    
    let frontArea: string[];
    let backArea: string;
    let attempts = 0;
    const maxAttempts = 10000;

    do {
      attempts++;
      
      // 生成前区6个不重复号码
      const frontSet = new Set<number>();
      while (frontSet.size < 6) {
        frontSet.add(this.getRandomNum(1, 33));
      }
      const frontNums = Array.from(frontSet).sort((a, b) => a - b);
      frontArea = frontNums.map(n => n.toString().padStart(2, '0'));
      
      // 生成后区号码
      const backNum = this.getRandomNum(1, 16);
      backArea = backNum.toString().padStart(2, '0');
      
      if (attempts > maxAttempts) {
        console.warn('生成号码尝试次数过多');
        break;
      }
    } while (this.isDuplicate(frontArea, backArea, historicalData));

    return {
      frontArea,
      backArea,
      attempts,
    };
  }

  /**
   * 获取蓝球分析数据
   */
  async getBlueAnalysis() {
    const allData = await this.loadHistoryData();
    
    if (allData.length === 0) {
      return { blueStats: [], recommendations: {} };
    }

    // 统计每个蓝球的出现次数和遗漏
    const blueMap = new Map<string, { count: number; lastIndex: number }>();
    
    for (let i = 0; i < allData.length; i++) {
      const blue = allData[i].back;
      if (!blueMap.has(blue)) {
        blueMap.set(blue, { count: 0, lastIndex: -1 });
      }
      const stat = blueMap.get(blue);
      stat.count++;
      stat.lastIndex = i;
    }

    // 计算遗漏期数
    const blueStats = [];
    for (let i = 1; i <= 16; i++) {
      const blue = i.toString().padStart(2, '0');
      const stat = blueMap.get(blue) || { count: 0, lastIndex: -1 };
      const omission = allData.length - 1 - stat.lastIndex;
      
      blueStats.push({
        number: blue,
        count: stat.count,
        omission,
        frequency: (stat.count / allData.length * 100).toFixed(2),
      });
    }

    // 排序：按遗漏期数降序
    blueStats.sort((a, b) => b.omission - a.omission);

    // 推荐
    const hottest = [...blueStats].sort((a, b) => b.count - a.count)[0];
    const coldest = blueStats[0];
    
    return {
      blueStats,
      recommendations: {
        hot: hottest.number,
        cold: coldest.number,
        coldOmission: coldest.omission,
      },
    };
  }

  /**
   * 获取走势图数据
   */
  async getTrendData(limit: number = 30) {
    const allData = await this.loadHistoryData();
    const recentData = allData.slice(-limit);

    return {
      labels: recentData.map(item => item.issue),
      redData: recentData.map(item => item.front.map(Number)),
      blueData: recentData.map(item => Number(item.back)),
    };
  }

  // ===== 辅助方法 =====
  
  private getRandomNum(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  private isDuplicate(
    newFront: string[],
    newBack: string,
    historicalData: LotteryData[],
  ): boolean {
    return historicalData.some(item => {
      const frontMatch = JSON.stringify(item.front) === JSON.stringify(newFront);
      const backMatch = item.back === newBack;
      return frontMatch && backMatch;
    });
  }
}

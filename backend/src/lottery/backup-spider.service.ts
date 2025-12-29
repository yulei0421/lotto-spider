import { Injectable } from '@nestjs/common';
import axios from 'axios';
import * as cheerio from 'cheerio';
import * as fs from 'fs-extra';
import * as path from 'path';

interface FormattedLotteryItem {
  issue: string;
  date: string;
  front: string[];
  back: string;
}

/**
 * 备用爬虫服务 - 使用网页爬取方式
 */
@Injectable()
export class BackupSpiderService {
  private readonly dataPath = path.join(__dirname, '../../data/ssq-full-data.json');

  /**
   * 方法1: 使用彩票官网的网页版
   */
  async crawlFromWebPage() {
    console.log('🔄 使用备用方案：网页爬取...');
    
    const url = 'https://www.cwl.gov.cn/ygkj/wqkjgg/ssq/';
    
    try {
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'zh-CN,zh;q=0.9',
        },
        timeout: 10000,
      });

      const $ = cheerio.load(response.data);
      const results: FormattedLotteryItem[] = [];

      // 解析网页中的开奖数据
      $('.ball_box01').each((index, element) => {
        // 这里需要根据实际网页结构调整选择器
        const issue = $(element).find('.qihao').text().trim();
        const date = $(element).find('.date').text().trim();
        const redBalls = $(element).find('.red').map((i, el) => $(el).text().trim()).get();
        const blueBall = $(element).find('.blue').text().trim();

        if (issue && redBalls.length === 6 && blueBall) {
          results.push({
            issue,
            date,
            front: redBalls.map(n => n.padStart(2, '0')),
            back: blueBall.padStart(2, '0'),
          });
        }
      });

      console.log(`✅ 网页爬取成功，获取 ${results.length} 条数据`);
      return results;
    } catch (error) {
      console.error('❌ 网页爬取失败:', error.message);
      return [];
    }
  }

  /**
   * 方法2: 使用第三方API（示例）
   */
  async crawlFromThirdParty() {
    console.log('🔄 使用备用方案：第三方API...');
    
    // 这里可以添加其他可靠的第三方数据源
    // 例如: https://api.example.com/lottery/ssq
    
    console.log('⚠️ 第三方API未配置');
    return [];
  }

  /**
   * 生成模拟数据（仅用于测试）
   */
  async generateMockData(count: number = 100): Promise<FormattedLotteryItem[]> {
    console.log(`🧪 生成 ${count} 条模拟数据用于测试...`);
    
    const results: FormattedLotteryItem[] = [];
    const startDate = new Date('2020-01-01');
    
    for (let i = 0; i < count; i++) {
      const issue = (2020001 + i).toString();
      const date = new Date(startDate.getTime() + i * 3 * 24 * 60 * 60 * 1000);
      
      // 生成随机红球（6个不重复的1-33）
      const redSet = new Set<number>();
      while (redSet.size < 6) {
        redSet.add(Math.floor(Math.random() * 33) + 1);
      }
      const front = Array.from(redSet)
        .sort((a, b) => a - b)
        .map(n => n.toString().padStart(2, '0'));
      
      // 生成随机蓝球（1-16）
      const back = (Math.floor(Math.random() * 16) + 1).toString().padStart(2, '0');
      
      results.push({
        issue,
        date: date.toISOString().split('T')[0],
        front,
        back,
      });
    }
    
    // 保存模拟数据
    await fs.ensureDir(path.dirname(this.dataPath));
    await fs.writeJSON(this.dataPath, results, { spaces: 2 });
    
    console.log(`✅ 模拟数据已生成并保存到 ${this.dataPath}`);
    return results;
  }
}

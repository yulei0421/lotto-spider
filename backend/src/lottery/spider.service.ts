import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import axios from 'axios';
import * as fs from 'fs-extra';
import * as path from 'path';

interface RawLotteryItem {
  code: string;
  date: string;
  red: string;
  blue: string;
}

interface FormattedLotteryItem {
  issue: string;
  date: string;
  front: string[];
  back: string;
}

@Injectable()
export class SpiderService {
  private readonly API_URL = 'https://www.cwl.gov.cn/cwl_admin/front/cwlkj/search/kjxx/findDrawNotice';
  private readonly dataPath = path.join(__dirname, '../../data/ssq-full-data.json');

  private readonly REQ_PARAMS = {
    name: 'ssq',
    issueCount: '',
    issueStart: '',
    issueEnd: '',
    dayStart: '',
    dayEnd: '',
    pageNo: 1,
    pageSize: 1000,
    week: '',
    systemType: 'PC',
  };

  private readonly HEADERS = {
    'Accept': 'application/json, text/javascript, */*; q=0.01',
    'Accept-Language': 'zh-CN,zh;q=0.9',
    'Connection': 'keep-alive',
    'Referer': 'https://www.cwl.gov.cn/ygkj/wqkjgg/ssq/',
    'Sec-Fetch-Dest': 'empty',
    'Sec-Fetch-Mode': 'cors',
    'Sec-Fetch-Site': 'same-origin',
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36',
    'X-Requested-With': 'XMLHttpRequest',
    'sec-ch-ua': '"Google Chrome";v="143", "Chromium";v="143", "Not A(Brand";v="24"',
    'sec-ch-ua-mobile': '?0',
    'sec-ch-ua-platform': '"macOS"',
    'Cookie': 'HMF_CI=a680c06d490ee910ac1919762e2c9f457e2936990011af69eb9b656350b08d633e56876376cda16a2ff34ab273e27890813bb4310ba3a5789c2920e03a898fe0f2; 21_vq=20',
  };

  /**
   * 定时任务：每天凌晨2点自动爬取
   */
  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async handleCron() {
    console.log('⏰ 定时爬取任务启动...');
    await this.crawlAllData();
  }

  /**
   * 爬取所有数据
   */
  async crawlAllData() {
    console.log('🚀 开始爬取双色球历史数据...');
    console.log(`📍 目标 URL: ${this.API_URL}`);
    
    let allData: FormattedLotteryItem[] = [];
    let pageNo = 1;
    let totalCount = 0;

    try {
      // 第一页
      const firstPage = await this.fetchPage(pageNo);
      if (firstPage.data.length === 0) {
        console.error('❌ 第一页数据获取失败');
        return;
      }

      allData = [...firstPage.data];
      totalCount = firstPage.total;
      console.log(`✅ 第${pageNo}页爬取完成，新增${firstPage.data.length}条，累计${allData.length}条（总${totalCount}条）`);

      // 计算总页数
      const totalPages = Math.ceil(totalCount / this.REQ_PARAMS.pageSize);
      
      if (totalPages <= 1) {
        console.log('📌 仅1页数据，无需继续爬取');
      } else {
        // 爬取剩余页面
      for (pageNo = 2; pageNo <= totalPages; pageNo++) {
        await this.sleep(1000); // 请求间隔，防封
        const pageData = await this.fetchPage(pageNo);
        
        if (pageData.data.length === 0) {
          console.warn(`⚠️ 第${pageNo}页无数据，跳过`);
          continue;
        }
        
        allData = [...allData, ...pageData.data];
        console.log(`✅ 第${pageNo}页爬取完成，新增${pageData.data.length}条，累计${allData.length}条`);
      }
      }

      // 去重并排序
      const uniqueData = this.deduplicateAndSort(allData);
      
      // 保存数据
      await fs.ensureDir(path.dirname(this.dataPath));
      await fs.writeJSON(this.dataPath, uniqueData, { spaces: 2 });

      console.log(`\n🎉 爬取完成！`);
      console.log(`📊 最终数据量：${uniqueData.length}期`);
      console.log(`💾 保存路径：${this.dataPath}`);
      console.log(`📅 时间范围：${uniqueData[0]?.date} ~ ${uniqueData[uniqueData.length - 1]?.date}`);
      
      return uniqueData;
    } catch (error) {
      console.error('❌ 爬取失败:', error.message);
      throw error;
    }
  }

  /**
   * 爬取单页数据
   */
  private async fetchPage(pageNo: number): Promise<{ data: FormattedLotteryItem[]; total: number }> {
    try {
      console.log(`📡 正在请求第${pageNo}页...`);
      
      const response = await axios.get(this.API_URL, {
        params: { ...this.REQ_PARAMS, pageNo },
        headers: this.HEADERS,
        timeout: 15000,
        maxRedirects: 5,
        validateStatus: (status) => status < 500, // 允许处理 4xx 错误
      });

      // 详细的错误日志
      if (response.status !== 200) {
        console.error(`❌ HTTP 状态码: ${response.status}`);
        console.error(`响应数据:`, response.data);
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      if (!response.data || response.data.state !== 0) {
        console.error(`❌ 接口返回异常:`, response.data);
        throw new Error(`接口返回异常：${response.data?.message || '未知错误'}`);
      }

      if (!response.data.result || !Array.isArray(response.data.result)) {
        console.error(`❌ 数据格式异常:`, response.data);
        throw new Error('返回数据格式不正确');
      }

      const formattedData = response.data.result.map((item: RawLotteryItem) => 
        this.formatItem(item)
      );

      console.log(`✓ 第${pageNo}页请求成功，获取 ${formattedData.length} 条数据`);

      return {
        data: formattedData,
        total: response.data.total || 0,
      };
    } catch (error) {
      if (error.response) {
        console.error(`❌ 第${pageNo}页爬取失败: HTTP ${error.response.status}`);
        console.error(`响应头:`, error.response.headers);
        console.error(`响应数据:`, error.response.data);
      } else if (error.request) {
        console.error(`❌ 第${pageNo}页爬取失败: 无响应`);
        console.error(`请求配置:`, error.config);
      } else {
        console.error(`❌ 第${pageNo}页爬取失败:`, error.message);
      }
      return { data: [], total: 0 };
    }
  }

  /**
   * 格式化单条数据
   */
  private formatItem(item: RawLotteryItem): FormattedLotteryItem {
    const redBalls = item.red
      .split(',')
      .map(num => num.padStart(2, '0'))
      .sort((a, b) => parseInt(a) - parseInt(b));
    
    const blueBall = item.blue.padStart(2, '0');

    return {
      issue: item.code,
      date: item.date.replace(/\(\w+\)/, ''),
      front: redBalls,
      back: blueBall,
    };
  }

  /**
   * 去重并排序
   */
  private deduplicateAndSort(data: FormattedLotteryItem[]): FormattedLotteryItem[] {
    const uniqueMap = new Map<string, FormattedLotteryItem>();
    data.forEach(item => {
      uniqueMap.set(item.issue, item);
    });
    
    const uniqueData = Array.from(uniqueMap.values());
    uniqueData.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    return uniqueData;
  }

  /**
   * 延迟函数
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

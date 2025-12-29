import { Controller, Get, Query, Post } from '@nestjs/common';
import { LotteryService } from './lottery.service';
import { SpiderService } from './spider.service';

@Controller('api/lottery')
export class LotteryController {
  constructor(
    private readonly lotteryService: LotteryService,
    private readonly spiderService: SpiderService,
  ) {}

  /**
   * 获取历史数据（分页）
   */
  @Get('history')
  async getHistory(
    @Query('page') page: number = 1,
    @Query('pageSize') pageSize: number = 20,
  ) {
    return this.lotteryService.getHistoryData(page, pageSize);
  }

  /**
   * 获取统计信息
   */
  @Get('stats')
  async getStats() {
    return this.lotteryService.getStatistics();
  }

  /**
   * 生成随机号码（过滤历史重复）
   */
  @Get('generate')
  async generateNumber() {
    return this.lotteryService.generateFilteredNumber();
  }

  /**
   * 获取蓝球分析数据
   */
  @Get('blue-analysis')
  async getBlueAnalysis() {
    return this.lotteryService.getBlueAnalysis();
  }

  /**
   * 获取走势图数据（最近N期）
   */
  @Get('trend')
  async getTrend(@Query('limit') limit: number = 30) {
    return this.lotteryService.getTrendData(limit);
  }

  /**
   * 手动触发爬虫
   */
  @Post('crawl')
  async triggerCrawl() {
    await this.spiderService.crawlAllData();
    return { success: true, message: '爬取任务已启动' };
  }
}

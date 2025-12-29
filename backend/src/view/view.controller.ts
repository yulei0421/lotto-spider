import { Controller, Get, Render, Req } from '@nestjs/common';
import { Request } from 'express';
import { LotteryService } from '../lottery/lottery.service';

@Controller()
export class ViewController {
  constructor(private readonly lotteryService: LotteryService) {}

  @Get()
  @Render('index')
  async renderHome(@Req() req: Request) {
    // 获取初始数据用于 SSR
    const stats = await this.lotteryService.getStatistics();
    
    return {
      title: '双色球数据中心',
      stats: JSON.stringify(stats),
    };
  }
}

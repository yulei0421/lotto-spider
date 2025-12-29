import { Controller, Get, Req } from '@nestjs/common';
import { StatsService } from './stats.service';
import { Request } from 'express';

@Controller('api/stats')
export class StatsController {
  constructor(private readonly statsService: StatsService) {}

  /**
   * 记录访问并返回统计数据
   */
  @Get()
  async getStats(@Req() req: Request) {
    const clientIP = this.getClientIP(req);
    const userAgent = req.headers['user-agent'] || '';
    
    await this.statsService.logAccess(clientIP, userAgent);
    return this.statsService.getStatistics();
  }

  /**
   * 获取客户端真实IP
   */
  private getClientIP(req: Request): string {
    return (
      (req.headers['cf-connecting-ip'] as string) ||
      (req.headers['x-forwarded-for'] as string)?.split(',')[0] ||
      req.socket.remoteAddress ||
      'unknown'
    );
  }
}

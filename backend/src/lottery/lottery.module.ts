import { Module } from '@nestjs/common';
import { LotteryController } from './lottery.controller';
import { LotteryService } from './lottery.service';
import { SpiderService } from './spider.service';
import { BackupSpiderService } from './backup-spider.service';

@Module({
  controllers: [LotteryController],
  providers: [LotteryService, SpiderService, BackupSpiderService],
  exports: [LotteryService],
})
export class LotteryModule {}

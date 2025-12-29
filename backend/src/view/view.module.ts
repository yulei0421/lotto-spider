import { Module } from '@nestjs/common';
import { ViewController } from './view.controller';
import { LotteryModule } from '../lottery/lottery.module';

@Module({
  imports: [LotteryModule],
  controllers: [ViewController],
})
export class ViewModule {}

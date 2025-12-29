import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { LotteryModule } from './lottery/lottery.module';
import { StatsModule } from './stats/stats.module';
import { ViewModule } from './view/view.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'public'),
      serveRoot: '/public',
    }),
    LotteryModule,
    StatsModule,
    ViewModule,
  ],
})
export class AppModule {}

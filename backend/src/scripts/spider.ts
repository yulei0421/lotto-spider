/**
 * 独立爬虫脚本
 * 使用方式: npm run spider
 */
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { SpiderService } from '../lottery/spider.service';

async function runSpider() {
  console.log('🕷️ 启动爬虫脚本...\n');
  
  const app = await NestFactory.createApplicationContext(AppModule);
  const spiderService = app.get(SpiderService);
  
  try {
    await spiderService.crawlAllData();
    console.log('\n✅ 爬虫任务完成');
  } catch (error) {
    console.error('\n❌ 爬虫任务失败:', error);
  } finally {
    await app.close();
  }
}

runSpider();

import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { BackupSpiderService } from '../lottery/backup-spider.service';

async function generateMockData() {
  console.log('🧪 启动模拟数据生成脚本...\n');
  
  const app = await NestFactory.createApplicationContext(AppModule);
  const backupSpider = app.get(BackupSpiderService);
  
  try {
    // 生成 500 条模拟数据
    await backupSpider.generateMockData(500);
    console.log('\n✅ 模拟数据生成完成');
    console.log('💡 提示: 这是测试数据，不是真实开奖数据');
  } catch (error) {
    console.error('\n❌ 生成失败:', error);
  } finally {
    await app.close();
  }
}

generateMockData();

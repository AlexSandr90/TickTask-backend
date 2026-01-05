import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DeadlineCheckerService } from './modules/notifications/deadline-checker.service';

async function bootstrap() {
  console.log('🚀 Запуск тестовой проверки дедлайнов...\n');

  const app = await NestFactory.createApplicationContext(AppModule);

  try {
    const deadlineChecker = app.get(DeadlineCheckerService);
    await deadlineChecker.testNotificationsNow();
    console.log('\n✅ Проверка успешно завершена');
  } catch (error) {
    console.error('❌ Ошибка при проверке:', error);
  } finally {
    await app.close();
  }
}

bootstrap().catch((error) => {
  console.error('Критическая ошибка:', error);
  process.exit(1);
});

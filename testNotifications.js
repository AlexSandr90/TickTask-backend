import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function testNotifications() {
  // Создаём тестового пользователя
  const user = await prisma.user.create({
    data: {
      username: 'test_user',
      email: 'test@example.com',
      passwordHash: 'test_hash',
    },
  });

  console.log('User created:', user);

  // Создаём device token
  const deviceToken = await prisma.deviceToken.create({
    data: {
      userId: user.id,
      token: 'sample_token_123',
      platform: 'WEB',
    },
  });

  console.log('DeviceToken created:', deviceToken);

  // Создаём уведомление
  const notification = await prisma.notification.create({
    data: {
      userId: user.id,
      type: 'TASK_ASSIGNED',
      title: 'Test Notification',
      message: 'Это тестовое уведомление',
    },
  });

  console.log('Notification created:', notification);

  // Получаем уведомления пользователя
  const notifications = await prisma.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
  });

  console.log('Notifications fetched:', notifications);
}

testNotifications()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

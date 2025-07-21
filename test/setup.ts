import { Test, TestingModule } from '@nestjs/testing';
import { AuthModule } from '../src/modules/auth/auth.module';
import { PrismaService } from '../prisma/prisma.service';

export async function setupDatabase(): Promise<TestingModule> {
  process.env.DATABASE_URL =
    process.env.DATABASE_TEST_URL ||
    'postgresql://test:test@localhost:5432/test_db';

  const moduleRef = await Test.createTestingModule({
    imports: [AuthModule],
  }).compile();

  const app = moduleRef.createNestApplication();
  await app.init();

  const prisma = moduleRef.get<PrismaService>(PrismaService);
  await prisma.$connect();

  return moduleRef;
}

export async function cleanupDatabase(moduleRef: TestingModule): Promise<void> {
  const prisma = moduleRef.get<PrismaService>(PrismaService);

  await prisma.user.deleteMany();

  await prisma.$disconnect();
  await moduleRef.close();
}

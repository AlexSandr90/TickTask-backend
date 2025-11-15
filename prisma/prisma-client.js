const { PrismaClient } = require('prisma-client');

// Инициализируем Prisma Client с опцией логирования запросов
const prisma = new PrismaClient({
  // 'query' заставит Prisma выводить каждый SQL-запрос и его длительность
  log: ['query'],
});

module.exports = { prisma };
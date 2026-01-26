# TickTask Backend 🛠️

**Production-ready Nest.js API** для task management app (taskcraft.click)

## ✨ Features
- **REST API**: Users, Auth, Tasks (full CRUD)
- **Authentication**: JWT + token refresh (Clerk integration)
- **Database**: PostgreSQL + Prisma ORM (migrations)
- **Validation**: class-validator + class-transformer
- **Docs**: Swagger UI (`/api`)
- **Tests**: Jest e2e coverage
- **Deploy**: Render/Vercel production

## 🛋️ Live Demo
Frontend: https://taskcraft.click/
Backend API: https://api.taskcraft.click (Swagger: /api)

## 🚀 Quick Start
```bash
git clone https://github.com/AlexSandr90/TickTask-backend
cd TickTask-backend
npm install
cp .env.example .env  # PostgreSQL config
npm run db:migrate
npm run start:dev


##  📁 Tech Stack
Nest.js 10+ | Prisma ORM | PostgreSQL 16
JWT/Clerk | Swagger | Jest | class-validator

##  🏗️ Architecture (80% mine)
src/
├── auth/ (guards, strategies)
├── tasks/ (CRUD controllers/services)
├── users/ (modules)
└── common/ (pipes, decorators)

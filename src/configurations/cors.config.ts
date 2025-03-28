import { INestApplication } from "@nestjs/common";

export function configureCors(app: INestApplication) {
  app.enableCors({
    origin: process.env.FRONTEND_URL
      ? process.env.FRONTEND_URL.split(",")
      : ["http://localhost:3000", "http://localhost:4200"],
    methods: "GET,POST,PUT,DELETE,PATCH,OPTIONS",
    allowedHeaders: "Content-Type, Authorization, Cookie",
    credentials: true,
  });
}

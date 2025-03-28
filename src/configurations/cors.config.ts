export function configureCors(app) {
  app.enableCors({
    origin:
      process.env.NODE_ENV === 'production'
        ? [process.env.BACKEND_BASE_URL]
        : ['http://localhost:3000', 'http://localhost:4200'],

    methods: 'GET,POST,PUT,DELETE, PATCH, OPTIONS',
    allowedHeaders: 'Content-Type, Authorization, Cookie',
    credentials: true,
  });
}

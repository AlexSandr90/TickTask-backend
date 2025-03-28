export function configureCors(app) {
  app.enableCors({
    origin:
      process.env.NODE_ENV === 'production'
        ? ['https://your-frontend-app.com']
        : ['http://localhost:3000', 'http://localhost:4200', '*'],

    methods: 'GET,POST,PUT,DELETE, PATCH, OPTIONS',
    allowedHeaders: 'Content-Type, Authorization, Cookie',
    credentials: true,
  });
}

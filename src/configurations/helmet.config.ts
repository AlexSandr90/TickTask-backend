import helmet from 'helmet';

export function configureHelmet(app: any) {
  app.use(
    helmet({
      crossOriginEmbedderPolicy: false,
      contentSecurityPolicy: {
        directives: {
          imgSrc: [`'self'`, 'data:', 'localhost:*'],
          scriptSrc: [`'self'`, `'unsafe-inline'`, 'localhost:*'],
          styleSrc: [`'self'`, `'unsafe-inline'`, 'localhost:*'],
        },
      },
    }),
  );
}

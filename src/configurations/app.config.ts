import * as dotenv from 'dotenv';

dotenv.config();

export const APP_CONFIG = {
  secretJWT: process.env.SECRET_JWT,
  secretJwtRefresh: process.env.SECRET_REFRESH,
  expireJwt: process.env.EXPIRY_JWT,
  expireJwtRefresh: process.env.EXPIRY_JWT_REFRESH,
};

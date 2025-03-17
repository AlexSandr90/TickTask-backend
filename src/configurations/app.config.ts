import * as dotenv from 'dotenv';

dotenv.config();

export const APP_CONFIG = {
  secretJWT: process.env.SECRET,
  secretJwtRefresh: process.env.SECRET_REFRESH,
  expireJwt: process.env.EXPIRE_JWT,
  expireJwtRefresh: process.env.EXPIRE_JWT_REFRESH,
};

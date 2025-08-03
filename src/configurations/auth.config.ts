import * as dotenv from 'dotenv';

dotenv.config();

export const AUTH_CONFIG = {
  secretJWT: process.env.SECRET,
  secretJwtRefresh: process.env.SECRET_REFRESH,
  expireJwt: Number(process.env.EXPIRE_JWT) * 1000,
  expireJwtRefresh: Number(process.env.EXPIRE_JWT_REFRESH) * 1000,
};

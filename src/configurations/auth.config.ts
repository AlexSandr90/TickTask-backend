import * as dotenv from 'dotenv';

dotenv.config();

export const TOKEN_CONFIG = {
  imports: [],
  secret: process.env.SECRET,
  signOptions: { expiresIn: process.env.EXPIRY_JWT },
  global: true,
  inject: [],
};

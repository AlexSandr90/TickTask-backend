import * as dotenv from 'dotenv';

dotenv.config();

export const APP_CONFIG = {
  baseUrl: process.env.BASE_URL,
}
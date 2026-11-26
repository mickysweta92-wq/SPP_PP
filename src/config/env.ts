import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env'), quiet: true });

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing environment variable "${name}". Copy .env.example to .env and fill it in.`);
  }
  return value;
}

export const env = {
  baseUrl: process.env.BASE_URL ?? 'https://spp.prm-uat.com',
  get email(): string {
    return required('SPP_EMAIL');
  },
  get password(): string {
    return required('SPP_PASSWORD');
  },
};

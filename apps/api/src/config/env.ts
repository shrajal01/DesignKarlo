import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { z } from 'zod';

// Resolve possible .env paths across repository root and workspace
const rootEnvPath = path.resolve(__dirname, '../../../../.env');
const rootEnvLocalPath = path.resolve(__dirname, '../../../../.env.local');
const appEnvPath = path.resolve(__dirname, '../../.env');
const appEnvLocalPath = path.resolve(__dirname, '../../.env.local');
const cwdEnvPath = path.resolve(process.cwd(), '.env');

// Prioritize root .env files so workspace commands (e.g. npm run dev / dev:api)
// load repository-level configuration reliably.
const envFilesToLoad = [
  rootEnvLocalPath,
  rootEnvPath,
  appEnvLocalPath,
  appEnvPath,
  cwdEnvPath,
];

for (const envFile of envFilesToLoad) {
  if (fs.existsSync(envFile)) {
    dotenv.config({ path: envFile });
  }
}

const envSchema = z.object({
  PORT: z
    .string()
    .default('5000')
    .transform((val) => parseInt(val, 10)),
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  API_PREFIX: z.string().default('/api'),
  CLIENT_URL: z.string().default('http://localhost:5173'),
  MONGODB_URI: z
    .preprocess(
      (val) => (typeof val === 'string' && val.trim() === '' ? undefined : typeof val === 'string' ? val.trim() : val),
      z.string().default('mongodb://localhost:27017/designkarlo')
    ),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error('Invalid environment variables:', parsedEnv.error.format());
  process.exit(1);
}

export const env = parsedEnv.data;
export type Env = z.infer<typeof envSchema>;

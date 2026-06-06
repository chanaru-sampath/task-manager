import { config as loadEnv } from 'dotenv';
import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';

loadEnv({ path: '.env.local' });
loadEnv();

const url = process.env.DB_FILE_NAME;
if (!url) {
  throw new Error('DB_FILE_NAME is not set. Did you create backend/.env.local?');
}

const client = createClient({ url });

export const db = drizzle(client);
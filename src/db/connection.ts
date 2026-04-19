import { drizzle, type PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

export const DB_PROVIDER = Symbol('DATABASE');

const client = postgres(process.env.DATABASE_URL!);

export const db = drizzle(client, { schema });
export type Database = PostgresJsDatabase<typeof schema>;

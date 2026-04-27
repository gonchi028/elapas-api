import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { hash, compare } from 'bcryptjs';
import { db } from '../db/connection';

export const auth = betterAuth({
  trustedOrigins: ['http://localhost:5173', 'http://localhost:3000'],
  advanced: {
    disableCSRFCheck: true,
  },
  database: drizzleAdapter(db, {
    provider: 'pg',
  }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    password: {
      hash: async (password: string) => hash(password, 10),
      verify: async ({ hash, password }) => compare(password, hash),
    },
  },
  user: {
    additionalFields: {
      role: {
        type: 'string',
        required: false,
        defaultValue: 'ciudadano',
        input: false,
      },
      estado: {
        type: 'boolean',
        required: false,
        defaultValue: true,
        input: false,
      },
    },
  },
});

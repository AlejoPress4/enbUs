import { neon } from '@neondatabase/serverless';

export default defineEventHandler(async () => {
  const sql = neon(process.env.DATABASE_URL!);
  const rows = await sql`SELECT version()`;
  const response = rows[0];
  return { version: response?.version || 'Unknown version' };
});

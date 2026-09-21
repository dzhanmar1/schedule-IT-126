import pg from 'pg';

const connectionString = 'postgres://postgres:pLl0sZRSpmB7vHYL@db.qqjfiasxblsdgvaspjed.supabase.co:5432/postgres';

const pool = new pg.Pool({
  connectionString,
  ssl: { rejectUnauthorized: false }
});

const sql = `
ALTER TABLE public.lesson_templates ADD COLUMN IF NOT EXISTS valid_from DATE DEFAULT CURRENT_DATE;
ALTER TABLE public.lesson_templates ADD COLUMN IF NOT EXISTS valid_until DATE DEFAULT NULL;
`;

async function run() {
  try {
    console.log("Running history linkage migration...");
    await pool.query(sql);
    console.log("Migration successfully applied!");
  } catch (e) {
    console.error("Migration failed:", e);
  } finally {
    await pool.end();
  }
}

run();

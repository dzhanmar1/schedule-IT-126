import pg from 'pg';

const connectionString = 'postgres://postgres:pLl0sZRSpmB7vHYL@db.qqjfiasxblsdgvaspjed.supabase.co:5432/postgres';

const pool = new pg.Pool({
  connectionString,
  ssl: { rejectUnauthorized: false }
});

const sql = `
ALTER TABLE public.lesson_templates ADD COLUMN IF NOT EXISTS teacher_id UUID REFERENCES public.teachers(id) ON DELETE SET NULL;
ALTER TABLE public.lesson_exceptions ADD COLUMN IF NOT EXISTS new_teacher_id UUID REFERENCES public.teachers(id) ON DELETE SET NULL;
`;

async function run() {
  try {
    console.log("Running teacher linkage migration...");
    await pool.query(sql);
    console.log("Migration successfully applied!");
  } catch (e) {
    console.error("Migration failed:", e);
  } finally {
    await pool.end();
  }
}

run();

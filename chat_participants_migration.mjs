import pg from 'pg';

const connectionString = 'postgres://postgres.qqjfiasxblsdgvaspjed:pLl0sZRSpmB7vHYL@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres';

const pool = new pg.Pool({
  connectionString,
  ssl: { rejectUnauthorized: false }
});

const sql = `
-- Create chat participants table for direct messages
CREATE TABLE IF NOT EXISTS public.chat_participants (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    room_id UUID REFERENCES public.chat_rooms(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(room_id, user_id)
);

ALTER TABLE public.chat_participants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all for users" ON public.chat_participants FOR ALL USING (auth.role() = 'authenticated');
`;

async function migrate() {
  const client = await pool.connect();
  try {
    console.log('Starting chat_participants migration...');
    
    await client.query('BEGIN');
    await client.query(sql);
    await client.query('COMMIT');
    
    console.log('Migration successful!');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();

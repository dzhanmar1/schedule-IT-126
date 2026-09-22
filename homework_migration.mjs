import pg from 'pg';

const connectionString = 'postgres://postgres.qqjfiasxblsdgvaspjed:pLl0sZRSpmB7vHYL@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres';

const pool = new pg.Pool({
  connectionString,
  ssl: { rejectUnauthorized: false }
});

const sql = `
-- Create homework table
CREATE TABLE IF NOT EXISTS public.homework (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    group_id UUID REFERENCES public.groups(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    subject TEXT NOT NULL,
    description TEXT NOT NULL,
    due_date DATE,
    is_group BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create homework completions table
CREATE TABLE IF NOT EXISTS public.homework_completions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    homework_id UUID REFERENCES public.homework(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(homework_id, user_id)
);

-- Enable RLS and create basic policies (assuming simple access for now, but keeping RLS enabled)
ALTER TABLE public.homework ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.homework_completions ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read/write for now to avoid RLS blockages on MVP
CREATE POLICY "Enable all for users" ON public.homework FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable all for users" ON public.homework_completions FOR ALL USING (auth.role() = 'authenticated');

-- Update chat_rooms RLS similarly to avoid issues with direct messaging creation
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'chat_rooms' AND policyname = 'Enable all for users'
    ) THEN
        CREATE POLICY "Enable all for users" ON public.chat_rooms FOR ALL USING (auth.role() = 'authenticated');
    END IF;
END $$;
`;

async function migrate() {
  const client = await pool.connect();
  try {
    console.log('Starting homework and DMs migration...');
    
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

import pg from 'pg';

const connectionString = 'postgres://postgres.qqjfiasxblsdgvaspjed:pLl0sZRSpmB7vHYL@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres';

const pool = new pg.Pool({
  connectionString,
  ssl: { rejectUnauthorized: false }
});

const sql = `
-- 1. Add fields to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_color TEXT;

-- 2. Create chat rooms
CREATE TABLE IF NOT EXISTS public.chat_rooms (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    group_id UUID REFERENCES public.groups(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT CHECK (type IN ('group', 'direct')) DEFAULT 'group',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Create chat messages
CREATE TABLE IF NOT EXISTS public.chat_messages (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    room_id UUID REFERENCES public.chat_rooms(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Note: In Supabase, enabling realtime for a table via SQL requires publication
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'chat_messages'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Could not add to supabase_realtime publication: %', SQLERRM;
END $$;

-- Create default group chats for existing groups (we need a unique name per group to avoid duplicates, but since we don't have constraints on name it's fine)
-- Wait, let's just create one for groups that don't have one
INSERT INTO public.chat_rooms (group_id, name, type)
SELECT g.id, 'Общий чат ' || g.name, 'group'
FROM public.groups g
WHERE NOT EXISTS (
    SELECT 1 FROM public.chat_rooms cr WHERE cr.group_id = g.id AND cr.type = 'group'
);
`;

async function runMigration() {
  console.log('Running chat and profile migration...');
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(sql);
    await client.query('COMMIT');
    console.log('Migration successful!');
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('Migration failed:', e);
  } finally {
    client.release();
    pool.end();
  }
}

runMigration();

import pg from 'pg';

const connectionString = 'postgres://postgres.qqjfiasxblsdgvaspjed:pLl0sZRSpmB7vHYL@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres';

const pool = new pg.Pool({
  connectionString,
  ssl: { rejectUnauthorized: false }
});

const sql = `
-- Create room_read_status table
CREATE TABLE IF NOT EXISTS public.room_read_status (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    room_id UUID REFERENCES public.chat_rooms(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    last_read_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(room_id, user_id)
);

ALTER TABLE public.room_read_status ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all for users" ON public.room_read_status FOR ALL USING (auth.role() = 'authenticated');

-- Create an RPC function to fetch unread counts for a user
CREATE OR REPLACE FUNCTION get_unread_counts(p_user_id UUID)
RETURNS TABLE (
    room_id UUID,
    unread_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        cr.id AS room_id,
        COUNT(cm.id) AS unread_count
    FROM 
        public.chat_rooms cr
    -- Join messages that belong to the room
    LEFT JOIN public.chat_messages cm ON cm.room_id = cr.id
    -- Join read status for this user
    LEFT JOIN public.room_read_status rrs ON rrs.room_id = cr.id AND rrs.user_id = p_user_id
    WHERE 
        -- Only count messages created after the last read timestamp, or all if never read
        (cm.created_at > rrs.last_read_at OR rrs.last_read_at IS NULL)
        -- Exclude the user's own messages from unread counts
        AND cm.user_id != p_user_id
    GROUP BY cr.id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
`;

async function migrate() {
  const client = await pool.connect();
  try {
    console.log('Starting unread messages migration...');
    
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

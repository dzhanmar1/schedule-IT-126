import pg from 'pg';

const connectionString = 'postgres://postgres.qqjfiasxblsdgvaspjed:pLl0sZRSpmB7vHYL@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres';

const pool = new pg.Pool({
  connectionString,
  ssl: { rejectUnauthorized: false }
});

const sql = `
-- 1. Add columns to chat_messages
ALTER TABLE public.chat_messages ADD COLUMN IF NOT EXISTS attachment_url TEXT;
ALTER TABLE public.chat_messages ADD COLUMN IF NOT EXISTS attachment_type TEXT;
ALTER TABLE public.chat_messages ADD COLUMN IF NOT EXISTS attachment_name TEXT;

-- 2. Create Storage Bucket for Chat Attachments
INSERT INTO storage.buckets (id, name, public) 
VALUES ('chat_attachments', 'chat_attachments', true)
ON CONFLICT (id) DO NOTHING;

-- 3. Set up Storage RLS Policies
-- Allow anyone authenticated to upload files to chat_attachments bucket
CREATE POLICY "Enable upload for authenticated users" 
ON storage.objects FOR INSERT 
WITH CHECK (
    bucket_id = 'chat_attachments' 
    AND auth.role() = 'authenticated'
);

-- Allow anyone to read files from chat_attachments bucket
CREATE POLICY "Enable read access for all" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'chat_attachments');

-- Allow users to delete their own uploaded files
CREATE POLICY "Enable delete for users own files"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'chat_attachments'
    AND auth.uid() = owner
);

-- Note: We make it public for easier fetching, though in a highly secure app it should be private.
-- For this academic project, public is fine and simpler to integrate.
`;

async function migrate() {
  const client = await pool.connect();
  try {
    console.log('Starting chat attachments migration...');
    
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

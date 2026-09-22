import pg from 'pg';

const possibleHosts = [
  'aws-0-eu-central-1.pooler.supabase.com',
  'aws-0-eu-west-1.pooler.supabase.com',
  'aws-0-eu-west-2.pooler.supabase.com',
  'aws-0-eu-west-3.pooler.supabase.com',
  'aws-0-ap-southeast-1.pooler.supabase.com',
  'aws-0-ap-northeast-1.pooler.supabase.com',
  'aws-0-us-east-1.pooler.supabase.com',
  'aws-0-us-west-1.pooler.supabase.com',
  'aws-0-us-west-2.pooler.supabase.com'
];

async function testHost(host) {
  const connectionString = "postgres://postgres.qqjfiasxblsdgvaspjed:pLl0sZRSpmB7vHYL@" + host + ":6543/postgres";
  const pool = new pg.Pool({ connectionString, ssl: { rejectUnauthorized: false }, connectionTimeoutMillis: 2000 });
  try {
    const client = await pool.connect();
    client.release();
    console.log('Success with host:', host);
    pool.end();
    return connectionString;
  } catch (e) {
    pool.end();
    return null;
  }
}

async function findHost() {
  for (const host of possibleHosts) {
    const result = await testHost(host);
    if (result) return result;
  }
  console.log('No host found');
}

findHost();

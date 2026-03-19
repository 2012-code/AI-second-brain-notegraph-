import { readFileSync } from 'fs';

const envRaw = readFileSync('.env.local', 'utf-8');
const env = Object.fromEntries(
  envRaw.split('\n')
    .filter(l => l.includes('=') && !l.startsWith('#'))
    .map(l => {
      const idx = l.indexOf('=');
      return [l.slice(0, idx).trim(), l.slice(idx + 1).trim().replace(/\r$/, '')];
    })
);

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(env['NEXT_PUBLIC_SUPABASE_URL'], env['SUPABASE_SERVICE_ROLE_KEY']);

async function test() {
  const userId = '7534bc31-1de6-42d5-8e97-13efc358f013'; // abdallah's user
  console.log('Upserting for user:', userId);
  
  const { data, error } = await supabase.from('profiles').upsert({
    id: userId,
    galaxy_positions: { test: { x: 1, y: 2 } }
  }).select();

  console.log('Result data:', data);
  if (error) console.error('Error:', error);
}

test();

const fs = require('fs');
const {createClient} = require('@supabase/supabase-js');
const env = fs.readFileSync('.env.local', 'utf8').split('\n').reduce((acc, line) => {
  if (line.includes('=') && !line.startsWith('#')) {
    const [k, v] = line.trim().split('=');
    acc[k] = v;
  }
  return acc;
}, {});
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function fix() {
  const { data, error } = await sb.from('games').update({
     finalizado: false,
     gols_time_a: null,
     gols_time_b: null,
     vencedor_id: null
  }).eq('id', 98);
  console.log('Fixed DB state for match 98');
}
fix();

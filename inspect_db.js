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

async function inspect() {
  // Check games table columns
  const { data: g1 } = await sb.from('games').select('*').limit(1);
  console.log('Games columns:', g1 && g1.length > 0 ? Object.keys(g1[0]) : 'empty table');
  
  // Check grupos table columns  
  const { data: g2, error: e2 } = await sb.from('grupos').select('*').limit(1);
  console.log('Grupos columns:', g2 && g2.length > 0 ? Object.keys(g2[0]) : 'empty', e2);
  
  // Check classificacao table
  const { data: g3, error: e3 } = await sb.from('classificacao').select('*').limit(1);
  console.log('Classificacao columns:', g3 && g3.length > 0 ? Object.keys(g3[0]) : 'empty', e3);

  // Check current games count
  const { count } = await sb.from('games').select('*', { count: 'exact', head: true });
  console.log('Total games:', count);

  // Check current grupos count
  const { count: gc } = await sb.from('grupos').select('*', { count: 'exact', head: true });
  console.log('Total grupos:', gc);
}
inspect();

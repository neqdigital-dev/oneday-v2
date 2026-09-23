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
  // How do games connect to grupos? Check the times_grupos junction table
  const { data: tg, error: tgErr } = await sb.from('times_grupos').select('*').limit(5);
  console.log('times_grupos:', tg, tgErr);

  // Check if games have grupo reference
  const { data: game } = await sb.from('games').select('*').limit(1).single();
  console.log('Game full:', JSON.stringify(game, null, 2));

  // Check classificacao columns more carefully
  const { data: cls } = await sb.from('classificacao').select('*').limit(1).single();
  console.log('Classificacao full:', JSON.stringify(cls, null, 2));

  // Check times -> grupo_id
  const { data: t } = await sb.from('times').select('id, nome_igreja, grupo_id').not('grupo_id', 'is', null).limit(5);
  console.log('Times with grupo_id:', t);
}
inspect();

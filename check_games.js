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

async function check() {
  const { data: camp } = await sb.from('campeonatos').select('id').eq('status', 'ativo').single();
  const { data: games } = await sb.from('games').select('id, fase, time_a_id, time_b_id, finalizado, gols_time_a, gols_time_b, vencedor_id').eq('campeonato_id', camp.id).eq('modalidade', 'Futebol Masculino').in('fase', ['Semifinal', 'Final']);
  console.log(JSON.stringify(games, null, 2));
}
check();

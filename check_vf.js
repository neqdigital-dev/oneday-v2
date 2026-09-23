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
  const { data: games } = await sb.from('games').select('modalidade, fase, time_a_id, time_b_id').eq('campeonato_id', camp.id);
  
  const counts = {};
  games.forEach(g => {
    if (!counts[g.modalidade]) counts[g.modalidade] = { total: 0, grupos: 0, mataMata: 0 };
    counts[g.modalidade].total++;
    if (g.fase === 'Fase de Grupos') counts[g.modalidade].grupos++;
    else counts[g.modalidade].mataMata++;
  });
  console.log(counts);
}
check();

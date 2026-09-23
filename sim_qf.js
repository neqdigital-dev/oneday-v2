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

async function simulate() {
  const { data: camp } = await sb.from('campeonatos').select('id').eq('status', 'ativo').single();
  const { data: quartas } = await sb.from('games').select('*').eq('campeonato_id', camp.id).eq('modalidade', 'Futebol Masculino').eq('fase', 'Quartas de Final');
  
  for (const q of quartas) {
      await sb.from('games').update({
         finalizado: true,
         gols_time_a: 2,
         gols_time_b: 1,
         vencedor_id: q.time_a_id
      }).eq('id', q.id);
      
      // Update next match (Semifinal)
      if (q.proximo_jogo_id) {
         const { data: nextMatch } = await sb.from('games').select('*').eq('id', q.proximo_jogo_id).single();
         if (nextMatch) {
             const field = nextMatch.time_a_id ? 'time_b_id' : 'time_a_id';
             await sb.from('games').update({ [field]: q.time_a_id }).eq('id', nextMatch.id);
         }
      }
  }
  console.log('Simulated Quartas de Final for Futebol Masculino');
}
simulate();

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
  // Check grupos
  const { data: grupos } = await sb.from('grupos').select('*').order('modalidade').order('nome');
  console.log('=== GRUPOS ===');
  for (const g of grupos) {
    console.log(g.id, g.modalidade, g.nome);
  }

  // Check classificacao sample
  const { data: c } = await sb.from('classificacao').select('*, time:times(nome_igreja, modalidade), grupo:grupos(nome, modalidade)').limit(5);
  console.log('\n=== CLASSIFICACAO SAMPLE ===');
  for (const r of c) {
    console.log(r.grupo?.nome, r.time?.nome_igreja, r.time?.modalidade, 'V:', r.vitorias, 'E:', r.empates, 'D:', r.derrotas);
  }

  // Check games sample
  const { data: games } = await sb.from('games').select('id, modalidade, fase, finalizado, local, data_hora').limit(10).order('id');
  console.log('\n=== GAMES SAMPLE ===');
  for (const g of games) {
    console.log(g.id, g.modalidade, g.fase, g.finalizado ? 'FIN' : 'PEN', g.local, g.data_hora);
  }

  // Check games by modalidade
  const { data: allGames } = await sb.from('games').select('modalidade');
  const counts = {};
  for (const g of allGames) counts[g.modalidade] = (counts[g.modalidade] || 0) + 1;
  console.log('\n=== GAMES PER MODALIDADE ===', counts);
}
inspect();

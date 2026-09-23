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
  if (!camp) return;

  const { data: games } = await sb.from('games').select('*').eq('campeonato_id', camp.id).eq('fase', 'Fase de Grupos').eq('finalizado', false);
  
  if (!games || games.length === 0) {
    console.log('No games to simulate');
    return;
  }

  console.log('Simulating', games.length, 'games...');

  for (const game of games) {
    let placarA = 0;
    let placarB = 0;
    let vencedorId = null;

    if (game.modalidade.includes('Futebol')) {
      placarA = Math.floor(Math.random() * 5);
      placarB = Math.floor(Math.random() * 5);
      if (placarA > placarB) vencedorId = game.time_a_id;
      else if (placarB > placarA) vencedorId = game.time_b_id;
    } else {
      placarA = Math.random() > 0.5 ? 2 : Math.floor(Math.random() * 2);
      placarB = placarA === 2 ? Math.floor(Math.random() * 2) : 2;
      vencedorId = placarA > placarB ? game.time_a_id : game.time_b_id;
    }

    const updates = {
      finalizado: true,
      vencedor_id: vencedorId,
    };
    if (game.modalidade.includes('Futebol')) {
      updates.gols_time_a = placarA;
      updates.gols_time_b = placarB;
    } else {
      updates.sets_vencidos_a = placarA;
      updates.sets_vencidos_b = placarB;
    }

    await sb.from('games').update(updates).eq('id', game.id);

    // Update classification
    for (const timeId of [game.time_a_id, game.time_b_id]) {
      const isA = timeId === game.time_a_id;
      const isWinner = vencedorId === timeId;
      const isDraw = vencedorId === null;

      const myGols = isA ? placarA : placarB;
      const opGols = isA ? placarB : placarA;

      const { data: classif } = await sb.from('classificacao').select('*').eq('time_id', timeId).single();
      if (classif) {
        await sb.from('classificacao').update({
          jogos_disputados: classif.jogos_disputados + 1,
          vitorias: classif.vitorias + (isWinner ? 1 : 0),
          empates: classif.empates + (isDraw ? 1 : 0),
          derrotas: classif.derrotas + (!isWinner && !isDraw ? 1 : 0),
          gols_pro: classif.gols_pro + myGols,
          gols_contra: classif.gols_contra + opGols,
        }).eq('id', classif.id);
      }
    }
  }

  console.log('Simulation complete!');
}
simulate();

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

async function gerarMataMataAutomatico(sb, modalidade) {
  const { data: camp } = await sb.from('campeonatos').select('id').eq('status', 'ativo').single();
  const campeonato_id = camp.id;

  const { data: grupos } = await sb.from('grupos').select('id, nome').eq('campeonato_id', campeonato_id).eq('modalidade', modalidade).order('nome');
  if (!grupos || grupos.length === 0) return;
  const { data: classifRaw } = await sb.from('classificacao').select('*, time:times(id, nome_igreja)').eq('campeonato_id', campeonato_id);

  let classificados = [];
  let terceirosLugares = [];

  for (const grupo of grupos) {
    const classifGrupo = classifRaw.filter(c => c.grupo_id === grupo.id);
    const rankingGrupo = classifGrupo.sort((a, b) => {
      const ptsA = (a.vitorias * 3) + a.empates;
      const ptsB = (b.vitorias * 3) + b.empates;
      if (ptsB !== ptsA) return ptsB - ptsA;
      const sgA = a.gols_pro - a.gols_contra;
      const sgB = b.gols_pro - b.gols_contra;
      if (sgB !== sgA) return sgB - sgA;
      return b.gols_pro - a.gols_pro;
    });

    if (rankingGrupo.length > 0) classificados.push(rankingGrupo[0]);
    if (rankingGrupo.length > 1) classificados.push(rankingGrupo[1]);
    if (rankingGrupo.length > 2) terceirosLugares.push(rankingGrupo[2]);
  }

  const rankingGeral = classificados.sort((a, b) => {
    const ptsA = (a.vitorias * 3) + a.empates;
    const ptsB = (b.vitorias * 3) + b.empates;
    if (ptsB !== ptsA) return ptsB - ptsA;
    const sgA = a.gols_pro - a.gols_contra;
    const sgB = b.gols_pro - b.gols_contra;
    if (sgB !== sgA) return sgB - sgA;
    return b.gols_pro - a.gols_pro;
  });

  if (rankingGeral.length === 8) {
    const { data: final } = await sb.from('games').insert({ campeonato_id, modalidade, fase: 'Final', ordem_na_fase: 1 }).select().single();
    await sb.from('games').insert({ campeonato_id, modalidade, fase: 'Disputa 3º Lugar', ordem_na_fase: 1 });
    
    const { data: semi1 } = await sb.from('games').insert({ campeonato_id, modalidade, fase: 'Semifinal', ordem_na_fase: 1, proximo_jogo_id: final?.id }).select().single();
    const { data: semi2 } = await sb.from('games').insert({ campeonato_id, modalidade, fase: 'Semifinal', ordem_na_fase: 2, proximo_jogo_id: final?.id }).select().single();

    const qMatches = [
      { tA: rankingGeral[0].time_id, tB: rankingGeral[7].time_id, next: semi1?.id },
      { tA: rankingGeral[3].time_id, tB: rankingGeral[4].time_id, next: semi1?.id },
      { tA: rankingGeral[2].time_id, tB: rankingGeral[5].time_id, next: semi2?.id },
      { tA: rankingGeral[1].time_id, tB: rankingGeral[6].time_id, next: semi2?.id },
    ];

    for (let i = 0; i < 4; i++) {
      await sb.from('games').insert({
        campeonato_id, modalidade, fase: 'Quartas de Final',
        time_a_id: qMatches[i].tA, time_b_id: qMatches[i].tB,
        ordem_na_fase: i + 1, proximo_jogo_id: qMatches[i].next
      });
    }
  } else if (rankingGeral.length === 4) {
    const { data: final } = await sb.from('games').insert({ campeonato_id, modalidade, fase: 'Final', ordem_na_fase: 1 }).select().single();
    await sb.from('games').insert({ campeonato_id, modalidade, fase: 'Disputa 3º Lugar', ordem_na_fase: 1 });

    const sMatches = [
      { tA: rankingGeral[0].time_id, tB: rankingGeral[3].time_id, next: final?.id },
      { tA: rankingGeral[1].time_id, tB: rankingGeral[2].time_id, next: final?.id },
    ];

    for (let i = 0; i < 2; i++) {
      await sb.from('games').insert({
        campeonato_id, modalidade, fase: 'Semifinal',
        time_a_id: sMatches[i].tA, time_b_id: sMatches[i].tB,
        ordem_na_fase: i + 1, proximo_jogo_id: sMatches[i].next
      });
    }
  }
}

async function run() {
  await gerarMataMataAutomatico(sb, 'Futebol Feminino');
  await gerarMataMataAutomatico(sb, 'Vôlei Masculino');
  await gerarMataMataAutomatico(sb, 'Vôlei Feminino');
  await gerarMataMataAutomatico(sb, 'Tênis de Mesa');
  console.log('All done!');
}
run();

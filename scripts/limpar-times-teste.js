// Script para limpar todos os times de teste
// Uso: node scripts/limpar-times-teste.js
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_KEY;
if (!url || !key) { console.error('Configure SUPABASE_URL e SUPABASE_SERVICE_KEY no .env.local'); process.exit(1); }
const sb = createClient(url, key);

async function run() {
  const { data: camp } = await sb.from('campeonatos').select('id').eq('status', 'ativo').single();
  if (!camp) { console.log('Nenhum campeonato ativo.'); return; }

  await sb.from('games').delete().eq('campeonato_id', camp.id);
  console.log('Jogos apagados.');
  await sb.from('classificacao').delete().eq('campeonato_id', camp.id);
  console.log('Classificacoes apagadas.');
  await sb.from('grupos').delete().eq('campeonato_id', camp.id);
  console.log('Grupos apagados.');
  await sb.from('times').delete().eq('campeonato_id', camp.id);
  console.log('Times apagados.');
  console.log('\nTudo limpo! Banco pronto para novos testes.');
}
run();

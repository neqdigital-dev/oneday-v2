// Script para popular o banco com times de teste
// Uso: node scripts/gerar-times-teste.js [modalidade] [quantidade]
// Requer: arquivo .env.local na raiz com SUPABASE_URL e SUPABASE_SERVICE_KEY
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_KEY;
if (!url || !key) { console.error('Configure SUPABASE_URL e SUPABASE_SERVICE_KEY no .env.local'); process.exit(1); }
const sb = createClient(url, key);

const nomesIgrejas = [
  'Igreja Batista Central', 'AD Madureira', 'Comunidade Cristã Vida',
  'Igreja Presbiteriana Nova', 'AD Belém', 'Igreja Metodista Wesleyana',
  'Comunidade Evangélica Shalom', 'Igreja Batista da Paz',
  'AD Vitória em Cristo', 'Igreja Sara Nossa Terra',
  'Primeira Igreja Batista', 'Comunidade das Nações',
  'Igreja Cristã Maranata', 'AD Boas Novas', 'Igreja Quadrangular',
  'Comunidade Zona Sul', 'AD Penha', 'Igreja Batista Renovada',
  'Ministério Apascentar', 'Igreja Metodista Central'
];

async function run() {
  const { data: camp } = await sb.from('campeonatos').select('id').eq('status', 'ativo').single();
  if (!camp) { console.log('Nenhum campeonato ativo! Crie um primeiro.'); return; }

  const modalidade = process.argv[2] || 'futebol-masc';
  const quantidade = parseInt(process.argv[3] || '12');
  
  console.log('Criando ' + quantidade + ' times de teste para "' + modalidade + '"...');

  for (let i = 0; i < quantidade; i++) {
    const nome = nomesIgrejas[i % nomesIgrejas.length] + (i >= nomesIgrejas.length ? ' ' + (Math.floor(i/nomesIgrejas.length)+1) : '');
    const { error } = await sb.from('times').insert({
      campeonato_id: camp.id, nome, modalidade,
      responsavel: 'Líder Teste ' + (i+1),
      telefone: '21999990' + String(i).padStart(3, '0'),
      pagou: true
    });
    if (error) console.error('Erro:', nome, error.message);
    else console.log('Criado:', nome);
  }
  console.log('\nPronto! Agora va no Painel Super Admin e clique em Gerar Chaveamento.');
}
run();

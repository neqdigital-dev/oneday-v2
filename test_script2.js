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

async function test() {
  const { data, error } = await sb.from("games").insert({
      campeonato_id: 2,
      modalidade: 'Futebol Masculino',
      fase: "Fase de Grupos",
      time_a_id: 2,
      time_b_id: 3,
      local: "Sequência Única",
      data_hora: new Date().toISOString(),
      finalizado: false,
      ordem_na_fase: 1,
      grupo_id: 1,
    }).select();
  console.log('Result:', data, error);
}
test();

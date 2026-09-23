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
  
  const { data: classif } = await sb.from('classificacao').select('grupo_id, grupos(nome)').eq('campeonato_id', camp.id);
  const { data: vfGrupos } = await sb.from('grupos').select('id, nome').eq('modalidade', 'Vôlei Feminino');
  
  const countPorGrupo = {};
  vfGrupos.forEach(g => {
     countPorGrupo[g.nome] = classif.filter(c => c.grupo_id === g.id).length;
  });
  console.log(countPorGrupo);
}
check();

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
  const {data: grupos} = await sb.from('grupos').select('*');
  let todosConfrontos = [];
  for (const grupo of grupos) {
    const { data: timesDoGrupo, error } = await sb.from('times').select('id').eq('grupo_id', grupo.id);
    console.log('Grupo', grupo.id, 'Times:', timesDoGrupo?.length, error);
    if (!timesDoGrupo) continue;
    function getCombinations(arr) {
      const result = [];
      for(let i=0; i<arr.length; i++) for(let j=i+1; j<arr.length; j++) result.push([arr[i], arr[j]]);
      return result;
    }
    const confrontos = getCombinations(timesDoGrupo);
    for (const [ta, tb] of confrontos) todosConfrontos.push({ grupo_id: grupo.id, ta: ta.id, tb: tb.id });
  }
  console.log('Total confrontos:', todosConfrontos.length);
}
test();

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

async function fixModalidades() {
  // Delete all old ones using neq to something impossible so it deletes all
  const { error: delErr } = await sb.from('modalidades').delete().neq('nome', 'xxyyzz123');
  if (delErr) { console.error('Delete error:', delErr); return; }

  // Insert the correct ones that match the teams
  const newMods = [
    'Futebol Masculino',
    'Futebol Feminino',
    'Vôlei Masculino',
    'Vôlei Feminino',
    'Tênis de Mesa'
  ];
  for (const nome of newMods) {
    const { error } = await sb.from('modalidades').insert({ nome });
    if (error) console.error('Insert error for', nome, ':', error);
    else console.log('Inserted:', nome);
  }
  console.log('Done!');
}
fixModalidades();

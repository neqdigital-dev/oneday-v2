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
sb.from('times').select('modalidade').then(res => { 
  const counts = {};
  for (const t of res.data) {
    counts[t.modalidade] = (counts[t.modalidade] || 0) + 1;
  }
  console.log('Times counts:', counts);
});

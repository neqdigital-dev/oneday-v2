const fs = require('fs');
const http = require('http');

async function test() {
  const payload = {
      modalidade: "Futebol Masculino",
      time_a_id: 3,
      time_b_id: 5,
      gols_time_a: 2,
      gols_time_b: 1,
      sets_vencidos_a: null,
      sets_vencidos_b: null,
      finalizado: true,
      fase: "Semifinal",
      grupo_id: null,
      vencedor_wo_id: null
  };

  // We need to bypass auth by using supabase admin directly in a similar script to the route, OR we just use the route logic.
  // Let's just require the route logic. Wait, we can't easily mock Next.js req.
  // Instead, let's just create a direct DB update to see if it fails.
  const {createClient} = require('@supabase/supabase-js');
  const env = fs.readFileSync('.env.local', 'utf8').split('\n').reduce((acc, line) => {
    if (line.includes('=') && !line.startsWith('#')) {
        const [k, v] = line.trim().split('=');
        acc[k] = v;
    }
    return acc;
  }, {});
  const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
  
  const updateData = {
      gols_time_a: 2,
      gols_time_b: 1,
      finalizado: true,
      vencedor_wo_id: null
  };
  
  const { data, error } = await sb.from("games").update(updateData).eq("id", 98).select().single();
  console.log("DB Update Result:", error ? error : data);
}
test();

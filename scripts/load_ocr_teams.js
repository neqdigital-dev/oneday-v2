const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Parse .env.local manually to avoid installing dotenv
const envPath = path.join(__dirname, '../.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
    line = line.trim();
    if (line && !line.startsWith('#')) {
        const match = line.match(/^([^=]+)=(.*)$/);
        if (match) {
            env[match[1].trim()] = match[2].trim().replace(/^['"]|['"]$/g, '');
        }
    }
});

const supabaseUrl = env['NEXT_PUBLIC_SUPABASE_URL'];
const supabaseServiceKey = env['SUPABASE_SERVICE_ROLE_KEY'];

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Faltam variáveis de ambiente!");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const teams_data = [
    ["JAP", "Fut 7 masculino", "Parobé"],
    ["J7 Futebol Clube", "Fut 7 masculino", "Sete de Setembro"],
    ["Sport Clube Central Parobé", "Fut 7 masculino", "Parobé"],
    ["Glória FC", "Fut 7 masculino", "Taquara"],
    ["iSeven", "Fut 7 masculino", "IACS"],
    ["YOUNG HILL", "Fut 7 masculino", "Colina"],
    ["Atos 29", "Fut 7 masculino", "Vista Alegre"],
    ["Imperial", "Fut 7 masculino", "Novo Hamburgo"],
    ["UNIÃO ESTEIO", "Fut 7 masculino", "Esteio"],
    ["Rota 7 FC", "Fut 7 masculino", "Canudos"],
    ["Atlético Central NH", "Fut 7 masculino", "Novo Hamburgo"],
    ["CONECTADOS - MONTE BELO", "Fut 7 masculino", "Monte Belo"],
    ["Arsenal", "Fut 7 masculino", "Canudos"],
    ["Os vingadores", "Fut 7 masculino", "Santo Afonso"],
    ["TOSAVE SPORTS", "Fut 7 masculino", "Alvorada"],
    ["Workship", "Fut 7 masculino", "Sapiranga"],
    
    ["Follow", "Tênis de mesa", "Vila Tereza"],
    ["IACS", "Tênis de mesa", "IACS"],
    ["IACS2", "Tênis de mesa", "IACS"],
    ["iSeven 3", "Tênis de mesa", "IACS"],
    ["BD", "Tênis de mesa", "Novo Hamburgo"],
    ["iSeven 4", "Tênis de mesa", "IACS"],
    ["F2", "Tênis de mesa", "Cruzeiro do Sul"],
    ["Charrel Team", "Tênis de mesa", "Vila Americana"],
    ["Gaby Team", "Tênis de mesa", "Vila Americana"],
    ["Rota 7 FC", "Tênis de mesa", "Canudos"],
    ["Kelvyn", "Tênis de mesa", "São Luiz"],
    ["Aarthur Borges", "Tênis de mesa", "Sapiranga"],
    ["Gidi", "Tênis de mesa", "Boa Saúde"],
    ["Ner", "Tênis de mesa", "Vila Santo Antonio"],
    ["thiago", "Tênis de mesa", "Canudos"],
    ["Matheus Franco", "Tênis de mesa", "Vila São Jerônimo"],
    ["Giba", "Tênis de mesa", "Colina"],
    ["PAMPA", "Tênis de mesa", "Canudos"],
    
    ["Crisol Girls", "Vôlei feminino (areia)", "Vila Tereza"],
    ["Jovens TEU", "Vôlei feminino (areia)", "Santo Afonso"],
    ["Águias da Fé", "Vôlei feminino (areia)", "Vila Tereza"],
    ["Base Worship", "Vôlei feminino (areia)", "Sapiranga"],
    ["J7", "Vôlei feminino (areia)", "Sete de Setembro"],
    ["CONECTADOS - MONTE BELO", "Vôlei feminino (areia)", "Monte Belo"],
    ["Discípulas", "Vôlei feminino (areia)", "São Luiz"],
    ["PAMPA", "Vôlei feminino (areia)", "Canudos"],
    ["granela", "Vôlei feminino (areia)", "Gramado"],
    ["UpperFire", "Vôlei feminino (areia)", "Esteio"],
    ["Guardiãs", "Vôlei feminino (areia)", "Vila São Jerônimo"],
    ["CONNECT VÔLEI F", "Vôlei feminino (areia)", "Novo Hamburgo"],
    
    ["Follow VT", "Vôlei masculino (areia)", "Vila Tereza"],
    ["Crisol", "Vôlei masculino (areia)", "Vila Tereza"],
    ["Conectados", "Vôlei masculino (areia)", "Sapiranga"],
    ["iSeven", "Vôlei masculino (areia)", "IACS"],
    ["Jovens Teu", "Vôlei masculino (areia)", "Santo Afonso"],
    ["TIGERS", "Vôlei masculino (areia)", "Vila Santo Antonio"],
    ["UpperFire", "Vôlei masculino (areia)", "Esteio"],
    ["Zero à Esquerda", "Vôlei masculino (areia)", "Vila Tereza"],
    ["Worship", "Vôlei masculino (areia)", "Sapiranga"],
    ["PAMPA", "Vôlei masculino (areia)", "Canudos"],
    ["granela SPORT", "Vôlei masculino (areia)", "Gramado"],
    ["Zero à Esquerda Resiliência", "Vôlei masculino (areia)", "Vila Tereza"],
    ["Glory spike", "Vôlei masculino (areia)", "Sapucaia do Sul"],
    ["Eternos", "Vôlei masculino (areia)", "Vila São Jerônimo"],
    ["CONNECT VÔLEI M", "Vôlei masculino (areia)", "Novo Hamburgo"]
];

const modalidade_map = {
    "Fut 7 masculino": "Futebol Masculino",
    "Tênis de mesa": "Tênis de Mesa",
    "Vôlei feminino (areia)": "Vôlei Feminino",
    "Vôlei masculino (areia)": "Vôlei Masculino"
};

async function main() {
    const { data: camp, error: errCamp } = await supabase
        .from('campeonatos')
        .select('id')
        .eq('status', 'ativo')
        .single();
        
    if (errCamp || !camp) {
        console.error("Nenhum campeonato ativo encontrado", errCamp);
        return;
    }
    const campId = camp.id;
    console.log("Campeonato ativo ID:", campId);

    const { data: admins } = await supabase.from('users').select('id').eq('role', 'super_admin').limit(1);
    const superAdminId = admins && admins.length > 0 ? admins[0].id : null;

    let count = 0;
    for (const [name, mod, district] of teams_data) {
        const app_mod = modalidade_map[mod] || mod;
        
        const { data: exists } = await supabase
            .from('times')
            .select('id')
            .eq('nome_igreja', name)
            .eq('modalidade', app_mod)
            .eq('campeonato_id', campId);
            
        if (!exists || exists.length === 0) {
            const { error } = await supabase.from('times').insert({
                campeonato_id: campId,
                nome_igreja: name,
                nome_base: name,
                distrito: district,
                modalidade: app_mod,
                pagou: true,
                
                link_pagamento: "https://eventodaigreja.com.br/teste_ocr",
                
            });
            
            if (error) {
                console.error("Erro inserindo time", name, error);
            } else {
                console.log(`Adicionado ${name} (${app_mod})`);
                count++;
            }
        } else {
            console.log(`Time ${name} (${app_mod}) já existe. Atualizando pagou...`);
            await supabase.from('times').update({ pagou: true }).eq('id', exists[0].id);
            count++;
        }
    }
    
    console.log(`Finalizado. ${count} times processados.`);
}

main().catch(console.error);

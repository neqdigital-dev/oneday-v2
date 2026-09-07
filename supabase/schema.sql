-- ============================================================
-- ONEDAY CAMPEONATO v2.0 — Schema Supabase (PostgreSQL)
-- Execute este SQL no Supabase SQL Editor
-- ============================================================

-- Extensões
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- TABELA: users (perfis de usuário)
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT ''lider'' CHECK (role IN (''super_admin'', ''admin'', ''placarista'', ''lider'')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABELA: campeonatos
-- ============================================================
CREATE TABLE IF NOT EXISTS campeonatos (
  id SERIAL PRIMARY KEY,
  nome TEXT NOT NULL,
  ano INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT ''ativo'' CHECK (status IN (''ativo'', ''arquivado'')),
  criado_em TIMESTAMPTZ DEFAULT NOW(),
  criado_por_id UUID REFERENCES users(id)
);

-- Inserir campeonato inicial
INSERT INTO campeonatos (nome, ano, status) VALUES (''Oneday 2026'', 2026, ''ativo'') ON CONFLICT DO NOTHING;

-- ============================================================
-- TABELA: regioes (configurável por campeonato)
-- ============================================================
CREATE TABLE IF NOT EXISTS regioes (
  id SERIAL PRIMARY KEY,
  campeonato_id INTEGER REFERENCES campeonatos(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  descricao TEXT
);

-- Regiões padrão para o campeonato inicial
INSERT INTO regioes (campeonato_id, nome, descricao)
SELECT 1, ''Região 1 | Moving'', ''Regional Natan Cappra'' WHERE NOT EXISTS (SELECT 1 FROM regioes WHERE campeonato_id = 1);
INSERT INTO regioes (campeonato_id, nome, descricao) VALUES
(1, ''Região 2 | I Am'', ''Regional Daniel Martins''),
(1, ''Região 3 | Chamados'', ''Regional Roberta Pedroso''),
(1, ''Região 4 | Together'', ''Regional Maycon Lilo''),
(1, ''Região 5 | Reaviva'', ''Regional Sônia Ribeiro''),
(1, ''Região 6 | Bethel'', ''Regional Matheus Felipe''),
(1, ''Região 7 | Tô Ligado'', ''Regional Regis Nogara''),
(1, ''Região 8 | Forgiven'', ''Regional Jeferson Martins'')
ON CONFLICT DO NOTHING;

-- ============================================================
-- TABELA: configuracao (por campeonato)
-- ============================================================
CREATE TABLE IF NOT EXISTS configuracao (
  id SERIAL PRIMARY KEY,
  campeonato_id INTEGER UNIQUE REFERENCES campeonatos(id) ON DELETE CASCADE,
  cadastros_globais_encerrados BOOLEAN DEFAULT FALSE,
  num_quadras_fut_masc INTEGER DEFAULT 3,
  num_quadras_fut_fem INTEGER DEFAULT 3,
  num_quadras_volei_misto INTEGER DEFAULT 3,
  limite_nao_adv_fut_masc INTEGER DEFAULT 1,
  limite_nao_adv_fut_fem INTEGER DEFAULT 2,
  limite_nao_adv_volei_misto INTEGER DEFAULT 1
);

INSERT INTO configuracao (campeonato_id) VALUES (1) ON CONFLICT DO NOTHING;

-- ============================================================
-- TABELA: times
-- ============================================================
CREATE TABLE IF NOT EXISTS times (
  id SERIAL PRIMARY KEY,
  campeonato_id INTEGER NOT NULL REFERENCES campeonatos(id) ON DELETE CASCADE,
  nome_igreja TEXT NOT NULL,
  distrito TEXT,
  regiao TEXT,
  nome_base TEXT,
  modalidade TEXT NOT NULL CHECK (modalidade IN (''Futebol Masculino'', ''Futebol Feminino'', ''Volei Misto'')),
  token UUID DEFAULT gen_random_uuid() UNIQUE NOT NULL,
  lider_id UUID REFERENCES users(id),
  imagem_url TEXT,
  link_pagamento TEXT,
  pagou BOOLEAN DEFAULT FALSE,
  comprovante_url TEXT,
  diretor_jovem TEXT,
  cadastros_encerrados BOOLEAN DEFAULT FALSE,
  grupo_id INTEGER,
  limite_nao_adv_fut_masc INTEGER DEFAULT 1,
  limite_nao_adv_fut_fem INTEGER DEFAULT 2,
  limite_nao_adv_volei_misto INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABELA: jogadores
-- ============================================================
CREATE TABLE IF NOT EXISTS jogadores (
  id SERIAL PRIMARY KEY,
  campeonato_id INTEGER NOT NULL REFERENCES campeonatos(id) ON DELETE CASCADE,
  time_id INTEGER NOT NULL REFERENCES times(id) ON DELETE CASCADE,
  nome_completo TEXT NOT NULL,
  cpf TEXT,
  rg TEXT,
  data_nascimento DATE,
  telefone TEXT NOT NULL,
  is_adventista BOOLEAN DEFAULT TRUE,
  is_capitao BOOLEAN DEFAULT FALSE,
  foto_url TEXT,
  foto_identidade_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABELA: grupos
-- ============================================================
CREATE TABLE IF NOT EXISTS grupos (
  id SERIAL PRIMARY KEY,
  campeonato_id INTEGER NOT NULL REFERENCES campeonatos(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  modalidade TEXT NOT NULL
);

-- Adicionar FK de times.grupo_id para grupos
ALTER TABLE times ADD CONSTRAINT fk_times_grupo
  FOREIGN KEY (grupo_id) REFERENCES grupos(id) ON DELETE SET NULL;

-- ============================================================
-- TABELA: classificacao
-- ============================================================
CREATE TABLE IF NOT EXISTS classificacao (
  id SERIAL PRIMARY KEY,
  campeonato_id INTEGER NOT NULL REFERENCES campeonatos(id) ON DELETE CASCADE,
  time_id INTEGER NOT NULL REFERENCES times(id) ON DELETE CASCADE,
  grupo_id INTEGER NOT NULL REFERENCES grupos(id) ON DELETE CASCADE,
  jogos_disputados INTEGER DEFAULT 0,
  vitorias INTEGER DEFAULT 0,
  empates INTEGER DEFAULT 0,
  derrotas INTEGER DEFAULT 0,
  gols_pro INTEGER DEFAULT 0,
  gols_contra INTEGER DEFAULT 0
);

-- ============================================================
-- TABELA: games (jogos)
-- ============================================================
CREATE TABLE IF NOT EXISTS games (
  id SERIAL PRIMARY KEY,
  campeonato_id INTEGER NOT NULL REFERENCES campeonatos(id) ON DELETE CASCADE,
  modalidade TEXT NOT NULL,
  fase TEXT,
  data_hora TIMESTAMPTZ,
  local TEXT,
  finalizado BOOLEAN DEFAULT FALSE,
  ordem_na_fase INTEGER,
  time_a_id INTEGER REFERENCES times(id),
  time_b_id INTEGER REFERENCES times(id),
  vencedor_id INTEGER REFERENCES times(id),
  gols_time_a INTEGER,
  gols_time_b INTEGER,
  sets_vencidos_a INTEGER,
  sets_vencidos_b INTEGER,
  pontos_sets TEXT,
  proximo_jogo_id INTEGER REFERENCES games(id)
);

-- ============================================================
-- RLS (Row Level Security) — Políticas de Acesso
-- ============================================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE campeonatos ENABLE ROW LEVEL SECURITY;
ALTER TABLE times ENABLE ROW LEVEL SECURITY;
ALTER TABLE jogadores ENABLE ROW LEVEL SECURITY;
ALTER TABLE grupos ENABLE ROW LEVEL SECURITY;
ALTER TABLE classificacao ENABLE ROW LEVEL SECURITY;
ALTER TABLE games ENABLE ROW LEVEL SECURITY;
ALTER TABLE configuracao ENABLE ROW LEVEL SECURITY;
ALTER TABLE regioes ENABLE ROW LEVEL SECURITY;

-- Política: Service Role tem acesso total (API do servidor)
CREATE POLICY "Service role full access" ON users FOR ALL USING (true);
CREATE POLICY "Service role full access" ON campeonatos FOR ALL USING (true);
CREATE POLICY "Service role full access" ON times FOR ALL USING (true);
CREATE POLICY "Service role full access" ON jogadores FOR ALL USING (true);
CREATE POLICY "Service role full access" ON grupos FOR ALL USING (true);
CREATE POLICY "Service role full access" ON classificacao FOR ALL USING (true);
CREATE POLICY "Service role full access" ON games FOR ALL USING (true);
CREATE POLICY "Service role full access" ON configuracao FOR ALL USING (true);
CREATE POLICY "Service role full access" ON regioes FOR ALL USING (true);

-- Política: Leitura pública para dados do campeonato
CREATE POLICY "Public read times" ON times FOR SELECT USING (true);
CREATE POLICY "Public read jogadores" ON jogadores FOR SELECT USING (true);
CREATE POLICY "Public read grupos" ON grupos FOR SELECT USING (true);
CREATE POLICY "Public read classificacao" ON classificacao FOR SELECT USING (true);
CREATE POLICY "Public read games" ON games FOR SELECT USING (true);
CREATE POLICY "Public read campeonatos" ON campeonatos FOR SELECT USING (true);
CREATE POLICY "Public read regioes" ON regioes FOR SELECT USING (true);

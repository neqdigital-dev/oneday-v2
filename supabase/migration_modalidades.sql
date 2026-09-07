CREATE TABLE IF NOT EXISTS modalidades (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome TEXT UNIQUE NOT NULL,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inserir as padrões apenas se não existirem
INSERT INTO modalidades (nome) VALUES 
('Futebol Masculino'),
('Futebol Feminino'),
('Volei Misto Sexteto'),
('Volei Quarteto Masculino'),
('Volei Quarteto Feminino'),
('Ping-Pong')
ON CONFLICT (nome) DO NOTHING;

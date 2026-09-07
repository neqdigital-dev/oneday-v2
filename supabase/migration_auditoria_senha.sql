-- Adiciona colunas para recuperação de senha
ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token_expires TIMESTAMP WITH TIME ZONE;

-- Cria tabela de Logs de Auditoria
CREATE TABLE IF NOT EXISTS logs_auditoria (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id UUID REFERENCES users(id) ON DELETE SET NULL,
    acao TEXT NOT NULL,
    detalhes JSONB,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Permissões de RLS para auditoria
ALTER TABLE logs_auditoria ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super Admins podem ler todos os logs" 
    ON logs_auditoria FOR SELECT 
    USING ( (SELECT role FROM users WHERE id = auth.uid()) = 'super_admin' );

CREATE POLICY "Qualquer usuario autenticado via app pode inserir log (bypassed by service role)"
    ON logs_auditoria FOR INSERT 
    WITH CHECK (true);

-- Adiciona coluna de W.O.
ALTER TABLE games ADD COLUMN IF NOT EXISTS vencedor_wo_id UUID REFERENCES times(id) ON DELETE SET NULL;

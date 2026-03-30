-- SQL complementar - Execute apenas se der erro de política já existente
-- Isso significa que a tabela já foi criada, só falta completar

-- Verificar se a função trigger existe, se não, criar
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Verificar se o trigger existe, se não, criar
DROP TRIGGER IF EXISTS update_tarefas_planejamento_updated_at ON tarefas_planejamento;
CREATE TRIGGER update_tarefas_planejamento_updated_at 
    BEFORE UPDATE ON tarefas_planejamento 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Verificar se os índices existem, se não, criar
CREATE INDEX IF NOT EXISTS idx_tarefas_planejamento_coluna ON tarefas_planejamento(coluna);
CREATE INDEX IF NOT EXISTS idx_tarefas_planejamento_responsavel ON tarefas_planejamento(responsavel_id);
CREATE INDEX IF NOT EXISTS idx_tarefas_planejamento_criador ON tarefas_planejamento(criador_id);
CREATE INDEX IF NOT EXISTS idx_tarefas_planejamento_etiqueta ON tarefas_planejamento(etiqueta);
CREATE INDEX IF NOT EXISTS idx_tarefas_planejamento_data_limite ON tarefas_planejamento(data_limite);

-- Verificar se RLS está ativado
ALTER TABLE tarefas_planejamento ENABLE ROW LEVEL SECURITY;

-- Recriar políticas (drop e create)
DROP POLICY IF EXISTS "Usuários podem ver todas as tarefas" ON tarefas_planejamento;
DROP POLICY IF EXISTS "Usuários podem criar tarefas" ON tarefas_planejamento;
DROP POLICY IF EXISTS "Usuários podem atualizar próprias tarefas ou se admin" ON tarefas_planejamento;
DROP POLICY IF EXISTS "Apenas admin pode deletar tarefas" ON tarefas_planejamento;

-- Criar políticas novamente
CREATE POLICY "Usuários podem ver todas as tarefas" ON tarefas_planejamento
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Usuários podem criar tarefas" ON tarefas_planejamento
    FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND criador_id = auth.uid());

CREATE POLICY "Usuários podem atualizar próprias tarefas ou se admin" ON tarefas_planejamento
    FOR UPDATE USING (
        auth.role() = 'authenticated' AND 
        (criador_id = auth.uid() OR 
         (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin')
    );

CREATE POLICY "Apenas admin pode deletar tarefas" ON tarefas_planejamento
    FOR DELETE USING (
        auth.role() = 'authenticated' AND 
        (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
    );

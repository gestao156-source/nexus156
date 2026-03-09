/*
  Migration: Dados Básicos do Sistema
  
  Esta migration insere dados básicos essenciais para o funcionamento
  do sistema quando as tabelas estão vazias.
*/

-- Inserir assuntos padrão se a tabela estiver vazia
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'assuntos_padrao') THEN
    -- Verificar se já existem dados
    IF (SELECT COUNT(*) FROM assuntos_padrao) = 0 THEN
      INSERT INTO assuntos_padrao (id, nome, created_at) VALUES
        ('1', 'Solicitação de Serviço', NOW()),
        ('2', 'Reclamação', NOW()),
        ('3', 'Elogio', NOW()),
        ('4', 'Sugestão', NOW()),
        ('5', 'Denúncia', NOW()),
        ('6', 'Informação', NOW()),
        ('7', 'Manutenção', NOW()),
        ('8', 'Limpeza Urbana', NOW()),
        ('9', 'Iluminação Pública', NOW()),
        ('10', 'Saúde', NOW()),
        ('11', 'Educação', NOW()),
        ('12', 'Segurança', NOW()),
        ('13', 'Transporte', NOW()),
        ('14', 'Obras', NOW()),
        ('15', 'Meio Ambiente', NOW());
      
      RAISE NOTICE '✅ Assuntos padrão inseridos com sucesso';
    ELSE
      RAISE NOTICE 'ℹ️ Assuntos padrão já existem';
    END IF;
  END IF;
END $$;

-- Inserir pontos de contato se a tabela estiver vazia
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'pontos_contato') THEN
    -- Verificar se já existem dados
    IF (SELECT COUNT(*) FROM pontos_contato) = 0 THEN
      INSERT INTO pontos_contato (id, nome, created_at) VALUES
        ('1', 'Secretaria Municipal', NOW()),
        ('2', 'Prefeitura', NOW()),
        ('3', 'Setor de Serviços', NOW()),
        ('4', 'Departamento de Obras', NOW()),
        ('5', 'Setor de Limpeza', NOW()),
        ('6', 'Iluminação Pública', NOW()),
        ('7', 'Saúde Pública', NOW()),
        ('8', 'Educação', NOW()),
        ('9', 'Segurança Pública', NOW()),
        ('10', 'Transporte Público', NOW()),
        ('11', 'Meio Ambiente', NOW()),
        ('12', 'Ouvidoria', NOW()),
        ('13', 'Procon', NOW()),
        ('14', 'Defesa Civil', NOW()),
        ('15', 'Guarda Municipal', NOW());
      
      RAISE NOTICE '✅ Pontos de contato inseridos com sucesso';
    ELSE
      RAISE NOTICE 'ℹ️ Pontos de contato já existem';
    END IF;
  END IF;
END $$;

-- Verificar e garantir permissões RLS
DO $$
BEGIN
  -- Permissões para assuntos_padrao
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'assuntos_padrao') THEN
    DROP POLICY IF EXISTS "Users can view assuntos_padrao" ON assuntos_padrao;
    DROP POLICY IF EXISTS "Admins can manage assuntos_padrao" ON assuntos_padrao;
    
    CREATE POLICY "Users can view assuntos_padrao" ON assuntos_padrao
      FOR SELECT USING (true);
    
    CREATE POLICY "Admins can manage assuntos_padrao" ON assuntos_padrao
      FOR ALL USING (
        EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.id = auth.uid()
          AND profiles.role = 'admin'
        )
      );
      
    RAISE NOTICE '✅ Permissões RLS para assuntos_padrao configuradas';
  END IF;
  
  -- Permissões para pontos_contato
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'pontos_contato') THEN
    DROP POLICY IF EXISTS "Users can view pontos_contato" ON pontos_contato;
    DROP POLICY IF EXISTS "Admins can manage pontos_contato" ON pontos_contato;
    
    CREATE POLICY "Users can view pontos_contato" ON pontos_contato
      FOR SELECT USING (true);
    
    CREATE POLICY "Admins can manage pontos_contato" ON pontos_contato
      FOR ALL USING (
        EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.id = auth.uid()
          AND profiles.role = 'admin'
        )
      );
      
    RAISE NOTICE '✅ Permissões RLS para pontos_contato configuradas';
  END IF;
END $$;

-- Log final
DO $$
BEGIN
  RAISE NOTICE '🎯 Migration dados_basicos_sistema executada com sucesso';
  RAISE NOTICE '📋 Assuntos padrão verificados/inseridos';
  RAISE NOTICE '📋 Pontos de contato verificados/inseridos';
  RAISE NOTICE '📋 Permissões RLS configuradas';
END $$;

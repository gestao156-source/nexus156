-- RESTAURAR APENAS TRIGGERS DE HISTÓRICO (SEM NOTIFICAÇÕES)
-- Isso vai restaurar o histórico automático sem quebrar o sistema

-- Trigger para histórico de solicitações
CREATE OR REPLACE FUNCTION create_historico_solicitacao()
RETURNS TRIGGER AS $$
BEGIN
  -- Inserir no histórico quando criar nova solicitação
  IF TG_OP = 'INSERT' THEN
    INSERT INTO historico_procedimentos (
      item_id, item_type, procedimento, descricao, usuario_id, data_procedimento
    ) VALUES (
      NEW.id, 'solicitacao', 'criacao', 
      CONCAT('Solicitação criada: ', NEW.assunto),
      NEW.user_id, NEW.created_at
    );
    RETURN NEW;
  END IF;
  
  -- Inserir no histórico quando atualizar
  IF TG_OP = 'UPDATE' THEN
    -- Se mudou o status
    IF OLD.status IS DISTINCT FROM NEW.status THEN
      INSERT INTO historico_procedimentos (
        item_id, item_type, procedimento, descricao, usuario_id, data_procedimento
      ) VALUES (
        NEW.id, 'solicitacao', 'mudanca_status',
        CONCAT('Status alterado de ', OLD.status, ' para ', NEW.status),
        NEW.user_id, NEW.updated_at
      );
    END IF;
    
    -- Se mudou o responsável
    IF OLD.responsavel IS DISTINCT FROM NEW.responsavel THEN
      INSERT INTO historico_procedimentos (
        item_id, item_type, procedimento, descricao, usuario_id, data_procedimento
      ) VALUES (
        NEW.id, 'solicitacao', 'mudanca_responsavel',
        CONCAT('Responsável alterado de ', COALESCE(OLD.responsavel, 'N/A'), ' para ', COALESCE(NEW.responsavel, 'N/A')),
        NEW.user_id, NEW.updated_at
      );
    END IF;
    
    RETURN NEW;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para histórico de demandas
CREATE OR REPLACE FUNCTION create_historico_demanda()
RETURNS TRIGGER AS $$
BEGIN
  -- Inserir no histórico quando criar nova demanda
  IF TG_OP = 'INSERT' THEN
    INSERT INTO historico_procedimentos (
      item_id, item_type, procedimento, descricao, usuario_id, data_procedimento
    ) VALUES (
      NEW.id, 'demanda', 'criacao', 
      CONCAT('Demanda criada: ', NEW.assunto),
      NEW.user_id, NEW.created_at
    );
    RETURN NEW;
  END IF;
  
  -- Inserir no histórico quando atualizar
  IF TG_OP = 'UPDATE' THEN
    -- Se mudou o status
    IF OLD.status IS DISTINCT FROM NEW.status THEN
      INSERT INTO historico_procedimentos (
        item_id, item_type, procedimento, descricao, usuario_id, data_procedimento
      ) VALUES (
        NEW.id, 'demanda', 'mudanca_status',
        CONCAT('Status alterado de ', OLD.status, ' para ', NEW.status),
        NEW.user_id, NEW.updated_at
      );
    END IF;
    
    -- Se mudou o responsável
    IF OLD.responsavel IS DISTINCT FROM NEW.responsavel THEN
      INSERT INTO historico_procedimentos (
        item_id, item_type, procedimento, descricao, usuario_id, data_procedimento
      ) VALUES (
        NEW.id, 'demanda', 'mudanca_responsavel',
        CONCAT('Responsável alterado de ', COALESCE(OLD.responsavel, 'N/A'), ' para ', COALESCE(NEW.responsavel, 'N/A')),
        NEW.user_id, NEW.updated_at
      );
    END IF;
    
    RETURN NEW;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Criar triggers para solicitacoes
DROP TRIGGER IF EXISTS historico_solicitacoes_trigger ON solicitacoes;
CREATE TRIGGER historico_solicitacoes_trigger
  AFTER INSERT OR UPDATE ON solicitacoes
  FOR EACH ROW
  EXECUTE FUNCTION create_historico_solicitacao();

-- Criar triggers para demandas
DROP TRIGGER IF EXISTS historico_demandas_trigger ON demandas;
CREATE TRIGGER historico_demandas_trigger
  AFTER INSERT OR UPDATE ON demandas
  FOR EACH ROW
  EXECUTE FUNCTION create_historico_demanda();

-- Mensagem de confirmação
SELECT 'Histórico automático restaurado - sistema funcionando' as status;

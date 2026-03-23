-- EMERGÊNCIA: Remover triggers que estão quebrando o sistema
-- Isso vai restaurar a funcionalidade normal de criar demandas

-- Remover todos os triggers de notificações
DROP TRIGGER IF EXISTS trigger_new_solicitacao ON solicitacoes;
DROP TRIGGER IF EXISTS trigger_solicitacao_status_change ON solicitacoes;
DROP TRIGGER IF EXISTS trigger_new_demanda ON demandas;
DROP TRIGGER IF EXISTS trigger_demanda_status_change ON demandas;

-- Remover as functions dos triggers
DROP FUNCTION IF EXISTS trigger_new_solicitacao_notification();
DROP FUNCTION IF EXISTS trigger_new_demanda_notification();
DROP FUNCTION IF EXISTS trigger_status_change_notification();

-- Mensagem de confirmação
SELECT 'Sistema restaurado - triggers de notificação removidos' as status;

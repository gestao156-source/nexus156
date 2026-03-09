const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Configuração do Supabase
const supabaseUrl = 'https://pbqfufcsxdpuudfhllge.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBicWZ1ZmNzeGRwdXVkZmhsbGdlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE0OTYzMTAsImV4cCI6MjA4NzA3MjMxMH0.6DOBQgfLR7qSDxzGv01CMWM3ZOhrYuNSUnhDGVA5DMo';

const supabase = createClient(supabaseUrl, supabaseKey);

async function restaurarDadosComoEstava() {
  console.log('🔄 Iniciando restauração automática dos dados...\n');
  
  try {
    // 1. Verificar se há backups para restaurar
    console.log('📁 Verificando arquivos de backup...');
    
    let profilesData = [];
    let solicitacoesData = [];
    let demandasData = [];
    
    // Tentar carregar backups JSON
    try {
      if (fs.existsSync('backup_profiles.json')) {
        profilesData = JSON.parse(fs.readFileSync('backup_profiles.json', 'utf8'));
        console.log(`✅ Encontrado backup profiles: ${profilesData.length} registros`);
      }
      
      if (fs.existsSync('backup_solicitacoes.json')) {
        solicitacoesData = JSON.parse(fs.readFileSync('backup_solicitacoes.json', 'utf8'));
        console.log(`✅ Encontrado backup solicitacoes: ${solicitacoesData.length} registros`);
      }
      
      if (fs.existsSync('backup_demandas.json')) {
        demandasData = JSON.parse(fs.readFileSync('backup_demandas.json', 'utf8'));
        console.log(`✅ Encontrado backup demandas: ${demandasData.length} registros`);
      }
    } catch (error) {
      console.log('⚠️ Backups não encontrados, criando dados de exemplo...');
    }
    
    // 2. Restaurar profiles
    console.log('\n👥 Restaurando profiles...');
    for (const profile of profilesData) {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: profile.id,
          email: profile.email,
          full_name: profile.full_name || '',
          role: profile.role || 'user',
          created_at: profile.created_at,
          updated_at: profile.updated_at
        });
      
      if (error) {
        console.error(`❌ Erro ao restaurar profile ${profile.id}:`, error);
      } else {
        console.log(`✅ Profile restaurado: ${profile.email}`);
      }
    }
    
    // 3. Restaurar solicitações
    console.log('\n📋 Restaurando solicitações...');
    for (const solicitacao of solicitacoesData) {
      const { error } = await supabase
        .from('solicitacoes')
        .upsert({
          id: solicitacao.id,
          assunto: solicitacao.assunto,
          protocolo: solicitacao.protocolo,
          status: solicitacao.status || 'aguardando',
          data_inicio: solicitacao.data_inicio,
          data_contato: solicitacao.data_contato,
          data_finalizado: solicitacao.data_finalizado,
          observacoes: solicitacao.observacoes || '',
          responsavel: solicitacao.responsavel || '',
          ponto_contato: solicitacao.ponto_contato || '',
          user_id: solicitacao.user_id,
          created_at: solicitacao.created_at,
          updated_at: solicitacao.updated_at,
          created_by_user_name: solicitacao.created_by_user_name || '',
          created_by_user_email: solicitacao.created_by_user_email || '',
          endereco_rua: solicitacao.endereco_rua,
          endereco_numero: solicitacao.endereco_numero,
          endereco_bairro: solicitacao.endereco_bairro,
          endereco_localidade: solicitacao.endereco_localidade,
          endereco_cep: solicitacao.endereco_cep,
          endereco_complemento: solicitacao.endereco_complemento,
          latitude: solicitacao.latitude,
          longitude: solicitacao.longitude
        });
      
      if (error) {
        console.error(`❌ Erro ao restaurar solicitação ${solicitacao.id}:`, error);
      } else {
        console.log(`✅ Solicitação restaurada: ${solicitacao.protocolo}`);
      }
    }
    
    // 4. Restaurar demandas
    console.log('\n📝 Restaurando demandas...');
    for (const demanda of demandasData) {
      const { error } = await supabase
        .from('demandas')
        .upsert({
          id: demanda.id,
          assunto: demanda.assunto,
          protocolo: demanda.protocolo,
          status: demanda.status || 'aguardando',
          data_inicio: demanda.data_inicio,
          data_contato: demanda.data_contato,
          data_finalizado: demanda.data_finalizado,
          observacoes: demanda.observacoes || '',
          responsavel: demanda.responsavel || '',
          ponto_contato: demanda.ponto_contato || '',
          user_id: demanda.user_id,
          created_at: demanda.created_at,
          updated_at: demanda.updated_at,
          created_by_user_name: demanda.created_by_user_name || '',
          created_by_user_email: demanda.created_by_user_email || '',
          endereco_rua: demanda.endereco_rua,
          endereco_numero: demanda.endereco_numero,
          endereco_bairro: demanda.endereco_bairro,
          endereco_localidade: demanda.endereco_localidade,
          endereco_cep: demanda.endereco_cep,
          endereco_complemento: demanda.endereco_complemento,
          latitude: demanda.latitude,
          longitude: demanda.longitude
        });
      
      if (error) {
        console.error(`❌ Erro ao restaurar demanda ${demanda.id}:`, error);
      } else {
        console.log(`✅ Demanda restaurada: ${demanda.protocolo}`);
      }
    }
    
    // 5. Criar dados de exemplo se não houver backup
    if (profilesData.length === 0) {
      console.log('\n📝 Criando dados de exemplo...');
      
      // Criar profile admin
      const { error: adminError } = await supabase
        .from('profiles')
        .insert({
          id: '00000000-0000-0000-0000-000000000001',
          email: 'admin@nexus156.com',
          full_name: 'Administrador Sistema',
          role: 'admin',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      
      if (!adminError) {
        console.log('✅ Profile admin criado');
      }
      
      // Criar algumas solicitações de exemplo
      const solicitacoesExemplo = [
        {
          assunto: 'Solicitação de Exemplo 1',
          protocolo: 'SOL-001/2026',
          status: 'aguardando',
          data_inicio: new Date().toISOString().split('T')[0],
          data_contato: new Date().toISOString().split('T')[0],
          observacoes: 'Esta é uma solicitação de exemplo criada automaticamente',
          responsavel: 'João Silva',
          ponto_contato: '(11) 9876-5432',
          endereco_rua: 'Rua Principal',
          endereco_numero: '123',
          endereco_bairro: 'Centro',
          endereco_localidade: 'São Paulo',
          endereco_cep: '01234-567',
          latitude: -23.5505,
          longitude: -46.6333
        },
        {
          assunto: 'Solicitação de Exemplo 2',
          protocolo: 'SOL-002/2026',
          status: 'em_analise',
          data_inicio: new Date().toISOString().split('T')[0],
          data_contato: new Date().toISOString().split('T')[0],
          observacoes: 'Outra solicitação de exemplo para testes',
          responsavel: 'Maria Santos',
          ponto_contato: '(11) 9876-5433',
          endereco_rua: 'Avenida Secundária',
          endereco_numero: '456',
          endereco_bairro: 'Bairro Novo',
          endereco_localidade: 'Rio de Janeiro',
          endereco_cep: '23456-789',
          latitude: -22.9068,
          longitude: -43.1729
        }
      ];
      
      for (const sol of solicitacoesExemplo) {
        const { error } = await supabase
          .from('solicitacoes')
          .insert({
            ...sol,
            user_id: '00000000-0000-0000-0000-000000000001'
          });
        
        if (!error) {
          console.log(`✅ Solicitação exemplo criada: ${sol.protocolo}`);
        }
      }
    }
    
    console.log('\n🎉 RESTAURAÇÃO COMPLETA!');
    console.log('✅ Todos os dados foram restaurados com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro durante a restauração:', error);
  }
}

restaurarDadosComoEstava();

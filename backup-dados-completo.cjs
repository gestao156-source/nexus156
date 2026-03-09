const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Configuração do Supabase
const supabaseUrl = 'https://pbqfufcsxdpuudfhllge.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBicWZ1ZmNzeGRwdXVkZmhsbGdlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE0OTYzMTAsImV4cCI6MjA4NzA3MjMxMH0.6DOBQgfLR7qSDxzGv01CMWM3ZOhrYuNSUnhDGVA5DMo';

const supabase = createClient(supabaseUrl, supabaseKey);

async function fazerBackupCompleto() {
  console.log('🔄 Iniciando backup completo dos dados...\n');
  
  try {
    // 1. Backup dos profiles
    console.log('👥 Fazendo backup dos profiles...');
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*');
    
    if (profilesError) {
      console.error('❌ Erro ao buscar profiles:', profilesError);
      return;
    }
    
    fs.writeFileSync('backup_profiles.json', JSON.stringify(profiles, null, 2));
    console.log(`✅ Profiles salvos: ${profiles?.length || 0} registros`);

    // 2. Backup das solicitações
    console.log('📋 Fazendo backup das solicitações...');
    const { data: solicitacoes, error: solicitacoesError } = await supabase
      .from('solicitacoes')
      .select('*');
    
    if (solicitacoesError) {
      console.error('❌ Erro ao buscar solicitações:', solicitacoesError);
      return;
    }
    
    fs.writeFileSync('backup_solicitacoes.json', JSON.stringify(solicitacoes, null, 2));
    console.log(`✅ Solicitações salvas: ${solicitacoes?.length || 0} registros`);

    // 3. Backup das demandas
    console.log('📝 Fazendo backup das demandas...');
    const { data: demandas, error: demandasError } = await supabase
      .from('demandas')
      .select('*');
    
    if (demandasError) {
      console.error('❌ Erro ao buscar demandas:', demandasError);
      return;
    }
    
    fs.writeFileSync('backup_demandas.json', JSON.stringify(demandas, null, 2));
    console.log(`✅ Demandas salvas: ${demandas?.length || 0} registros`);

    // 4. Gerar CSV para Excel
    console.log('\n📊 Gerando arquivos CSV para Excel...');
    
    // CSV de profiles
    let csvProfiles = 'id,email,full_name,role,created_at,updated_at,deleted_at,deleted_by\n';
    profiles?.forEach(p => {
      csvProfiles += `${p.id},"${p.email}","${p.full_name || ''}","${p.role}","${p.created_at}","${p.updated_at}","${p.deleted_at || ''}","${p.deleted_by || ''}"\n`;
    });
    fs.writeFileSync('backup_profiles.csv', csvProfiles);
    
    // CSV de solicitações
    let csvSolicitacoes = 'id,assunto,protocolo,status,data_inicio,data_contato,data_finalizado,observacoes,responsavel,ponto_contato,user_id,created_at,updated_at,created_by_user_name,created_by_user_email,endereco_rua,endereco_numero,endereco_bairro,endereco_localidade,endereco_cep,endereco_complemento,latitude,longitude\n';
    solicitacoes?.forEach(s => {
      csvSolicitacoes += `${s.id},"${s.assunto}","${s.protocolo}","${s.status}","${s.data_inicio || ''}","${s.data_contato || ''}","${s.data_finalizado || ''}","${s.observacoes}","${s.responsavel}","${s.ponto_contato}","${s.user_id}","${s.created_at}","${s.updated_at}","${s.created_by_user_name || ''}","${s.created_by_user_email || ''}","${s.endereco_rua || ''}","${s.endereco_numero || ''}","${s.endereco_bairro || ''}","${s.endereco_localidade || ''}","${s.endereco_cep || ''}","${s.endereco_complemento || ''}","${s.latitude || ''}","${s.longitude || ''}"\n`;
    });
    fs.writeFileSync('backup_solicitacoes.csv', csvSolicitacoes);
    
    // CSV de demandas
    let csvDemandas = 'id,assunto,protocolo,status,data_inicio,data_contato,data_finalizado,observacoes,responsavel,ponto_contato,user_id,created_at,updated_at,created_by_user_name,created_by_user_email,endereco_rua,endereco_numero,endereco_bairro,endereco_localidade,endereco_cep,endereco_complemento,latitude,longitude\n';
    demandas?.forEach(d => {
      csvDemandas += `${d.id},"${d.assunto}","${d.protocolo}","${d.status}","${d.data_inicio || ''}","${d.data_contato || ''}","${d.data_finalizado || ''}","${d.observacoes}","${d.responsavel}","${d.ponto_contato}","${d.user_id}","${d.created_at}","${d.updated_at}","${d.created_by_user_name || ''}","${d.created_by_user_email || ''}","${d.endereco_rua || ''}","${d.endereco_numero || ''}","${d.endereco_bairro || ''}","${d.endereco_localidade || ''}","${d.endereco_cep || ''}","${d.endereco_complemento || ''}","${d.latitude || ''}","${d.longitude || ''}"\n`;
    });
    fs.writeFileSync('backup_demandas.csv', csvDemandas);

    console.log('\n✅ BACKUP COMPLETO REALIZADO COM SUCESSO!');
    console.log('📁 Arquivos criados:');
    console.log('   - backup_profiles.json');
    console.log('   - backup_solicitacoes.json');
    console.log('   - backup_demandas.json');
    console.log('   - backup_profiles.csv');
    console.log('   - backup_solicitacoes.csv');
    console.log('   - backup_demandas.csv');

  } catch (error) {
    console.error('❌ Erro durante o backup:', error);
  }
}

fazerBackupCompleto();

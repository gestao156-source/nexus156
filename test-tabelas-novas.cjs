const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase
const supabaseUrl = 'https://pbqfufcsxdpuudfhllge.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBicWZ1ZmNzeGRwdXVkZmhsbGdlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE0OTYzMTAsImV4cCI6MjA4NzA3MjMxMH0.6DOBQgfLR7qSDxzGv01CMWM3ZOhrYuNSUnhDGVA5DMo';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testarTabelasNovas() {
  console.log('🔍 Testando tabelas novas (v2)...\n');
  
  try {
    // Testar profiles_v2
    console.log('👥 Testando profiles_v2...');
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles_v2')
      .select('*')
      .limit(5);
    
    if (profilesError) {
      console.error('❌ Erro nos profiles_v2:', profilesError);
    } else {
      console.log(`✅ Profiles_v2 carregados: ${profiles?.length || 0} itens`);
      profiles?.forEach(item => {
        console.log(`   - ${item.full_name} (${item.email})`);
      });
    }

    // Testar solicitacoes_v2
    console.log('\n📋 Testando solicitacoes_v2...');
    const { data: solicitacoes, error: solicitacoesError } = await supabase
      .from('solicitacoes_v2')
      .select('*')
      .limit(5);
    
    if (solicitacoesError) {
      console.error('❌ Erro nas solicitacoes_v2:', solicitacoesError);
    } else {
      console.log(`✅ Solicitações_v2 carregadas: ${solicitacoes?.length || 0} itens`);
      solicitacoes?.forEach(item => {
        console.log(`   - ${item.assunto} (${item.status})`);
      });
    }

    // Testar demandas_v2
    console.log('\n📝 Testando demandas_v2...');
    const { data: demandas, error: demandasError } = await supabase
      .from('demandas_v2')
      .select('*')
      .limit(5);
    
    if (demandasError) {
      console.error('❌ Erro nas demandas_v2:', demandasError);
    } else {
      console.log(`✅ Demandas_v2 carregadas: ${demandas?.length || 0} itens`);
      demandas?.forEach(item => {
        console.log(`   - ${item.assunto} (${item.status})`);
      });
    }

    // Verificar contagem
    console.log('\n📊 Verificando totais...');
    const { count: profilesCount } = await supabase
      .from('profiles_v2')
      .select('*', { count: 'exact', head: true });
    
    const { count: solicitacoesCount } = await supabase
      .from('solicitacoes_v2')
      .select('*', { count: 'exact', head: true });
    
    const { count: demandasCount } = await supabase
      .from('demandas_v2')
      .select('*', { count: 'exact', head: true });
    
    console.log(`👥 Total profiles_v2: ${profilesCount || 0}`);
    console.log(`📋 Total solicitacoes_v2: ${solicitacoesCount || 0}`);
    console.log(`📝 Total demandas_v2: ${demandasCount || 0}`);

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

testarTabelasNovas();

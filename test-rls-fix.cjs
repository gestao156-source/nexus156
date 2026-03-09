const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase
const supabaseUrl = 'https://pbqfufcsxdpuudfhllge.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBicWZ1ZmNzeGRwdXVkZmhsbGdlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE0OTYzMTAsImV4cCI6MjA4NzA3MjMxMH0.6DOBQgfLR7qSDxzGv01CMWM3ZOhrYuNSUnhDGVA5DMo';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testRLSPolicies() {
  console.log('🔍 Testando políticas RLS após correção...\n');
  
  try {
    // Testar leitura de solicitacoes
    console.log('📋 Testando solicitações...');
    const { data: solicitacoes, error: solicitacoesError } = await supabase
      .from('solicitacoes')
      .select('*')
      .limit(5);
    
    if (solicitacoesError) {
      console.error('❌ Erro nas solicitações:', solicitacoesError);
    } else {
      console.log(`✅ Solicitações carregadas: ${solicitacoes?.length || 0} itens`);
      if (solicitacoes && solicitacoes.length > 0) {
        console.log('   Exemplo:', solicitacoes[0].assunto);
      }
    }

    // Testar leitura de demandas
    console.log('\n📝 Testando demandas...');
    const { data: demandas, error: demandasError } = await supabase
      .from('demandas')
      .select('*')
      .limit(5);
    
    if (demandasError) {
      console.error('❌ Erro nas demandas:', demandasError);
    } else {
      console.log(`✅ Demandas carregadas: ${demandas?.length || 0} itens`);
      if (demandas && demandas.length > 0) {
        console.log('   Exemplo:', demandas[0].assunto);
      }
    }

    // Testar leitura de profiles
    console.log('\n👥 Testando profiles...');
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, full_name, email')
      .limit(5);
    
    if (profilesError) {
      console.error('❌ Erro nos profiles:', profilesError);
    } else {
      console.log(`✅ Profiles carregados: ${profiles?.length || 0} itens`);
      if (profiles && profiles.length > 0) {
        console.log('   Exemplo:', profiles[0].full_name);
      }
    }

    // Testar consulta com coordenadas (para o mapa)
    console.log('\n🗺️ Testando itens com coordenadas...');
    const { data: itensComCoordenadas, error: coordsError } = await supabase
      .from('solicitacoes')
      .select('*')
      .not('latitude', 'is', null)
      .not('longitude', 'is', null)
      .limit(3);
    
    if (coordsError) {
      console.error('❌ Erro nas coordenadas:', coordsError);
    } else {
      console.log(`✅ Itens com coordenadas: ${itensComCoordenadas?.length || 0} itens`);
    }

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

testRLSPolicies();

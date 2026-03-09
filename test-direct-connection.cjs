const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase
const supabaseUrl = 'https://pbqfufcsxdpuudfhllge.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBicWZ1ZmNzeGRwdXVkZmhsbGdlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE0OTYzMTAsImV4cCI6MjA4NzA3MjMxMH0.6DOBQgfLR7qSDxzGv01CMWM3ZOhrYuNSUnhDGVA5DMo';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testDirectConnection() {
  console.log('🔍 Testando conexão direta sem RLS...\n');
  
  try {
    // Testar leitura simples de solicitacoes
    console.log('📋 Testando solicitações...');
    const { data: solicitacoes, error: solicitacoesError } = await supabase
      .from('solicitacoes')
      .select('id, assunto, protocolo, status')
      .limit(3);
    
    if (solicitacoesError) {
      console.error('❌ Erro nas solicitações:', solicitacoesError);
    } else {
      console.log(`✅ Solicitações carregadas: ${solicitacoes?.length || 0} itens`);
      solicitacoes?.forEach(item => {
        console.log(`   - ${item.assunto} (${item.status})`);
      });
    }

    // Testar leitura simples de demandas
    console.log('\n📝 Testando demandas...');
    const { data: demandas, error: demandasError } = await supabase
      .from('demandas')
      .select('id, assunto, protocolo, status')
      .limit(3);
    
    if (demandasError) {
      console.error('❌ Erro nas demandas:', demandasError);
    } else {
      console.log(`✅ Demandas carregadas: ${demandas?.length || 0} itens`);
      demandas?.forEach(item => {
        console.log(`   - ${item.assunto} (${item.status})`);
      });
    }

    // Testar se há dados na tabela
    console.log('\n📊 Verificando totais...');
    const { count: solicitacoesCount } = await supabase
      .from('solicitacoes')
      .select('*', { count: 'exact', head: true });
    
    const { count: demandasCount } = await supabase
      .from('demandas')
      .select('*', { count: 'exact', head: true });
    
    console.log(`📋 Total de solicitações: ${solicitacoesCount || 0}`);
    console.log(`📝 Total de demandas: ${demandasCount || 0}`);

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

testDirectConnection();

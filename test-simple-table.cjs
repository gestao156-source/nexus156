const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase
const supabaseUrl = 'https://pbqfufcsxdpuudfhllge.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBicWZ1ZmNzeGRwdXVkZmhsbGdlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE0OTYzMTAsImV4cCI6MjA4NzA3MjMxMH0.6DOBQgfLR7qSDxzGv01CMWM3ZOhrYuNSUnhDGVA5DMo';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testSimpleTable() {
  console.log('🔍 Testando tabela simples sem RLS...\n');
  
  try {
    // Testar leitura da tabela de teste
    console.log('📋 Testando test_table...');
    const { data: testData, error: testError } = await supabase
      .from('test_table')
      .select('*')
      .limit(5);
    
    if (testError) {
      console.error('❌ Erro na test_table:', testError);
    } else {
      console.log(`✅ test_table carregada: ${testData?.length || 0} itens`);
      testData?.forEach(item => {
        console.log(`   - ${item.name}`);
      });
    }

    // Testar leitura das tabelas principais
    console.log('\n📋 Testando solicitacoes (depois da test_table)...');
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

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

testSimpleTable();

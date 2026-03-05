// Teste de conexão com Supabase
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://pbqfufcsxdpuudfhllge.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBicWZ1ZmNzeGRwdXVkZmhsbGdlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE0OTYzMTAsImV4cCI6MjA4NzA3MjMxMH0.6DOBQgfLR7qSDxzGv01CMWM3ZOhrYuNSUnhDGVA5DMo'
);

async function testSupabaseConnection() {
  console.log('🔍 Testando conexão com Supabase...');
  
  try {
    // Teste de conexão básica
    const { data, error } = await supabase
      .from('solicitacoes')
      .select('count')
      .limit(1);
    
    if (error) {
      console.error('❌ Erro na conexão:', error.message);
      return false;
    }
    
    console.log('✅ Conexão com Supabase funcionando!');
    console.log('📊 Dados recebidos:', data);
    
    // Testar se a tabela existe
    const { data: tables, error: tablesError } = await supabase
      .from('solicitacoes')
      .select('*')
      .limit(1);
    
    if (tablesError) {
      console.log('⚠️ Tabela solicitacoes pode não existir:', tablesError.message);
    } else {
      console.log('✅ Tabela solicitacoes acessível');
    }
    
    return true;
  } catch (err) {
    console.error('❌ Erro crítico:', err);
    return false;
  }
}

testSupabaseConnection().then(success => {
  if (success) {
    console.log('🎉 Teste concluído com sucesso!');
  } else {
    console.log('💥 Teste falhou - verificar configuração');
  }
});

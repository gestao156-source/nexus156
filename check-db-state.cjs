const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase
const supabaseUrl = 'https://pbqfufcsxdpuudfhllge.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBicWZ1ZmNzeGRwdXVkZmhsbGdlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE0OTYzMTAsImV4cCI6MjA4NzA3MjMxMH0.6DOBQgfLR7qSDxzGv01CMWM3ZOhrYuNSUnhDGVA5DMo';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDatabaseState() {
  console.log('🔍 Verificando estado atual do banco...\n');
  
  try {
    // Tentar usar RPC para executar SQL direto
    console.log('🔧 Tentando verificar políticas via SQL...');
    
    // Verificar se RLS está ativo
    const { data: rlsStatus, error: rlsError } = await supabase
      .rpc('exec_sql', { 
        sql: "SELECT schemaname, tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public' AND tablename IN ('profiles', 'solicitacoes', 'demandas');" 
      });
    
    if (rlsError) {
      console.error('❌ Erro ao verificar RLS:', rlsError);
    } else {
      console.log('✅ Status RLS:', rlsStatus);
    }

    // Tentar consulta simples sem envolver profiles
    console.log('\n📋 Tentando consulta direta...');
    const { data: testData, error: testError } = await supabase
      .from('solicitacoes')
      .select('id')
      .limit(1);
    
    if (testError) {
      console.error('❌ Erro na consulta simples:', testError);
      
      // Tentar descobrir qual política está causando problema
      console.log('\n🔍 Tentando identificar política problemática...');
      const { data: policies, error: policyError } = await supabase
        .rpc('exec_sql', { 
          sql: "SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual FROM pg_policies WHERE schemaname = 'public';" 
        });
      
      if (policyError) {
        console.error('❌ Erro ao listar políticas:', policyError);
      } else {
        console.log('📋 Políticas ativas:', policies);
      }
    } else {
      console.log('✅ Consulta simples funcionou:', testData);
    }

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

checkDatabaseState();

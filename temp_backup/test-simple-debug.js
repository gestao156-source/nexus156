// Teste simples para debug das funcionalidades admin
// Execute com: node test-simple-debug.cjs

const { createClient } = require('@supabase/supabase-js');

// Pega as credenciais do arquivo .env
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente não encontradas');
  console.log('Configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testBasicConnection() {
  console.log('🔍 Testando conexão básica...');
  
  try {
    // 1. Testar conexão com a tabela profiles
    const { data, error } = await supabase
      .from('profiles')
      .select('id, email, role')
      .limit(5);
    
    if (error) {
      console.error('❌ Erro ao acessar profiles:', error);
      return false;
    }
    
    console.log('✅ Conexão OK - Encontrados', data.length, 'perfis');
    data.forEach(profile => {
      console.log(`  - ${profile.email} (${profile.role})`);
    });
    
    return true;
  } catch (error) {
    console.error('❌ Erro na conexão:', error);
    return false;
  }
}

async function testRPCFunction() {
  console.log('\n🧪 Testando RPC function...');
  
  try {
    // Testar se a function existe
    const { data, error } = await supabase.rpc('update_user_role', {
      user_id: '00000000-0000-0000-0000-000000000000', // ID inválido para teste
      new_role: 'admin'
    });
    
    if (error) {
      console.log('📝 RPC function respondeu (erro esperado):', error.message);
      // Se o erro for sobre usuário não encontrado, a function existe
      if (error.message.includes('não encontrado') || error.message.includes('not found')) {
        console.log('✅ RPC function existe e está funcionando');
        return true;
      } else {
        console.error('❌ Erro inesperado na RPC:', error);
        return false;
      }
    }
    
    console.log('✅ RPC function executada:', data);
    return true;
  } catch (error) {
    console.error('❌ Erro ao testar RPC:', error);
    return false;
  }
}

async function testEdgeFunction() {
  console.log('\n🌐 Testando Edge Function...');
  
  try {
    const { data, error } = await supabase.functions.invoke('reset-password', {
      body: { userId: 'test-id' }
    });
    
    if (error) {
      console.log('📝 Edge Function respondeu:', error.message);
      // Se o erro for 401/403, a function existe mas precisa de autenticação
      if (error.message.includes('Unauthorized') || error.message.includes('Forbidden')) {
        console.log('✅ Edge Function existe (precisa de autenticação)');
        return true;
      } else {
        console.error('❌ Erro inesperado na Edge Function:', error);
        return false;
      }
    }
    
    console.log('✅ Edge Function executada:', data);
    return true;
  } catch (error) {
    console.error('❌ Erro ao testar Edge Function:', error);
    return false;
  }
}

async function main() {
  console.log('🚀 Iniciando testes de debug...\n');
  
  const connectionOk = await testBasicConnection();
  const rpcOk = await testRPCFunction();
  const edgeOk = await testEdgeFunction();
  
  console.log('\n📊 Resumo dos Testes:');
  console.log(`  Conexão: ${connectionOk ? '✅' : '❌'}`);
  console.log(`  RPC Function: ${rpcOk ? '✅' : '❌'}`);
  console.log(`  Edge Function: ${edgeOk ? '✅' : '❌'}`);
  
  if (connectionOk && rpcOk && edgeOk) {
    console.log('\n🎉 Todos os componentes estão funcionando!');
  } else {
    console.log('\n⚠️ Alguns componentes precisam de atenção');
  }
}

main().catch(console.error);

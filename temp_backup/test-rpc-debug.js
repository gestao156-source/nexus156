// Script de teste para debug da RPC function
const { createClient } = require('@supabase/supabase-js');

// Configuração
const supabaseUrl = 'https://seu-projeto.supabase.co';
const supabaseKey = 'sua-anon-key';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testRPCFunction() {
  console.log('🔍 Iniciando teste da RPC function...');
  
  try {
    // 1. Verificar se usuário está autenticado
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      console.error('❌ Erro de autenticação:', authError);
      return;
    }
    
    console.log('✅ Usuário autenticado:', user?.email);
    console.log('✅ User ID:', user?.id);
    
    // 2. Verificar role do usuário
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();
    
    if (profileError) {
      console.error('❌ Erro ao buscar perfil:', profileError);
      return;
    }
    
    console.log('✅ Role do usuário:', profile?.role);
    
    // 3. Testar RPC function
    console.log('🧪 Testando RPC function...');
    
    // Primeiro, vamos testar com um user ID válido
    // Substitua 'user-id-de-teste' por um ID real
    const testUserId = 'user-id-de-teste';
    
    const { data, error } = await supabase.rpc('update_user_role', {
      user_id: testUserId,
      new_role: 'admin'
    });
    
    if (error) {
      console.error('❌ Erro na RPC function:', error);
      console.error('Detalhes:', error.message);
      console.error('Code:', error.code);
      console.error('Details:', error.details);
      return;
    }
    
    console.log('✅ RPC function executada com sucesso:', data);
    
  } catch (error) {
    console.error('❌ Erro inesperado:', error);
  }
}

// Testar Edge Function
async function testEdgeFunction() {
  console.log('🔍 Testando Edge Function...');
  
  try {
    const { data, error } = await supabase.functions.invoke('reset-password', {
      body: { userId: 'test-user-id' }
    });
    
    if (error) {
      console.error('❌ Erro na Edge Function:', error);
      return;
    }
    
    console.log('✅ Edge Function executada:', data);
    
  } catch (error) {
    console.error('❌ Erro na Edge Function:', error);
  }
}

// Executar testes
async function runTests() {
  console.log('🚀 Iniciando testes de debug...\n');
  
  await testRPCFunction();
  console.log('\n');
  await testEdgeFunction();
  
  console.log('\n✅ Testes concluídos');
}

runTests();

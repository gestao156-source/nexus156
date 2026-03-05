import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Verificar se o usuário está autenticado
    const {
      data: { user },
      error: authError,
    } = await supabaseClient.auth.getUser(
      req.headers.get('Authorization')!.replace('Bearer ', '')
    )

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      )
    }

    // Verificar se o usuário é admin
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError || profile?.role !== 'admin') {
      return new Response(
        JSON.stringify({ error: 'Insufficient permissions' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
      )
    }

    // Obter dados do request
    const { userId } = await req.json()

    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'User ID is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Verificar se o usuário alvo existe
    const { data: targetProfile, error: targetError } = await supabaseClient
      .from('profiles')
      .select('email')
      .eq('id', userId)
      .single()

    if (targetError) {
      return new Response(
        JSON.stringify({ error: 'Target user not found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      )
    }

    // Resetar senha para "123" usando Admin API
    const { error: resetError } = await supabaseClient.auth.admin.updateUserById(
      userId,
      { password: '123' }
    )

    if (resetError) {
      console.error('Error resetting password:', resetError)
      return new Response(
        JSON.stringify({ error: 'Failed to reset password' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    // Log da operação
    console.log(`Password reset: ${user.email} reset password for user ${targetProfile.email} (${userId})`)

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Password reset successfully',
        data: {
          userId: userId,
          userEmail: targetProfile.email,
          newPassword: '123',
          resetBy: user.email
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )

  } catch (error) {
    console.error('Error in reset-user-password function:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})

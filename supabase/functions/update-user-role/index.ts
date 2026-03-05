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
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Verificar se o usuário está autenticado
    const {
      data: { user },
      error: authError,
    } = await supabaseClient.auth.getUser()

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
    const { userId, newRole } = await req.json()

    if (!userId || !newRole || !['admin', 'user'].includes(newRole)) {
      return new Response(
        JSON.stringify({ error: 'Invalid parameters' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Impedir auto-alteração
    if (userId === user.id) {
      return new Response(
        JSON.stringify({ error: 'Cannot change your own role' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Verificar se o usuário alvo existe
    const { data: targetProfile, error: targetError } = await supabaseClient
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single()

    if (targetError) {
      return new Response(
        JSON.stringify({ error: 'Target user not found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      )
    }

    // Verificar se manterá pelo menos 1 admin
    if (targetProfile.role === 'admin' && newRole === 'user') {
      const { count, error: countError } = await supabaseClient
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'admin')

      if (countError || count === 1) {
        return new Response(
          JSON.stringify({ error: 'Cannot remove the last admin' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
      }
    }

    // Atualizar role do usuário
    const { data, error: updateError } = await supabaseClient
      .from('profiles')
      .update({ role: newRole })
      .eq('id', userId)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating user role:', updateError)
      return new Response(
        JSON.stringify({ error: 'Failed to update user role' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    // Log da operação
    console.log(`Role updated: ${user.email} changed ${targetProfile.role} -> ${newRole} for user ${userId}`)

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'User role updated successfully',
        data: {
          userId: userId,
          oldRole: targetProfile.role,
          newRole: newRole,
          updatedBy: user.email
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )

  } catch (error) {
    console.error('Error in update-user-role function:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})

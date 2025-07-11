import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.31.0';
Deno.serve(async (req)=>{
  try {
    const url = new URL(req.url);
    const path = url.pathname;
    const params = url.searchParams;
    // Environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_KEY');
    const supabaseAnonKey = Deno.env.get('SUPABASE_KEY');
    const frontendUrl = Deno.env.get('FRONTEND_URL') || 'https://sabiops.vercel.app';
    // Supabase clients
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey);
    // --- EMAIL VERIFICATION ---
    if (path === '/verify-email') {
      const token = params.get('token');
      const email = params.get('email');
      if (!token || !email) {
        return Response.redirect(`${frontendUrl}/email-verified?success=false&reason=missing_params`, 302);
      }
      const { data: tokenData, error: tokenError } = await supabaseAdmin.from('email_verification_tokens').select('*').eq('token', token).eq('used', false).single();
      if (tokenError || !tokenData) {
        return Response.redirect(`${frontendUrl}/email-verified?success=false&reason=invalid_token`, 302);
      }
      if (new Date(tokenData.expires_at) < new Date()) {
        return Response.redirect(`${frontendUrl}/email-verified?success=false&reason=expired_token`, 302);
      }
      const { data: userData, error: userError } = await supabaseAdmin.rpc('get_auth_user_by_id', {
        user_id: tokenData.user_id
      });
      if (userError || !userData || userData.length === 0) {
        return Response.redirect(`${frontendUrl}/email-verified?success=false&reason=user_not_found`, 302);
      }
      if (userData[0].email !== email) {
        return Response.redirect(`${frontendUrl}/email-verified?success=false&reason=email_mismatch`, 302);
      }
      const { error: updateAuthError } = await supabaseAdmin.auth.admin.updateUserById(tokenData.user_id, {
        email_confirmed: true
      });
      if (updateAuthError) {
        return Response.redirect(`${frontendUrl}/email-verified?success=false&reason=auth_update_failed`, 302);
      }
      await supabaseAdmin.from('users').update({
        email_confirmed: true
      }).eq('id', tokenData.user_id);
      await supabaseAdmin.from('email_verification_tokens').update({
        used: true
      }).eq('id', tokenData.id);
      return Response.redirect(`${frontendUrl}/email-verified?success=true&email=${encodeURIComponent(email)}`, 302);
    } else if (path === '/reset-password') {
      const token = params.get('token');
      const email = params.get('email');
      if (!token || !email) {
        return Response.redirect(`${frontendUrl}/reset-password?success=false&reason=missing_params`, 302);
      }
      const { data: tokenData, error: tokenError } = await supabaseAdmin.from('password_reset_tokens').select('*').eq('reset_code', token).eq('used', false).single();
      if (tokenError || !tokenData) {
        return Response.redirect(`${frontendUrl}/reset-password?success=false&reason=invalid_token`, 302);
      }
      if (new Date(tokenData.expires_at) < new Date()) {
        return Response.redirect(`${frontendUrl}/reset-password?success=false&reason=expired_token`, 302);
      }
      const { data: userData, error: userError } = await supabaseAdmin.from('users').select('*').eq('id', tokenData.user_id).single();
      if (userError || !userData) {
        return Response.redirect(`${frontendUrl}/reset-password?success=false&reason=user_not_found`, 302);
      }
      if (userData.email !== email) {
        return Response.redirect(`${frontendUrl}/reset-password?success=false&reason=email_mismatch`, 302);
      }
      if (userData.role.toLowerCase() !== 'owner') {
        return Response.redirect(`${frontendUrl}/reset-password?success=false&reason=not_owner`, 302);
      }
      return Response.redirect(`${frontendUrl}/reset-password?token=${token}&email=${encodeURIComponent(email)}`, 302);
    } else if (path === '/complete-reset' && req.method === 'POST') {
      const { token, email, password } = await req.json();
      if (!token || !email || !password) {
        return new Response(JSON.stringify({
          error: 'Missing required parameters'
        }), {
          status: 400,
          headers: {
            'Content-Type': 'application/json'
          }
        });
      }
      const { data: tokenData, error: tokenError } = await supabaseAdmin.from('password_reset_tokens').select('*').eq('reset_code', token).eq('used', false).single();
      if (tokenError || !tokenData) {
        return new Response(JSON.stringify({
          error: 'Invalid or expired reset token'
        }), {
          status: 400,
          headers: {
            'Content-Type': 'application/json'
          }
        });
      }
      if (new Date(tokenData.expires_at) < new Date()) {
        return new Response(JSON.stringify({
          error: 'Reset token has expired'
        }), {
          status: 400,
          headers: {
            'Content-Type': 'application/json'
          }
        });
      }
      const { data: userData, error: userError } = await supabaseAdmin.from('users').select('*').eq('id', tokenData.user_id).single();
      if (userError || !userData) {
        return new Response(JSON.stringify({
          error: 'User not found'
        }), {
          status: 404,
          headers: {
            'Content-Type': 'application/json'
          }
        });
      }
      if (userData.email !== email) {
        return new Response(JSON.stringify({
          error: 'Email mismatch'
        }), {
          status: 400,
          headers: {
            'Content-Type': 'application/json'
          }
        });
      }
      if (userData.role.toLowerCase() !== 'owner') {
        return new Response(JSON.stringify({
          error: 'Only owners can reset passwords'
        }), {
          status: 403,
          headers: {
            'Content-Type': 'application/json'
          }
        });
      }
      const { error: updateAuthError } = await supabaseAdmin.auth.admin.updateUserById(tokenData.user_id, {
        password
      });
      if (updateAuthError) {
        return new Response(JSON.stringify({
          error: 'Failed to update password'
        }), {
          status: 500,
          headers: {
            'Content-Type': 'application/json'
          }
        });
      }
      await supabaseAdmin.from('password_reset_tokens').update({
        used: true
      }).eq('id', tokenData.id);
      return new Response(JSON.stringify({
        success: true,
        message: 'Password updated successfully'
      }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }
    // --- INVALID ENDPOINT ---
    return new Response(JSON.stringify({
      error: 'Invalid endpoint'
    }), {
      status: 404,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Error in auth-handler:', error);
    return new Response(JSON.stringify({
      error: 'Internal server error',
      details: error.message
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
});

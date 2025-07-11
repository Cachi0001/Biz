import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.31.0';

Deno.serve(async (req) => {
  try {
    const url = new URL(req.url);
    const path = url.pathname;
    const params = url.searchParams;

    console.log(`Incoming path: ${path}`);
    console.log(`Is path /smooth-api/verify-email? ${path === '/smooth-api/verify-email'}`);

    // Environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'); // Corrected name
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY'); // Corrected name
    const frontendUrl = Deno.env.get('FRONTEND_URL') || 'https://sabiops.vercel.app';

    // Supabase clients
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey);

    // --- EMAIL VERIFICATION ---
    if (path === '/smooth-api/verify-email') {
      const token = params.get('token');
      const emailFromParam = params.get('email'); // Renamed to avoid conflict

      if (!token || !emailFromParam) {
        return Response.redirect(`${frontendUrl}/email-verified?success=false&reason=missing_params`, 302);
      }

      // Verify the token against the database
      const { data: tokenData, error: tokenError } = await supabaseAdmin
        .from('email_verification_tokens')
        .select('*')
        .eq('token', token)
        .eq('used', false)
        .single();

      if (tokenError || !tokenData) {
        console.error('Token verification error:', tokenError);
        return Response.redirect(`${frontendUrl}/email-verified?success=false&reason=invalid_token`, 302);
      }

      // Fetch user details using user_id from tokenData
      const { data: userData, error: userError } = await supabaseAdmin
        .from('users')
        .select('email')
        .eq('id', tokenData.user_id)
        .single();

      if (userError || !userData) {
        console.error('User fetch error:', userError);
        return Response.redirect(`${frontendUrl}/email-verified?success=false&reason=user_not_found`, 302);
      }

      // Ensure the email from the URL matches the user's email
      if (userData.email !== emailFromParam) {
        console.error('Email mismatch:', userData.email, emailFromParam);
        return Response.redirect(`${frontendUrl}/email-verified?success=false&reason=email_mismatch`, 302);
      }

      // Check if token has expired
      if (new Date(tokenData.expires_at) < new Date()) {
        return Response.redirect(`${frontendUrl}/email-verified?success=false&reason=expired_token`, 302);
      }

      // Update user's email_confirmed_at and mark token as used
      const { error: userUpdateError } = await supabaseAdmin.from('users')
        .update({ email_confirmed_at: new Date().toISOString() })
        .eq('id', tokenData.user_id); // Use user_id for update

      if (userUpdateError) {
        console.error('User update error:', userUpdateError);
        return Response.redirect(`${frontendUrl}/email-verified?success=false&reason=user_update_failed`, 302);
      }

      const { error: tokenUsedError } = await supabaseAdmin.from('email_verification_tokens')
        .update({ used: true })
        .eq('id', tokenData.id);

      if (tokenUsedError) {
        console.error('Token used update error:', tokenUsedError);
        // Log error but still redirect to success as user email is confirmed
      }

      // Redirect to dashboard on success
      return Response.redirect(`${frontendUrl}/dashboard?email_verified=true`, 302);

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
        return new Response(JSON.stringify({ error: 'Missing required parameters' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      const { data: tokenData, error: tokenError } = await supabaseAdmin.from('password_reset_tokens').select('*').eq('reset_code', token).eq('used', false).single();
      if (tokenError || !tokenData) {
        return new Response(JSON.stringify({ error: 'Invalid or expired reset token' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      if (new Date(tokenData.expires_at) < new Date()) {
        return new Response(JSON.stringify({ error: 'Reset token has expired' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      const { data: userData, error: userError } = await supabaseAdmin.from('users').select('*').eq('id', tokenData.user_id).single();
      if (userError || !userData) {
        return new Response(JSON.stringify({ error: 'User not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      if (userData.email !== email) {
        return new Response(JSON.stringify({ error: 'Email mismatch' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      if (userData.role.toLowerCase() !== 'owner') {
        return new Response(JSON.stringify({ error: 'Only owners can reset passwords' }), {
          status: 403,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      const { error: updateAuthError } = await supabaseAdmin.auth.admin.updateUserById(
        tokenData.user_id,
        { password }
      );

      if (updateAuthError) {
        return new Response(JSON.stringify({ error: 'Failed to update password' }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      await supabaseAdmin.from('password_reset_tokens').update({ used: true }).eq('id', tokenData.id);

      return new Response(JSON.stringify({ success: true, message: 'Password updated successfully' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // --- INVALID ENDPOINT ---
    return new Response(JSON.stringify({ error: 'Invalid endpoint' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in auth-handler:', error);
    return new Response(JSON.stringify({
      error: 'Internal server error',
      details: error.message,
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});



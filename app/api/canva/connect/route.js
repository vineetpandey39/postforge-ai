export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  if (error) {
    return new Response(`
      <html><body style="font-family:sans-serif;padding:40px;background:#07090F;color:#E8EAF0">
        <h2 style="color:#EF4444">❌ Authorization Error</h2>
        <p>${error}</p>
      </body></html>
    `, { headers: { 'Content-Type': 'text/html' } });
  }

  if (!code) {
    return new Response(`
      <html><body style="font-family:sans-serif;padding:40px;background:#07090F;color:#E8EAF0">
        <h2 style="color:#EF4444">❌ No code received</h2>
      </body></html>
    `, { headers: { 'Content-Type': 'text/html' } });
  }

  try {
    const clientId = process.env.CANVA_CLIENT_ID;
    const clientSecret = process.env.CANVA_CLIENT_SECRET;
    const redirectUri = process.env.NEXT_PUBLIC_APP_URL
      ? `${process.env.NEXT_PUBLIC_APP_URL}/api/canva/callback`
      : 'https://postforge-ai-one.vercel.app/api/canva/callback';

    const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

    const tokenRes = await fetch('https://api.canva.com/rest/v1/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${credentials}`,
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
      }),
    });

    const tokenData = await tokenRes.json();

    if (!tokenData.access_token) {
      throw new Error(JSON.stringify(tokenData));
    }

    // Show success page with the token
    return new Response(`
      <html>
      <body style="font-family:'DM Sans',sans-serif;padding:40px;background:#07090F;color:#E8EAF0;max-width:700px;margin:0 auto">
        <div style="background:rgba(16,185,129,0.1);border:1px solid rgba(16,185,129,0.3);border-radius:12px;padding:24px;margin-bottom:24px">
          <h2 style="color:#10B981;margin:0 0 8px">✅ Canva Connected Successfully!</h2>
          <p style="color:#6B7280;margin:0">Your access token has been generated.</p>
        </div>

        <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:20px;margin-bottom:20px">
          <p style="color:#F59E0B;font-weight:700;margin:0 0 12px">📋 Your Access Token:</p>
          <div style="background:#000;border-radius:8px;padding:14px;word-break:break-all;font-family:monospace;font-size:12px;color:#10B981;margin-bottom:12px">
            ${tokenData.access_token}
          </div>
          <button onclick="navigator.clipboard.writeText('${tokenData.access_token}').then(()=>this.textContent='✓ Copied!')" 
            style="background:linear-gradient(135deg,#10B981,#059669);border:none;border-radius:8px;padding:10px 20px;color:#fff;font-weight:700;cursor:pointer;font-size:13px">
            📋 Copy Token
          </button>
        </div>

        ${tokenData.refresh_token ? `
        <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:20px;margin-bottom:20px">
          <p style="color:#8B5CF6;font-weight:700;margin:0 0 12px">🔄 Refresh Token (save this too):</p>
          <div style="background:#000;border-radius:8px;padding:14px;word-break:break-all;font-family:monospace;font-size:12px;color:#8B5CF6">
            ${tokenData.refresh_token}
          </div>
        </div>
        ` : ''}

        <div style="background:rgba(59,130,246,0.08);border:1px solid rgba(59,130,246,0.2);border-radius:10px;padding:16px">
          <p style="color:#93C5FD;font-weight:700;margin:0 0 8px">⚡ Next Steps:</p>
          <ol style="color:#6B7280;margin:0;padding-left:20px;line-height:1.8">
            <li>Copy the access token above</li>
            <li>Go to <strong style="color:#E8EAF0">Vercel → Settings → Environment Variables</strong></li>
            <li>Add: <code style="color:#F59E0B">CANVA_ACCESS_TOKEN</code> = paste token</li>
            <li>Click Save → Redeploy</li>
            <li>Canva carousel creation will work! ✅</li>
          </ol>
        </div>

        <p style="color:#4B5563;font-size:11px;margin-top:16px">
          Token expires in: ${Math.round(tokenData.expires_in / 3600)} hours. 
          ${tokenData.refresh_token ? 'Refresh token saved for renewal.' : ''}
        </p>
      </body>
      </html>
    `, { headers: { 'Content-Type': 'text/html' } });

  } catch (e) {
    return new Response(`
      <html><body style="font-family:sans-serif;padding:40px;background:#07090F;color:#E8EAF0">
        <h2 style="color:#EF4444">❌ Token Exchange Failed</h2>
        <pre style="background:#000;padding:16px;border-radius:8px;color:#FCA5A5;font-size:12px">${e.message}</pre>
      </body></html>
    `, { headers: { 'Content-Type': 'text/html' } });
  }
}

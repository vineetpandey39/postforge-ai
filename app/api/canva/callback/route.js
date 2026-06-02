export async function GET() {
  const clientId = process.env.CANVA_CLIENT_ID;
  const redirectUri = process.env.NEXT_PUBLIC_APP_URL
    ? `${process.env.NEXT_PUBLIC_APP_URL}/api/canva/callback`
    : 'https://postforge-ai-one.vercel.app/api/canva/callback';

  if (!clientId) {
    return new Response('CANVA_CLIENT_ID not configured in Vercel env vars', { status: 500 });
  }

  const scope = [
    'design:content:write',
    'design:meta:read',
    'asset:read',
    'asset:write',
  ].join(' ');

  const authUrl = `https://www.canva.com/api/oauth/authorize?` + new URLSearchParams({
    client_id: clientId,
    response_type: 'code',
    redirect_uri: redirectUri,
    scope,
  });

  return Response.redirect(authUrl);
}

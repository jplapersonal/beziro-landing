const AUTHORIZED_EMAILS = ['jose@zeronetit.com', 'jose.pla@zeronetit.com', 'pol.hortal@zubilabs.com'];

async function getHmacKey(secret) {
  const encoder = new TextEncoder();
  return await crypto.subtle.importKey(
    'raw', encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false, ['sign', 'verify']
  );
}

async function sign(text, secret) {
  const key = await getHmacKey(secret);
  const encoder = new TextEncoder();
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(text));
  return btoa(String.fromCharCode(...new Uint8Array(signature)));
}

export async function onRequestPost(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const action = url.searchParams.get('action');
  
  const SECRET = env.AUTH_SECRET || 'beziro-dev-secret-123';
  const BREVO_KEY = env.BREVO_KEY || '';

  try {
    const body = await request.json();
    const email = body.email?.toLowerCase().trim();

    if (!AUTHORIZED_EMAILS.includes(email)) {
      return new Response(JSON.stringify({ error: 'Unauthorized email' }), { status: 403 });
    }

    if (action === 'send') {
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const exp = Date.now() + 10 * 60 * 1000;
      
      const payload = `${email}:${otp}:${exp}`;
      const signature = await sign(payload, SECRET);
      
      const brevoReq = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'api-key': BREVO_KEY
        },
        body: JSON.stringify({
          sender: { name: "Beziro OS Security", email: "no-reply@beziro.ai" },
          to: [{ email: email }],
          subject: `Beziro OS - Código: ${otp}`,
          htmlContent: `
          <div style="font-family: sans-serif; max-w-md; margin: 0 auto; padding: 20px; text-align: center;">
            <h2 style="color: #0f172a;">Acceso Restringido a Beziro</h2>
            <div style="background: #f1f5f9; padding: 15px; font-size: 24px; font-weight: bold; letter-spacing: 5px; color: #020617; border-radius: 8px;">${otp}</div>
          </div>`
        })
      });

      if (!brevoReq.ok) {
        return new Response(JSON.stringify({ error: 'Failed to send email' }), { status: 500 });
      }

      return new Response(JSON.stringify({ token: encodeURIComponent(`${exp}.${signature}`) }), { status: 200 });
    }

    if (action === 'verify') {
      const otp = body.otp?.trim();
      let token = body.token;
      if (!token) return new Response(JSON.stringify({ error: 'Missing token' }), { status: 400 });
      
      token = decodeURIComponent(token);
      const [expStr, clientSig] = token.split('.');
      const exp = parseInt(expStr, 10);

      if (Date.now() > exp) {
        return new Response(JSON.stringify({ error: 'OTP expired' }), { status: 400 });
      }

      const expectedPayload = `${email}:${otp}:${exp}`;
      const expectedSig = await sign(expectedPayload, SECRET);

      if (clientSig !== expectedSig) {
        return new Response(JSON.stringify({ error: 'Invalid OTP' }), { status: 400 });
      }

      const authExp = Date.now() + 30 * 24 * 60 * 60 * 1000;
      const authPayload = `auth:${email}:${authExp}`;
      const authSig = await sign(authPayload, SECRET);
      const cookieValue = encodeURIComponent(`${authExp}.${authSig}.${email}`);

      return new Response(JSON.stringify({ success: true, redirect: '/' }), {
        status: 200,
        headers: {
          'Set-Cookie': `beziro_auth=${cookieValue}; HttpOnly; Path=/; Max-Age=2592000; SameSite=Lax`
        }
      });
    }

    return new Response('Invalid action', { status: 400 });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Server error' }), { status: 500 });
  }
}

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

const LOGIN_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Beziro | Restricted Access</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&display=swap" rel="stylesheet">
    <style>body { font-family: 'Plus Jakarta Sans', sans-serif; }</style>
</head>
<body class="bg-slate-50 min-h-screen flex items-center justify-center p-4">
    <div class="bg-white max-w-md w-full rounded-2xl shadow-xl border border-slate-100 p-8">
        <div class="text-center mb-8">
            <h1 class="text-3xl font-extrabold text-slate-900 tracking-tight">Beziro.</h1>
            <p class="text-slate-500 mt-2 text-sm">Restricted Access. Please verify your identity.</p>
        </div>
        
        <div id="step1">
            <label class="block text-sm font-semibold text-slate-700 mb-2">Authorized Email</label>
            <input type="email" id="email" class="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900 mb-4 transition-all" placeholder="Escribe tu email aquí...">
            <button id="btnSend" class="w-full bg-slate-900 text-white font-bold py-3 rounded-xl hover:bg-slate-800 transition-colors">Send OTP</button>
            <p id="err1" class="text-red-500 text-sm mt-3 hidden text-center"></p>
        </div>

        <div id="step2" class="hidden">
            <label class="block text-sm font-semibold text-slate-700 mb-2">Enter 6-digit OTP</label>
            <input type="text" id="otp" maxlength="6" class="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900 mb-4 transition-all text-center tracking-[0.5em] font-bold text-lg" placeholder="000000">
            <button id="btnVerify" class="w-full bg-slate-900 text-white font-bold py-3 rounded-xl hover:bg-slate-800 transition-colors">Verify & Enter</button>
            <p id="err2" class="text-red-500 text-sm mt-3 hidden text-center"></p>
        </div>
    </div>

    <script>
        let currentToken = '';
        
        document.getElementById('btnSend').onclick = async () => {
            const email = document.getElementById('email').value.trim();
            if (!email) return;
            const btn = document.getElementById('btnSend');
            const err = document.getElementById('err1');
            
            err.classList.add('hidden');
            btn.innerText = 'Sending...';
            btn.disabled = true;

            try {
                const res = await fetch('/api/auth?action=send', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({email})
                });
                const data = await res.json();
                
                if (res.ok) {
                    currentToken = data.token;
                    document.getElementById('step1').classList.add('hidden');
                    document.getElementById('step2').classList.remove('hidden');
                } else {
                    err.innerText = data.error || 'Error sending OTP';
                    err.classList.remove('hidden');
                }
            } catch (e) {
                err.innerText = 'Network error';
                err.classList.remove('hidden');
            }
            btn.innerText = 'Send OTP';
            btn.disabled = false;
        };

        document.getElementById('btnVerify').onclick = async () => {
            const email = document.getElementById('email').value.trim();
            const otp = document.getElementById('otp').value.trim();
            const btn = document.getElementById('btnVerify');
            const err = document.getElementById('err2');
            
            err.classList.add('hidden');
            btn.innerText = 'Verifying...';
            btn.disabled = true;

            try {
                const res = await fetch('/api/auth?action=verify', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({email, otp, token: currentToken})
                });
                const data = await res.json();
                
                if (res.ok) {
                    window.location.reload();
                } else {
                    err.innerText = data.error || 'Invalid OTP';
                    err.classList.remove('hidden');
                }
            } catch (e) {
                err.innerText = 'Network error';
                err.classList.remove('hidden');
            }
            btn.innerText = 'Verify & Enter';
            btn.disabled = false;
        };
    </script>
</body>
</html>`;

export async function onRequest(context) {
  const { request, env, next } = context;
  const url = new URL(request.url);

  if (url.pathname.startsWith('/api/')) {
    return next();
  }

  const SECRET = env.AUTH_SECRET || 'beziro-dev-secret-123';
  
  const cookieHeader = request.headers.get('Cookie') || '';
  const match = cookieHeader.match(/beziro_auth=([^;]+)/);
  let authenticated = false;

  if (match) {
    try {
      const decodedCookie = decodeURIComponent(match[1]);
      const [expStr, clientSig, email] = decodedCookie.split('.');
      const exp = parseInt(expStr, 10);
      
      if (Date.now() < exp) {
        const expectedPayload = `auth:${email}:${expStr}`;
        const expectedSig = await sign(expectedPayload, SECRET);
        if (clientSig === expectedSig) {
          authenticated = true;
        }
      }
    } catch(e) {}
  }

  if (authenticated) {
    return next();
  }

  return new Response(LOGIN_HTML, {
    headers: { 'Content-Type': 'text/html;charset=UTF-8' }
  });
}

import dotenv from 'dotenv';

import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
dotenv.config({ path: path.join(repoRoot, '.env') });

import express from 'express';

import { consumeLinkState, upsertPlankaToken } from '@rastar/shared';

const PORT = Number(process.env.LINK_PORTAL_PORT || 8787);

const app = express();
app.use(express.urlencoded({ extended: false }));

app.get('/healthz', (_req, res) => {
  res.status(200).send('ok');
});

app.get('/link/planka', (req, res) => {
  const state = typeof req.query.state === 'string' ? req.query.state : '';
  if (!state) {
    res.status(400).send(`<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Link Planka</title>
</head>
<body style="font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif; max-width: 560px; margin: 40px auto;">
  <h1>Link Planka</h1>
  <p>This page must be opened from Telegram so it includes a one-time <code>state</code> value.</p>
  <ol>
    <li>Open Telegram and message your bot.</li>
    <li>Run <code>/link_planka</code>.</li>
    <li>Tap the link the bot sends you.</li>
  </ol>
  <p>If you already have a link, make sure the URL looks like:</p>
  <pre style="background: #f6f8fa; padding: 12px; overflow: auto;">/link/planka?state=...</pre>
</body>
</html>`);
    return;
  }

  res.status(200).send(`<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Link Planka</title>
</head>
<body style="font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif; max-width: 560px; margin: 40px auto;">
  <h1>Link Planka</h1>
  <p>Enter your Planka credentials to link your account. Your password is only used to obtain an access token and is not stored.</p>

  <form method="post" action="/link/planka">
    <input type="hidden" name="state" value="${escapeHtml(state)}" />

    <label>Planka Base URL</label><br/>
    <input name="baseUrl" placeholder="https://pm-dev.example.com" style="width: 100%; padding: 10px;" required />
    <br/><br/>

    <label>Email or Username</label><br/>
    <input name="emailOrUsername" style="width: 100%; padding: 10px;" required />
    <br/><br/>

    <label>Password</label><br/>
    <input type="password" name="password" style="width: 100%; padding: 10px;" required />
    <br/><br/>

    <button type="submit" style="padding: 10px 14px;">Link</button>
  </form>
</body>
</html>`);
});

app.post('/link/planka', async (req, res) => {
  const state = typeof req.body.state === 'string' ? req.body.state : '';
  const baseUrl = typeof req.body.baseUrl === 'string' ? req.body.baseUrl : '';
  const emailOrUsername = typeof req.body.emailOrUsername === 'string' ? req.body.emailOrUsername : '';
  const password = typeof req.body.password === 'string' ? req.body.password : '';

  if (!state || !baseUrl || !emailOrUsername || !password) {
    res.status(400).send('Missing required fields');
    return;
  }

  const link = await consumeLinkState(state);
  if (!link) {
    res.status(400).send('Invalid or expired link. Go back to Telegram and run /link_planka again.');
    return;
  }

  try {
    const token = await plankaLogin(baseUrl, emailOrUsername, password);
    await upsertPlankaToken(link.telegramUserId, normalizeBaseUrl(baseUrl), token);

    await sendTelegramMessage(
      link.telegramUserId,
      `✅ Planka linked for ${escapeHtml(normalizeBaseUrl(baseUrl))}.\nYou can return to Telegram and run /planka_status.`,
    );

    res.status(200).send(`<!doctype html>
<html lang="en"><head><meta charset="utf-8" /><title>Linked</title></head>
<body style="font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif; max-width: 560px; margin: 40px auto;">
  <h1>Success</h1>
  <p>Your Planka account is linked. You can return to Telegram.</p>
</body></html>`);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).send(`Failed to link Planka: ${escapeHtml(msg)}`);
  }
});

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`[link-portal] listening on http://localhost:${PORT}`);
});

async function plankaLogin(baseUrl: string, emailOrUsername: string, password: string): Promise<string> {
  const url = `${normalizeBaseUrl(baseUrl)}/api/access-tokens`;

  const resp = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      emailOrUsername,
      password,
    }),
  });

  if (!resp.ok) {
    const text = await resp.text().catch(() => '');
    throw new Error(`Planka login failed (${resp.status}): ${text}`);
  }

  const body = (await resp.json()) as any;
  const token = body?.item;

  // Planka controller returns { item: <accessTokenString> }
  if (typeof token !== 'string') {
    throw new Error('Unexpected Planka login response shape');
  }

  return token;
}

function normalizeBaseUrl(input: string): string {
  return input.replace(/\/+$/, '');
}

function escapeHtml(s: string): string {
  return s
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

async function sendTelegramMessage(chatId: string, text: string): Promise<void> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!botToken) return;

  try {
    await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        text,
      }),
    });
  } catch {
    // Ignore: linking should succeed even if notification fails.
  }
}

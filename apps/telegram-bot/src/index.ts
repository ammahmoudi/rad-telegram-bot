import 'dotenv/config';

import express from 'express';
import { Bot, webhookCallback } from 'grammy';

import { createLinkState, deletePlankaToken, getPlankaToken } from '@rastar/shared';

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
if (!TELEGRAM_BOT_TOKEN) {
  throw new Error('TELEGRAM_BOT_TOKEN is required');
}

const LINK_PORTAL_BASE_URL = process.env.LINK_PORTAL_BASE_URL || 'http://localhost:8787';
const TELEGRAM_WEBHOOK_URL = process.env.TELEGRAM_WEBHOOK_URL;
const TELEGRAM_WEBHOOK_PORT = Number(process.env.TELEGRAM_WEBHOOK_PORT || process.env.PORT || 8080);

const bot = new Bot(TELEGRAM_BOT_TOKEN);

bot.command('start', async (ctx) => {
  await ctx.reply(
    [
      'Hi! I can link your Planka account and later help you manage cards.',
      '',
      'Commands:',
      '/link_planka - link your Planka account',
      '/planka_status - show link status',
      '/planka_unlink - unlink Planka',
    ].join('\n'),
  );
});

bot.command('link_planka', async (ctx) => {
  const telegramUserId = String(ctx.from?.id ?? '');
  if (!telegramUserId) {
    await ctx.reply('Could not identify your Telegram user.');
    return;
  }

  const state = await createLinkState(telegramUserId);
  const linkUrl = `${stripTrailingSlash(LINK_PORTAL_BASE_URL)}/link/planka?state=${encodeURIComponent(state)}`;

  await ctx.reply(
    [
      'Open this link to connect your Planka account (valid for ~10 minutes):',
      linkUrl,
      '',
      'Security note: do NOT send your password in Telegram chat.',
    ].join('\n'),
  );
});

bot.command('planka_status', async (ctx) => {
  const telegramUserId = String(ctx.from?.id ?? '');
  if (!telegramUserId) {
    await ctx.reply('Could not identify your Telegram user.');
    return;
  }

  const token = await getPlankaToken(telegramUserId);
  if (!token) {
    await ctx.reply('Planka is not linked yet. Run /link_planka.');
    return;
  }

  await ctx.reply(`Planka linked. Base URL: ${token.plankaBaseUrl}`);
});

bot.command('planka_unlink', async (ctx) => {
  const telegramUserId = String(ctx.from?.id ?? '');
  if (!telegramUserId) {
    await ctx.reply('Could not identify your Telegram user.');
    return;
  }

  const removed = await deletePlankaToken(telegramUserId);
  await ctx.reply(removed ? 'Planka unlinked.' : 'Planka was not linked.');
});

bot.catch((err) => {
  // eslint-disable-next-line no-console
  console.error('[telegram-bot] error', err);
});

await startBot();

async function startBot(): Promise<void> {
  if (TELEGRAM_WEBHOOK_URL) {
    const url = new URL(TELEGRAM_WEBHOOK_URL);
    const webhookPath = url.pathname || '/';

    await bot.api.setWebhook(TELEGRAM_WEBHOOK_URL, {
      drop_pending_updates: true,
    });

    const app = express();
    app.use(express.json());

    app.get('/healthz', (_req, res) => res.status(200).send('ok'));
    app.post(webhookPath, webhookCallback(bot, 'express'));

    app.listen(TELEGRAM_WEBHOOK_PORT, () => {
      // eslint-disable-next-line no-console
      console.log(`[telegram-bot] webhook listening on :${TELEGRAM_WEBHOOK_PORT}${webhookPath}`);
    });

    return;
  }

  bot.start({
    onStart: (info) => {
      // eslint-disable-next-line no-console
      console.log(`[telegram-bot] started as @${info.username} (polling)`);
    },
  });
}

function stripTrailingSlash(s: string): string {
  return s.replace(/\/+$/, '');
}

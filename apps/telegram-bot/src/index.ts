import dotenv from 'dotenv';

import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { Bot } from 'grammy';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
dotenv.config({ path: path.join(repoRoot, '.env') });

import { createLinkState, deletePlankaToken, getPlankaToken } from '@rastar/shared';

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
if (!TELEGRAM_BOT_TOKEN) {
  throw new Error('TELEGRAM_BOT_TOKEN is required');
}

const LINK_PORTAL_BASE_URL = process.env.LINK_PORTAL_BASE_URL || 'http://localhost:8787';

const bot = new Bot(TELEGRAM_BOT_TOKEN);

bot.command('start', async (ctx) => {
  // eslint-disable-next-line no-console
  console.log('[telegram-bot] /start', { fromId: ctx.from?.id, username: ctx.from?.username });
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

  // eslint-disable-next-line no-console
  console.log('[telegram-bot] /link_planka', { telegramUserId });

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

  // eslint-disable-next-line no-console
  console.log('[telegram-bot] /planka_status', { telegramUserId });

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

  // eslint-disable-next-line no-console
  console.log('[telegram-bot] /planka_unlink', { telegramUserId });

  const removed = await deletePlankaToken(telegramUserId);
  await ctx.reply(removed ? 'Planka unlinked.' : 'Planka was not linked.');
});

bot.catch((err) => {
  // eslint-disable-next-line no-console
  console.error('[telegram-bot] error', err);
});

try {
  // If this bot token was previously used in a webhook-based deployment,
  // polling will fail with a 409 conflict until the webhook is removed.
  await bot.api.deleteWebhook({ drop_pending_updates: true });
} catch (err) {
  // eslint-disable-next-line no-console
  console.warn('[telegram-bot] failed to deleteWebhook (continuing)', err);
}

bot.start({
  onStart: (info) => {
    // eslint-disable-next-line no-console
    console.log(`[telegram-bot] started as @${info.username} (polling)`);
  },
});

function stripTrailingSlash(s: string): string {
  return s.replace(/\/+$/, '');
}

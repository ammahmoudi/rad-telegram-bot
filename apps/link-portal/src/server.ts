import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Only load .env files in development
if (process.env.NODE_ENV !== 'production') {
  const { default: dotenv } = await import('dotenv');
  const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
  
  // Load .env.local first (for local development), then .env (for Docker)
  // .env.local takes precedence if it exists
  dotenv.config({ path: path.join(repoRoot, '.env.local') });
  dotenv.config({ path: path.join(repoRoot, '.env') });
}

import express from 'express';

import { 
  consumeLinkState, 
  createLinkState,
  getSystemConfig, 
  peekLinkState, 
  upsertPlankaToken,
  getPlankaToken,
  getRastarToken,
  upsertRastarToken,
  storeRastarTokenResponse,
  getUserLanguage,
  buildMainMenuKeyboard,
  type KeyboardTranslations,
  type RastarTokenResponse,
} from '@rad/shared';

import { t } from './i18n.js';

const PORT = Number(process.env.PORT || 3002);

const app = express();
app.use(express.urlencoded({ extended: false }));

// Serve static files from public directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use('/public', express.static(path.join(__dirname, '../public')));

// Add logging middleware
app.use((req, _res, next) => {
  console.log(`[link-portal] ${req.method} ${req.url}`);
  next();
});

// Root route
app.get('/', (_req, res) => {
  res.status(200).send('Link Portal is running');
});

app.get('/healthz', (_req, res) => {
  res.status(200).send('ok');
});

app.get('/health', (_req, res) => {
  res.status(200).send('ok');
});

app.get('/link/planka', async (req, res) => {
  const state = typeof req.query.state === 'string' ? req.query.state : '';
  
  // Notify user they're on the page (without consuming the state)
  if (state) {
    const linkInfo = await peekLinkState(state);
    if (linkInfo) {
      const language = await getUserLanguage(linkInfo.telegramUserId);
      await sendTelegramMessage(
        linkInfo.telegramUserId,
        `👀 <b>${t(language, 'notifications.link_opened.title')}</b>\n\n` +
        t(language, 'notifications.link_opened.planka_message'),
        { parse_mode: 'HTML' }
      );
    }
  }
  
  if (!state) {
    res.status(400).send(`<!doctype html>
<html lang="en" class="dark">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Link Planka</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      darkMode: 'class'
    }
  </script>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap');
    body { font-family: 'Inter', system-ui, sans-serif; }
  </style>
</head>
<body class="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 flex items-center justify-center p-4">
  <div class="w-full max-w-md">
    <div class="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl shadow-lg p-8 space-y-6">
      <!-- Icon -->
      <div class="mx-auto w-12 h-12 bg-amber-500 dark:bg-amber-600 rounded-lg flex items-center justify-center">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
      </div>

      <!-- Header -->
      <div class="space-y-2 text-center">
        <h1 class="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">
          Missing state parameter
        </h1>
        <p class="text-sm text-slate-500 dark:text-slate-400">
          This page must be opened from Telegram with a one-time state value.
        </p>
      </div>

      <!-- Instructions -->
      <div class="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 p-4">
        <h2 class="text-sm font-medium text-slate-900 dark:text-slate-50 mb-3">How to link your account:</h2>
        <ol class="space-y-2 text-sm text-slate-600 dark:text-slate-400">
          <li class="flex gap-2">
            <span class="flex-shrink-0 w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-medium">1</span>
            <span>Open Telegram and message your bot</span>
          </li>
          <li class="flex gap-2">
            <span class="flex-shrink-0 w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-medium">2</span>
            <span>Send the command <code class="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-slate-50 font-mono text-xs">/link_planka</code></span>
          </li>
          <li class="flex gap-2">
            <span class="flex-shrink-0 w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-medium">3</span>
            <span>Tap the link the bot sends you</span>
          </li>
        </ol>
      </div>

      <!-- Example -->
      <div class="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 p-4">
        <div class="text-xs text-slate-500 dark:text-slate-400 mb-2">Valid link format:</div>
        <code class="text-xs text-slate-900 dark:text-slate-50 font-mono break-all">/link/planka?state=...</code>
      </div>
    </div>
  </div>
</body>
</html>`);
    return;
  }

  res.status(200).send(`<!doctype html>
<html lang="en" class="dark">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Link Planka Account</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      darkMode: 'class',
      theme: {
        extend: {
          colors: {
            border: "hsl(214.3 31.8% 91.4%)",
            input: "hsl(214.3 31.8% 91.4%)",
            ring: "hsl(221.2 83.2% 53.3%)",
            background: "hsl(0 0% 100%)",
            foreground: "hsl(222.2 84% 4.9%)",
            primary: {
              DEFAULT: "hsl(221.2 83.2% 53.3%)",
              foreground: "hsl(210 40% 98%)",
            },
            muted: {
              DEFAULT: "hsl(210 40% 96.1%)",
              foreground: "hsl(215.4 16.3% 46.9%)",
            },
            accent: {
              DEFAULT: "hsl(210 40% 96.1%)",
              foreground: "hsl(222.2 47.4% 11.2%)",
            },
          },
        }
      }
    }
  </script>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
    body { font-family: 'Inter', system-ui, sans-serif; }
    .animate-in {
      animation: slideInFromBottom 0.4s cubic-bezier(0.16, 1, 0.3, 1);
    }
    @keyframes slideInFromBottom {
      from {
        opacity: 0;
        transform: translateY(10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
  </style>
</head>
<body class="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 flex items-center justify-center p-4">
  <div class="w-full max-w-md animate-in">
    <div class="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl shadow-lg">
      <div class="p-8 space-y-6">
        <!-- Header -->
        <div class="space-y-2 text-center">
          <div class="mx-auto w-20 h-20 flex items-center justify-center mb-4">
            <!-- Planka SVG Logo - Replace this SVG with your actual Planka logo -->
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" class="w-full h-full">
              <rect width="100" height="100" rx="16" fill="#50b6c1"/>
              <text x="50" y="65" font-family="Inter, sans-serif" font-size="48" font-weight="700" fill="white" text-anchor="middle">P</text>
            </svg>
          </div>
          <h1 class="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">
            Link your account
          </h1>
          <p class="text-sm text-slate-500 dark:text-slate-400">
            Enter your Planka credentials to connect with Telegram
          </p>
        </div>

        <!-- Form -->
        <form method="post" action="/link/planka" class="space-y-4" id="linkForm">
          <input type="hidden" name="state" value="${escapeHtml(state)}" />

          <div class="space-y-2">
            <label for="emailOrUsername" class="text-sm font-medium text-slate-900 dark:text-slate-50 block">
              Email or Username
            </label>
            <input 
              id="emailOrUsername"
              type="text" 
              name="emailOrUsername" 
              placeholder="john@example.com" 
              autocomplete="username"
              required 
              autofocus
              class="flex h-10 w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2 text-sm text-slate-900 dark:text-slate-50 placeholder:text-slate-500 dark:placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 dark:focus:ring-offset-slate-950 transition-all"
            />
          </div>

          <div class="space-y-2">
            <label for="password" class="text-sm font-medium text-slate-900 dark:text-slate-50 block">
              Password
            </label>
            <input 
              id="password"
              type="password" 
              name="password" 
              placeholder="••••••••" 
              autocomplete="current-password"
              required 
              class="flex h-10 w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2 text-sm text-slate-900 dark:text-slate-50 placeholder:text-slate-500 dark:placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 dark:focus:ring-offset-slate-950 transition-all"
            />
          </div>

          <button 
            type="submit"
            id="submitBtn"
            class="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 dark:focus:ring-offset-slate-950 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
          >
            <span id="btnText">Link Account</span>
            <svg id="btnSpinner" class="hidden animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </button>
        </form>

        <script>
          document.getElementById('linkForm').addEventListener('submit', function() {
            const btn = document.getElementById('submitBtn');
            const btnText = document.getElementById('btnText');
            const btnSpinner = document.getElementById('btnSpinner');
            
            btn.disabled = true;
            btnText.textContent = 'Connecting...';
            btnSpinner.classList.remove('hidden');
          });
        </script>

        <!-- Security Note -->
        <div class="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 p-4">
          <div class="flex gap-3">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-slate-600 dark:text-slate-400 flex-shrink-0 mt-0.5">
              <rect width="18" height="11" x="3" y="11" rx="2" ry="2"></rect>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
            </svg>
            <div class="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              <span class="font-medium text-slate-900 dark:text-slate-50">Secure Authentication</span>
              <p class="mt-1">Your password is only used to obtain an access token and is never stored on our servers.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</body>
</html>`);
});

app.post('/link/planka', async (req, res) => {
  const state = typeof req.body.state === 'string' ? req.body.state : '';
  const emailOrUsername = typeof req.body.emailOrUsername === 'string' ? req.body.emailOrUsername : '';
  const password = typeof req.body.password === 'string' ? req.body.password : '';

  if (!state || !emailOrUsername || !password) {
    res.status(400).send('Missing required fields');
    return;
  }

  const link = await consumeLinkState(state);
  if (!link) {
    res.status(400).send(`<!doctype html>
<html lang="en" class="dark">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Link Expired</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      darkMode: 'class'
    }
  </script>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap');
    body { font-family: 'Inter', system-ui, sans-serif; }
  </style>
</head>
<body class="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 flex items-center justify-center p-4">
  <div class="w-full max-w-md">
    <div class="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl shadow-lg p-8 space-y-6">
      <!-- Icon -->
      <div class="mx-auto w-12 h-12 bg-amber-500 dark:bg-amber-600 rounded-lg flex items-center justify-center">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <polyline points="12 6 12 12 16 14"></polyline>
        </svg>
      </div>

      <!-- Header -->
      <div class="space-y-2 text-center">
        <h1 class="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">
          Link expired
        </h1>
        <p class="text-sm text-slate-500 dark:text-slate-400">
          This link is no longer valid. Links expire after 10 minutes or once used.
        </p>
      </div>

      <!-- Instructions -->
      <div class="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 p-4">
        <h2 class="text-sm font-medium text-slate-900 dark:text-slate-50 mb-3">To get a new link:</h2>
        <ol class="space-y-2 text-sm text-slate-600 dark:text-slate-400">
          <li class="flex gap-2">
            <span class="flex-shrink-0 w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-medium">1</span>
            <span>Go back to Telegram</span>
          </li>
          <li class="flex gap-2">
            <span class="flex-shrink-0 w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-medium">2</span>
            <span>Send <code class="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-slate-50 font-mono text-xs">/link_planka</code> again</span>
          </li>
          <li class="flex gap-2">
            <span class="flex-shrink-0 w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-medium">3</span>
            <span>Click the new link within 10 minutes</span>
          </li>
        </ol>
      </div>

      <!-- Tip -->
      <div class="rounded-lg border border-blue-200 dark:border-blue-900/50 bg-blue-50 dark:bg-blue-950/30 p-4">
        <div class="flex items-start gap-3 text-left">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5">
            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
            <path d="M12 17h.01"></path>
          </svg>
          <div class="text-xs text-blue-700 dark:text-blue-300 leading-relaxed">
            <strong class="font-medium">Tip:</strong> Each link can only be used once for security reasons.
          </div>
        </div>
      </div>
    </div>
  </div>
</body>
</html>`);
    return;
  }

  // Check if already linked
  const existingToken = await getPlankaToken(link.telegramUserId);

  // Get base URL from system config
  const baseUrl = (await getSystemConfig('PLANKA_BASE_URL')) || 'https://pm-dev.rastar.dev';

  try {
    const token = await plankaLogin(baseUrl, emailOrUsername, password);
    await upsertPlankaToken(link.telegramUserId, normalizeBaseUrl(baseUrl), token);

    const botUsername = process.env.TELEGRAM_BOT_USERNAME || 'your_bot';
    const isRelink = !!existingToken;
    const language = await getUserLanguage(link.telegramUserId);
    
    // Prepare updated keyboard with new connection status
    const rastarToken = await getRastarToken(link.telegramUserId);
    const translations: Partial<KeyboardTranslations> = {
      'keyboards.my-cards': t(language, 'keyboards.my-cards'),
      'keyboards.delayed-tasks': t(language, 'keyboards.delayed-tasks'),
      'keyboards.my-boards': t(language, 'keyboards.my-boards'),
      'keyboards.create-task': t(language, 'keyboards.create-task'),
      'keyboards.planka-status': t(language, 'keyboards.planka-status'),
      'keyboards.todays-menu': t(language, 'keyboards.todays-menu'),
      'keyboards.unselected-days': t(language, 'keyboards.unselected-days'),
      'keyboards.week-menu': t(language, 'keyboards.week-menu'),
      'keyboards.select-lunch': t(language, 'keyboards.select-lunch'),
      'keyboards.rastar-status': t(language, 'keyboards.rastar-status'),
      'keyboards.settings': t(language, 'keyboards.settings'),
    };
    const keyboard = buildMainMenuKeyboard(true, !!rastarToken, translations);
    
    // Send success message with updated keyboard
    await sendTelegramMessage(
      link.telegramUserId,
      isRelink
        ? `✅ <b>${t(language, 'notifications.planka.relinked_title')}</b>\n\n` +
          `${t(language, 'notifications.planka.relinked_message')}\n` +
          `${t(language, 'notifications.planka.base_url', { url: escapeHtml(normalizeBaseUrl(baseUrl)) })}\n\n` +
          t(language, 'notifications.planka.verify_connection')
        : `✅ <b>${t(language, 'notifications.planka.linked_title')}</b>\n\n` +
          `${t(language, 'notifications.planka.linked_message')}\n` +
          `${t(language, 'notifications.planka.base_url', { url: escapeHtml(normalizeBaseUrl(baseUrl)) })}\n\n` +
          t(language, 'notifications.planka.check_status'),
      { reply_markup: keyboard }
    );

    res.status(200).send(`<!doctype html>
<html lang="en" class="dark">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Account Linked</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      darkMode: 'class',
      theme: {
        extend: {
          colors: {
            primary: {
              DEFAULT: "hsl(221.2 83.2% 53.3%)",
              foreground: "hsl(210 40% 98%)",
            },
          },
        }
      }
    }
  </script>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
    body { font-family: 'Inter', system-ui, sans-serif; }
    .animate-in {
      animation: slideInFromBottom 0.4s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .animate-check {
      animation: scaleIn 0.5s cubic-bezier(0.16, 1, 0.3, 1);
    }
    @keyframes slideInFromBottom {
      from {
        opacity: 0;
        transform: translateY(10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    @keyframes scaleIn {
      0% {
        transform: scale(0);
        opacity: 0;
      }
      50% {
        transform: scale(1.1);
      }
      100% {
        transform: scale(1);
        opacity: 1;
      }
    }
  </style>
</head>
<body class="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 flex items-center justify-center p-4">
  <div class="w-full max-w-md animate-in">
    <div class="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl shadow-lg">
      <div class="p-8 space-y-6 text-center">
        <!-- Success Icon -->
        <div class="mx-auto w-16 h-16 bg-emerald-500 dark:bg-emerald-600 rounded-full flex items-center justify-center animate-check">
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        </div>

        <!-- Header -->
        <div class="space-y-2">
          <h1 class="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">
            ${isRelink ? 'Successfully re-linked!' : 'Successfully linked!'}
          </h1>
          <p class="text-sm text-slate-500 dark:text-slate-400">
            ${isRelink 
              ? 'Your Planka connection has been updated.<br>You can now close this page and return to the bot.' 
              : 'Your Planka account has been connected to Telegram.<br>You can now close this page and return to the bot.'}
          </p>
        </div>

        <!-- Action Button -->
        <div class="pt-2">
          <a 
            href="https://t.me/${escapeHtml(botUsername)}"
            class="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 dark:focus:ring-offset-slate-950 transition-all active:scale-[0.98]"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 0 0-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z"/>
            </svg>
            Open Telegram Bot
          </a>
        </div>

        <!-- Info Box -->
        <div class="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 p-4">
          <div class="flex items-start gap-3 text-left">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5">
              <circle cx="12" cy="12" r="10"></circle>
              <path d="M12 16v-4"></path>
              <path d="M12 8h.01"></path>
            </svg>
            <div class="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Use <code class="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-slate-50 font-mono">/planka_status</code> to check your connection anytime
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</body>
</html>`);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    
    // Generate a new link for retry
    const newState = await createLinkState(link.telegramUserId);
    const retryUrl = `${process.env.LINK_PORTAL_URL || 'http://localhost:8787'}/link/planka?state=${newState}`;
    
    // Determine error type and provide specific guidance
    let errorTitle = 'Connection failed';
    let errorMessage = msg;
    let errorTip = 'Please try again or contact support if the problem persists.';
    
    if (msg.includes('401') || msg.includes('Invalid credentials') || msg.includes('Unauthorized')) {
      errorTitle = 'Invalid credentials';
      errorMessage = 'The email/username or password you entered is incorrect.';
      errorTip = 'Double-check your Planka login credentials and try again.';
    } else if (msg.includes('404') || msg.includes('Not found')) {
      errorTitle = 'Planka server not found';
      errorMessage = 'Could not connect to the Planka server.';
      errorTip = 'Please contact your administrator to verify the Planka server URL.';
    } else if (msg.includes('fetch') || msg.includes('ECONNREFUSED') || msg.includes('network')) {
      errorTitle = 'Network error';
      errorMessage = 'Unable to reach the Planka server.';
      errorTip = 'Check your internet connection and try again. If the problem persists, the Planka server may be down.';
    } else if (msg.includes('timeout')) {
      errorTitle = 'Connection timeout';
      errorMessage = 'The Planka server took too long to respond.';
      errorTip = 'The server might be busy. Please try again in a few moments.';
    }
    
    // Send Telegram message with retry link
    await sendTelegramMessage(
      link.telegramUserId,
      `❌ <b>Planka Link Failed</b>\n\n` +
      `${escapeHtml(errorTitle)}: ${escapeHtml(errorMessage)}\n\n` +
      `<b>🔄 Try again:</b>\n` +
      `<a href="${escapeHtml(retryUrl)}">Click here to retry with correct credentials</a>`,
    );
    
    res.status(500).send(`<!doctype html>
<html lang="en" class="dark">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Link Failed</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      darkMode: 'class',
      theme: {
        extend: {
          colors: {
            primary: {
              DEFAULT: "hsl(221.2 83.2% 53.3%)",
              foreground: "hsl(210 40% 98%)",
            },
          },
        }
      }
    }
  </script>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
    body { font-family: 'Inter', system-ui, sans-serif; }
    .animate-in {
      animation: slideInFromBottom 0.4s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .animate-shake {
      animation: shake 0.5s cubic-bezier(0.16, 1, 0.3, 1);
    }
    @keyframes slideInFromBottom {
      from {
        opacity: 0;
        transform: translateY(10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    @keyframes shake {
      0%, 100% { transform: translateX(0); }
      10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
      20%, 40%, 60%, 80% { transform: translateX(4px); }
    }
  </style>
</head>
<body class="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 flex items-center justify-center p-4">
  <div class="w-full max-w-md animate-in">
    <div class="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl shadow-lg">
      <div class="p-8 space-y-6 text-center">
        <!-- Error Icon -->
        <div class="mx-auto w-16 h-16 bg-red-500 dark:bg-red-600 rounded-full flex items-center justify-center animate-shake">
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="15" y1="9" x2="9" y2="15"></line>
            <line x1="9" y1="9" x2="15" y2="15"></line>
          </svg>
        </div>

        <!-- Header -->
        <div class="space-y-2">
          <h1 class="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">
            ${escapeHtml(errorTitle)}
          </h1>
          <p class="text-sm text-slate-500 dark:text-slate-400">
            We couldn't link your Planka account
          </p>
        </div>

        <!-- Error Message -->
        <div class="rounded-lg border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/30 p-4">
          <div class="flex items-start gap-3 text-left">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            <div class="text-sm text-red-700 dark:text-red-300 leading-relaxed">
              ${escapeHtml(errorMessage)}
            </div>
          </div>
        </div>

        <!-- Error Tip -->
        <div class="rounded-lg border border-blue-200 dark:border-blue-900/50 bg-blue-50 dark:bg-blue-950/30 p-4">
          <div class="flex items-start gap-3 text-left">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5">
              <circle cx="12" cy="12" r="10"></circle>
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
              <path d="M12 17h.01"></path>
            </svg>
            <div class="text-sm text-blue-700 dark:text-blue-300 leading-relaxed">
              <strong class="font-medium">Tip:</strong> ${escapeHtml(errorTip)}
            </div>
          </div>
        </div>

        <!-- Action Button -->
        <div class="pt-2">
          <a 
            href="${escapeHtml(retryUrl)}"
            class="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-700 px-6 py-3 text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 dark:focus:ring-offset-slate-950 transition-all active:scale-[0.98]"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path>
              <path d="M3 3v5h5"></path>
              <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"></path>
              <path d="M16 16h5v5"></path>
            </svg>
            Try Again with New Credentials
          </a>
        </div>
      </div>
    </div>
  </div>
</body>
</html>`);
  }
});

// ============================================================================
// Rastar Link Routes
// ============================================================================

app.get('/link/rastar', async (req, res) => {
  const state = typeof req.query.state === 'string' ? req.query.state : '';
  
  // Notify user they're on the page (without consuming the state)
  if (state) {
    const linkInfo = await peekLinkState(state);
    if (linkInfo) {
      const language = await getUserLanguage(linkInfo.telegramUserId);
      await sendTelegramMessage(
        linkInfo.telegramUserId,
        `👀 <b>${t(language, 'notifications.link_opened.title')}</b>\n\n` +
        t(language, 'notifications.link_opened.rastar_message'),
        { parse_mode: 'HTML' }
      );
    }
  }
  
  if (!state) {
    res.status(400).send(renderErrorPage(
      'Missing state parameter',
      'This page must be opened from Telegram with a one-time state value.',
      [
        'Open Telegram and message your bot',
        'Send the command <code>/link_rastar</code>',
        'Tap the link the bot sends you'
      ],
      '/link/rastar?state=...'
    ));
    return;
  }

  res.send(renderRastarLinkForm(state));
});

app.post('/link/rastar', async (req, res) => {
  const state = typeof req.body.state === 'string' ? req.body.state : '';
  const email = typeof req.body.email === 'string' ? req.body.email : '';
  const password = typeof req.body.password === 'string' ? req.body.password : '';

  if (!state || !email || !password) {
    res.status(400).send('Missing required fields');
    return;
  }

  const link = await consumeLinkState(state);
  if (!link) {
    res.status(400).send(renderExpiredPage('rastar'));
    return;
  }

  try {
    const tokenResponse = await rastarLogin(email, password);
    await storeRastarTokenResponse(link.telegramUserId, tokenResponse);

    const language = await getUserLanguage(link.telegramUserId);

    // Prepare updated keyboard with new connection status
    const plankaToken = await getPlankaToken(link.telegramUserId);
    const translations: Partial<KeyboardTranslations> = {
      'keyboards.my-cards': t(language, 'keyboards.my-cards'),
      'keyboards.delayed-tasks': t(language, 'keyboards.delayed-tasks'),
      'keyboards.my-boards': t(language, 'keyboards.my-boards'),
      'keyboards.create-task': t(language, 'keyboards.create-task'),
      'keyboards.planka-status': t(language, 'keyboards.planka-status'),
      'keyboards.todays-menu': t(language, 'keyboards.todays-menu'),
      'keyboards.unselected-days': t(language, 'keyboards.unselected-days'),
      'keyboards.week-menu': t(language, 'keyboards.week-menu'),
      'keyboards.select-lunch': t(language, 'keyboards.select-lunch'),
      'keyboards.rastar-status': t(language, 'keyboards.rastar-status'),
      'keyboards.settings': t(language, 'keyboards.settings'),
    };
    const keyboard = buildMainMenuKeyboard(!!plankaToken, true, translations);

    // Send success message with updated keyboard
    await sendTelegramMessage(
      link.telegramUserId,
      `✅ <b>${t(language, 'notifications.rastar.linked_title')}</b>\n\n` +
      `${t(language, 'notifications.rastar.linked_message')}\n` +
      `${t(language, 'notifications.rastar.email', { email: escapeHtml(email) })}\n\n` +
      t(language, 'notifications.rastar.check_status'),
      { reply_markup: keyboard }
    );

    res.status(200).send(renderSuccessPage('Rastar', email));
  } catch (error: any) {
    // Generate a new link for retry
    const newState = await createLinkState(link.telegramUserId);
    const retryUrl = `${process.env.LINK_PORTAL_URL || 'http://localhost:8787'}/link/rastar?state=${newState}`;
    
    const language = await getUserLanguage(link.telegramUserId);
    
    await sendTelegramMessage(
      link.telegramUserId,
      `❌ <b>${t(language, 'notifications.rastar.failed_title')}</b>\n\n` +
      `${t(language, 'notifications.rastar.failed_message')}\n` +
      `${t(language, 'notifications.rastar.error', { error: escapeHtml(error.message) })}\n\n` +
      `<b>🔄 ${t(language, 'notifications.rastar.try_again')}</b>\n` +
      `<a href="${escapeHtml(retryUrl)}">${t(language, 'notifications.rastar.retry_link')}</a>`,
    );

    res.status(400).send(renderAuthErrorPage('Rastar', error.message, retryUrl));
  }
});

app.listen(PORT, '0.0.0.0', () => {
  // eslint-disable-next-line no-console
  console.log(`[link-portal] listening on http://0.0.0.0:${PORT}`);
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

async function rastarLogin(email: string, password: string): Promise<RastarTokenResponse> {
  const baseUrl = process.env.RASTAR_SUPABASE_URL;
  const tokenPath = process.env.RASTAR_SUPABASE_AUTH_PATH || '/auth/v1/token';
  const apiKey = process.env.RASTAR_SUPABASE_ANON_KEY;
  const apiKeyHeader = process.env.RASTAR_SUPABASE_KEY_HEADER || 'apikey';
  
  if (!baseUrl || !apiKey) {
    throw new Error('RASTAR_SUPABASE_URL and RASTAR_SUPABASE_ANON_KEY environment variables are required');
  }
  
  // Add grant_type=password if not already present in tokenPath
  const hasGrantType = tokenPath.includes('grant_type=');
  const url = hasGrantType 
    ? `${baseUrl}${tokenPath}` 
    : `${baseUrl}${tokenPath}?grant_type=password`;

  const resp = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      [apiKeyHeader]: apiKey,
    },
    body: JSON.stringify({ email, password }),
  });

  if (!resp.ok) {
    const text = await resp.text().catch(() => '');
    throw new Error(`Rastar login failed (${resp.status}): ${text || 'Invalid credentials'}`);
  }

  return (await resp.json()) as RastarTokenResponse;
}

function renderRastarLinkForm(state: string): string {
  return `<!doctype html>
<html lang="en" class="dark">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Link Rastar Account</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = { 
      darkMode: 'class',
      theme: {
        extend: {
          colors: {
            rastar: {
              DEFAULT: '#50b6c1',
              hover: '#45a0ab',
            }
          }
        }
      }
    }
  </script>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap');
    body { font-family: 'Inter', system-ui, sans-serif; }
  </style>
</head>
<body class="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 flex items-center justify-center p-4">
  <div class="w-full max-w-md">
    <div class="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl shadow-lg p-8 space-y-6">
      <!-- Icon -->
      <div class="mx-auto w-48 h-20 flex items-center justify-center">
        <img src="/public/rastar_logo.svg" alt="Rastar Logo" class="w-full h-full object-contain" />
      </div>

      <!-- Header -->
      <div class="space-y-2 text-center">
        <h1 class="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">
          Link your Rastar account
        </h1>
        <p class="text-sm text-slate-500 dark:text-slate-400">
          Enter your Rastar credentials to enable food menu features in Telegram.
        </p>
      </div>

      <!-- Form -->
      <form method="post" action="/link/rastar" class="space-y-4" id="linkForm">
        <input type="hidden" name="state" value="${escapeHtml(state)}" />
        
        <div class="space-y-2">
          <label for="email" class="block text-sm font-medium text-slate-700 dark:text-slate-300">
            Email
          </label>
          <input 
            type="email" 
            id="email" 
            name="email" 
            required
            placeholder="you@company.com"
            class="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-50 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-rastar focus:border-transparent transition"
          />
        </div>

        <div class="space-y-2">
          <label for="password" class="block text-sm font-medium text-slate-700 dark:text-slate-300">
            Password
          </label>
          <input 
            type="password" 
            id="password" 
            name="password" 
            required
            placeholder="Enter your password"
            class="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-50 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-rastar focus:border-transparent transition"
          />
        </div>

        <button 
          type="submit"
          class="w-full rounded-lg bg-rastar px-4 py-3 text-sm font-medium text-white hover:bg-rastar-hover focus:outline-none focus:ring-2 focus:ring-rastar focus:ring-offset-2 dark:focus:ring-offset-slate-950 transition-all active:scale-[0.98]"
        >
          Link Account
        </button>
      </form>

      <!-- Security Note -->
      <div class="rounded-lg border border-rastar/20 dark:border-rastar/30 bg-rastar/5 dark:bg-rastar/10 p-4">
        <div class="flex items-start gap-3 text-left">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-rastar flex-shrink-0 mt-0.5">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
          </svg>
          <div class="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
            <strong class="font-medium">Secure:</strong> Your credentials are transmitted securely and only used to obtain an access token. Your password is never stored.
          </div>
        </div>
      </div>
    </div>
  </div>
</body>
</html>`;
}

function renderErrorPage(title: string, message: string, steps: string[], exampleUrl: string): string {
  const stepsHtml = steps.map((step, i) => `
    <li class="flex gap-2">
      <span class="flex-shrink-0 w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-medium">${i + 1}</span>
      <span>${step}</span>
    </li>
  `).join('');

  return `<!doctype html>
<html lang="en" class="dark">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(title)}</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script>tailwind.config = { darkMode: 'class' }</script>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap');
    body { font-family: 'Inter', system-ui, sans-serif; }
  </style>
</head>
<body class="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 flex items-center justify-center p-4">
  <div class="w-full max-w-md">
    <div class="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl shadow-lg p-8 space-y-6">
      <div class="mx-auto w-12 h-12 bg-amber-500 dark:bg-amber-600 rounded-lg flex items-center justify-center">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
      </div>
      <div class="space-y-2 text-center">
        <h1 class="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">${escapeHtml(title)}</h1>
        <p class="text-sm text-slate-500 dark:text-slate-400">${escapeHtml(message)}</p>
      </div>
      <div class="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 p-4">
        <h2 class="text-sm font-medium text-slate-900 dark:text-slate-50 mb-3">How to link your account:</h2>
        <ol class="space-y-2 text-sm text-slate-600 dark:text-slate-400">${stepsHtml}</ol>
      </div>
    </div>
  </div>
</body>
</html>`;
}

function renderExpiredPage(service: string): string {
  return `<!doctype html>
<html lang="en" class="dark">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Link Expired</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script>tailwind.config = { darkMode: 'class' }</script>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap');
    body { font-family: 'Inter', system-ui, sans-serif; }
  </style>
</head>
<body class="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 flex items-center justify-center p-4">
  <div class="w-full max-w-md">
    <div class="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl shadow-lg p-8 space-y-6">
      <div class="mx-auto w-12 h-12 bg-amber-500 dark:bg-amber-600 rounded-lg flex items-center justify-center">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <polyline points="12 6 12 12 16 14"></polyline>
        </svg>
      </div>
      <div class="space-y-2 text-center">
        <h1 class="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">Link expired</h1>
        <p class="text-sm text-slate-500 dark:text-slate-400">This link is no longer valid. Links expire after 10 minutes or once used.</p>
      </div>
      <div class="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 p-4">
        <h2 class="text-sm font-medium text-slate-900 dark:text-slate-50 mb-3">To get a new link:</h2>
        <ol class="space-y-2 text-sm text-slate-600 dark:text-slate-400">
          <li class="flex gap-2">
            <span class="flex-shrink-0 w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-medium">1</span>
            <span>Go back to Telegram</span>
          </li>
          <li class="flex gap-2">
            <span class="flex-shrink-0 w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-medium">2</span>
            <span>Send <code class="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-slate-50 font-mono text-xs">/link_${service}</code> again</span>
          </li>
          <li class="flex gap-2">
            <span class="flex-shrink-0 w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-medium">3</span>
            <span>Click the new link within 10 minutes</span>
          </li>
        </ol>
      </div>
    </div>
  </div>
</body>
</html>`;
}

function renderSuccessPage(serviceName: string, identifier: string): string {
  const botUsername = process.env.TELEGRAM_BOT_USERNAME || 'your_bot';
  const telegramUrl = `https://t.me/${botUsername}`;
  
  return `<!doctype html>
<html lang="en" class="dark">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Account Linked</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script>tailwind.config = { darkMode: 'class' }</script>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
    body { font-family: 'Inter', system-ui, sans-serif; }
    .animate-check { animation: scaleIn 0.5s cubic-bezier(0.16, 1, 0.3, 1); }
    @keyframes scaleIn { from { opacity: 0; transform: scale(0.8); } to { opacity: 1; transform: scale(1); } }
  </style>
</head>
<body class="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 flex items-center justify-center p-4">
  <div class="w-full max-w-md">
    <div class="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl shadow-lg p-8 space-y-6">
      <div class="mx-auto w-16 h-16 bg-emerald-500 dark:bg-emerald-600 rounded-full flex items-center justify-center animate-check">
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
      </div>
      <div class="space-y-2 text-center">
        <h1 class="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">Successfully linked!</h1>
        <p class="text-sm text-slate-500 dark:text-slate-400">Your ${escapeHtml(serviceName)} account is now connected.</p>
      </div>
      <div class="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 p-4">
        <div class="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Linked account:</div>
        <div class="text-base font-mono text-slate-900 dark:text-slate-50 break-all">${escapeHtml(identifier)}</div>
      </div>
      <div class="space-y-3">
        <a 
          href="${escapeHtml(telegramUrl)}"
          class="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 px-6 py-3 text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-slate-950 transition-all active:scale-[0.98]"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.07-.2-.08-.06-.19-.04-.27-.02-.12.02-1.96 1.24-5.54 3.65-.52.36-.99.53-1.42.52-.47-.01-1.37-.27-2.03-.49-.82-.27-1.47-.42-1.42-.88.03-.24.37-.49 1.03-.74 4.04-1.76 6.73-2.92 8.08-3.49 3.85-1.62 4.65-1.9 5.17-1.91.11 0 .37.03.54.17.14.11.18.26.2.37.01.08.03.29.01.45z"/>
          </svg>
          Go to Telegram
        </a>
        <div class="text-center text-xs text-slate-500 dark:text-slate-400">
          Or close this page manually
        </div>
      </div>
    </div>
  </div>
</body>
</html>`;
}

function renderAuthErrorPage(serviceName: string, errorMessage: string, retryUrl?: string): string {
  const retryButton = retryUrl 
    ? `<a 
          href="${escapeHtml(retryUrl)}"
          class="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-700 px-6 py-3 text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 dark:focus:ring-offset-slate-950 transition-all active:scale-[0.98]"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path>
            <path d="M3 3v5h5"></path>
            <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"></path>
            <path d="M16 16h5v5"></path>
          </svg>
          Try Again with New Credentials
        </a>`
    : `<a 
          href="javascript:history.back()"
          class="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-700 px-6 py-3 text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 dark:focus:ring-offset-slate-950 transition-all active:scale-[0.98]"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
          Try Again
        </a>`;
        
  return `<!doctype html>
<html lang="en" class="dark">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Authentication Failed</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script>tailwind.config = { darkMode: 'class' }</script>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap');
    body { font-family: 'Inter', system-ui, sans-serif; }
  </style>
</head>
<body class="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 flex items-center justify-center p-4">
  <div class="w-full max-w-md">
    <div class="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl shadow-lg p-8 space-y-6">
      <div class="mx-auto w-12 h-12 bg-red-500 dark:bg-red-600 rounded-lg flex items-center justify-center">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="15" y1="9" x2="9" y2="15"></line>
          <line x1="9" y1="9" x2="15" y2="15"></line>
        </svg>
      </div>
      <div class="space-y-2 text-center">
        <h1 class="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">Authentication failed</h1>
        <p class="text-sm text-slate-500 dark:text-slate-400">Could not authenticate with ${escapeHtml(serviceName)}.</p>
      </div>
      <div class="rounded-lg border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/30 p-4">
        <div class="text-sm text-red-700 dark:text-red-300">${escapeHtml(errorMessage)}</div>
      </div>
      <div class="pt-2">
        ${retryButton}
      </div>
    </div>
  </div>
</body>
</html>`;
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

async function sendTelegramMessage(
  chatId: string,
  text: string,
  options?: { parse_mode?: 'HTML' | 'Markdown'; reply_markup?: any }
): Promise<void> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!botToken) {
    console.error('[link-portal] Cannot send Telegram message: TELEGRAM_BOT_TOKEN not set');
    return;
  }

  try {
    const body: any = {
      chat_id: chatId,
      text,
      parse_mode: options?.parse_mode || 'HTML',
    };
    
    if (options?.reply_markup) {
      body.reply_markup = options.reply_markup;
    }
    
    console.log(`[link-portal] Sending Telegram message to ${chatId}`);
    const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('[link-portal] Failed to send Telegram message:', response.status, errorText);
    } else {
      console.log('[link-portal] Telegram message sent successfully');
    }
  } catch (error) {
    console.error('[link-portal] Error sending Telegram message:', error);
    // Ignore: linking should succeed even if notification fails.
  }
}

/**
 * Integration Commands - Planka and Rastar
 */

import type { BotContext } from '../bot.js';
import { integrationCommands } from './index.js';
import {
  handleLinkPlankaCommand,
  handlePlankaStatusCommand,
  handlePlankaUnlinkCommand,
} from '../handlers/commands/planka.js';
import {
  handleLinkRastarCommand,
  handleRastarStatusCommand,
  handleRastarUnlinkCommand,
} from '../handlers/commands/rastar.js';

// Planka commands
integrationCommands.command(
  'link_planka',
  'Link your Planka account',
  async (ctx: BotContext) => {
    await handleLinkPlankaCommand(ctx);
  }
)
  .localize('fa', 'link_planka', 'اتصال حساب پلانکای خود');

integrationCommands.command(
  'planka_status',
  'Check Planka connection status',
  handlePlankaStatusCommand
)
  .localize('fa', 'planka_status', 'بررسی وضعیت اتصال پلانکا');

integrationCommands.command(
  'planka_unlink',
  'Unlink your Planka account',
  handlePlankaUnlinkCommand
)
  .localize('fa', 'planka_unlink', 'قطع اتصال حساب پلانکا');

// Rastar commands
integrationCommands.command(
  'link_rastar',
  'Link your Rastar account',
  async (ctx: BotContext) => {
    await handleLinkRastarCommand(ctx);
  }
)
  .localize('fa', 'link_rastar', 'اتصال حساب رستار خود');

integrationCommands.command(
  'rastar_status',
  'Check Rastar connection status',
  handleRastarStatusCommand
)
  .localize('fa', 'rastar_status', 'بررسی وضعیت اتصال رستار');

integrationCommands.command(
  'rastar_unlink',
  'Unlink your Rastar account',
  handleRastarUnlinkCommand
)
  .localize('fa', 'rastar_unlink', 'قطع اتصال حساب رستار');

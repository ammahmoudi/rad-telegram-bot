/**
 * Command Groups - Grammy Commands Plugin
 * Organized command structure with proper scoping and descriptions
 */

import { CommandGroup } from '@grammyjs/commands';
import type { BotContext } from '../bot.js';

// User commands - available to all users in all chat types
export const userCommands = new CommandGroup<BotContext>();

// Chat management commands - for managing conversations
export const chatCommands = new CommandGroup<BotContext>();

// Integration commands - Planka and Rastar
export const integrationCommands = new CommandGroup<BotContext>();

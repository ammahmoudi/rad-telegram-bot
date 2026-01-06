import type { Context } from 'grammy';
import {
  handlePlankaStatusCommand,
  handleRastarStatusCommand,
  handleNewChatCommand,
  handleHistoryCommand,
} from './commands.js';
import { handleAiMessage } from './ai-message.js';

/**
 * Handle "📊 Planka Status" keyboard button
 */
export async function handlePlankaStatusButton(ctx: Context) {
  await handlePlankaStatusCommand(ctx);
}

/**
 * Handle "🍽️ Rastar Status" keyboard button
 */
export async function handleRastarStatusButton(ctx: Context) {
  await handleRastarStatusCommand(ctx);
}

/**
 * Handle "💬 New Chat" keyboard button
 */
export async function handleNewChatButton(ctx: Context) {
  await handleNewChatCommand(ctx);
}

/**
 * Handle "📚 History" keyboard button
 */
export async function handleHistoryButton(ctx: Context) {
  await handleHistoryCommand(ctx);
}

/**
 * Handle "Show today's menu" keyboard button
 */
export async function handleTodayMenuButton(ctx: Context) {
  // Just pass through to AI - it's already a natural message
  await handleAiMessage(ctx);
}

/**
 * Handle "Which days haven't I selected food?" keyboard button
 */
export async function handleUnselectedDaysButton(ctx: Context) {
  // Just pass through to AI - it's already a natural message
  await handleAiMessage(ctx);
}

/**
 * Handle "Show my delayed tasks" keyboard button
 */
export async function handleDelayedTasksButton(ctx: Context) {
  // Just pass through to AI - it's already a natural message
  await handleAiMessage(ctx);
}

/**
 * Handle "List my Planka boards" keyboard button
 */
export async function handleMyBoardsButton(ctx: Context) {
  // Just pass through to AI - it's already a natural message
  await handleAiMessage(ctx);
}

/**
 * Handle "What's for lunch this week?" keyboard button
 */
export async function handleWeekMenuButton(ctx: Context) {
  // Just pass through to AI - it's already a natural message
  await handleAiMessage(ctx);
}

/**
 * Handle "Create a new task" keyboard button
 */
export async function handleCreateTaskButton(ctx: Context) {
  // Just pass through to AI - it's already a natural message
  await handleAiMessage(ctx);
}

/**
 * Handle "My cards" keyboard button
 */
export async function handleMyCardsButton(ctx: Context) {
  // Just pass through to AI - it's already a natural message
  await handleAiMessage(ctx);
}

/**
 * Handle "Select today's lunch" keyboard button
 */
export async function handleSelectLunchButton(ctx: Context) {
  // Just pass through to AI - it's already a natural message
  await handleAiMessage(ctx);
}

/**
 * Handle "Who hasn't written their daily report today?" keyboard button
 */
export async function handleMissingDailyReportsButton(ctx: Context) {
  // Just pass through to AI - it's already a natural message
  await handleAiMessage(ctx);
}

/**
 * Handle "List names who didn't write report today" keyboard button
 */
export async function handleListNoReportNamesButton(ctx: Context) {
  // Just pass through to AI - it's already a natural message
  await handleAiMessage(ctx);
}

/**
 * Handle "My assigned tasks" keyboard button
 */
export async function handleMyAssignedTasksButton(ctx: Context) {
  // Just pass through to AI - it's already a natural message
  await handleAiMessage(ctx);
}

/**
 * Handle "Humanity QC cards" keyboard button
 */
export async function handleHumanityQcCardsButton(ctx: Context) {
  // Just pass through to AI - it's already a natural message
  await handleAiMessage(ctx);
}

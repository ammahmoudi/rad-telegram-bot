# Scheduled Jobs System (New Feature)

This document describes the new scheduled jobs system, the notification service, and how everything works end‑to‑end.

## Goals
- Run scheduled tasks reliably (production‑grade).
- Allow admins to view, enable/disable, and edit schedules.
- Keep MCP services isolated from scheduler and jobs.
- Keep Telegram bot stable even if Redis is unavailable.

## High‑Level Architecture

**Apps**
- `apps/telegram-bot`: Runs the scheduler at startup and executes jobs.
- `apps/admin-panel`: Manages jobs and execution history via API + UI.
- `apps/link-portal`: Unrelated to scheduler, uses shared DB utilities only.

**Packages**
- `packages/shared`: Minimal core (Prisma client, encryption, system config, etc.).
- `packages/job-scheduler`: Scheduler engine, queue manager, job registry, job definitions.
- `packages/rastar-service`: Rastar API client and helpers for food selection logic.
- `packages/mcp-*`: Fully isolated MCP servers (no scheduler dependency).

## How the Scheduler Runs

**Runtime location**
- The scheduler starts in the Telegram bot at startup.
- Entry: `apps/telegram-bot/src/index.ts` → `initializeScheduler()`.

**Startup flow**
1. Telegram bot starts.
2. `initializeScheduler()` runs.
3. Job definitions are registered.
4. Scheduler syncs jobs with DB.
5. Queue manager starts worker and listens for jobs.
6. Cron triggers enqueue jobs at the defined time.

**Shutdown**
- On SIGINT/SIGTERM, Telegram bot stops the scheduler and runner gracefully.

## Queue & Reliability

**BullMQ + Redis**
- Jobs are enqueued to Redis for reliable execution and retries.
- Worker concurrency is controlled inside `queue-manager`.
- If Redis is down, scheduler runs in “offline mode” and skips queue initialization.

## Data Model (Prisma)

**ScheduledJob**
- Stores job metadata and current schedule/enable state.

**JobExecution**
- Stores execution status, timings, result and errors.

## Notification Service

**Location**
- `apps/telegram-bot/src/services/notification/`

**Purpose**
- Centralized system for sending job‑generated messages to Telegram users.
- Keeps notification formatting and sending logic in one place.

**How it’s used**
- Jobs prepare notification payloads.
- Scheduler executes jobs and the notification service sends messages.
- Supports:
  - HTML parse mode
  - silent notifications
  - message templates

## Job Types

1) **Coded Jobs**
- Predefined job handlers in `packages/job-scheduler/src/jobs/`
- Example: unselected food reminder

2) **Custom Message Jobs**
- Created in Admin Panel
- Sends a custom Telegram message to targeted users

## Targeting (Include / Exclude / Character Pack)

Each job can target users in three ways:
- **Include Users**: Explicit list of user IDs
- **Exclude Users**: Removed from the include list
- **Character Packs**: Include users assigned to selected packs

If no targets are set, the job runs on **all users**.

## First Job: Unselected Food Reminder

**Behavior**
- Runs daily at 10 PM (Asia/Tehran).
- Finds users who did not select food for tomorrow.
- Sends reminders (optionally with AI recommendations).

**Implementation**
- Job definition: `packages/job-scheduler/src/jobs/unselected-food-reminder.job.ts`
- Rastar data access: `packages/rastar-service/src/food-service.ts`

## Admin Panel Integration

**Routes**
- `apps/admin-panel/src/app/api/jobs/`
  - List jobs
  - Update schedules
  - Enable/disable
  - View execution history

**UI**
- `apps/admin-panel/src/app/jobs/page.tsx`
- `apps/admin-panel/src/components/JobsClient.tsx`

## Environment Variables

**Redis**
- `REDIS_HOST`
- `REDIS_PORT`
- `REDIS_PASSWORD`
- `REDIS_URL`

**Database**
- `DATABASE_URL`
- `POSTGRES_USER`
- `POSTGRES_PASSWORD`
- `POSTGRES_DB`
- `POSTGRES_PORT`

## Key Guarantees
- MCP servers remain isolated.
- Scheduler runs only in Telegram bot.
- Admin panel only queries DB, does not execute jobs.
- Jobs are modular and registered explicitly.

## How to Add a New Job

1. Create a new job class in `packages/job-scheduler/src/jobs/`.
2. Export it and register it in `packages/job-scheduler/src/jobs/index.ts`.
3. Deploy; job will sync into DB on startup.
4. Manage schedule/enable state from Admin Panel.

## Troubleshooting

- **Scheduler not running**: Check Telegram bot logs and Redis availability.
- **No jobs in admin panel**: Ensure `registerAllJobs()` is called during bot startup.
- **Failed executions**: Review `JobExecution` records in Admin Panel.


#!/bin/sh
set -e

echo "🚀 Starting Rastar Telegram Bot..."

# Note: Database migrations and initial setup are handled by admin panel
# Telegram bot only connects to existing database

# Start the application
echo "✅ Starting application..."
exec node apps/telegram-bot/dist/index.js

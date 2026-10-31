#!/usr/bin/env bash
# ==============================================================================
# Cavrix Cloud - 1-Click Git Update & Hot-Reload Script for VPS Hosting
# ==============================================================================

set -e

echo "🔄 [Cavrix Cloud] Fetching latest changes from repository..."
git pull origin main

echo "📦 Updating dependencies..."
npm install

echo "🗄️ Updating database schema..."
npx prisma db push --accept-data-loss

echo "🏗️ Rebuilding application..."
npm run build

if command -v pm2 &> /dev/null; then
    echo "⚡ Reloading PM2 process..."
    pm2 restart cavrix-bot-dashboard
    echo "✅ Successfully updated and restarted! Current logs:"
    pm2 logs cavrix-bot-dashboard --lines 20 --nostream
else
    echo "✅ Build completed. Please restart your Node server."
fi

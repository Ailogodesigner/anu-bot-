#!/usr/bin/env bash
# ==============================================================================
# Cavrix Cloud VPS Bot & Web Control Panel - 1-Click Production Startup
# ==============================================================================

set -e

echo "👑 [Cavrix Cloud] Starting automated production deployment..."

# 1. Check Node.js runtime
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js v18+ (https://nodejs.org)."
    exit 1
fi

echo "✅ Node.js version: $(node -v)"
echo "✅ Working directory: $(pwd)"

# 2. Check for .env file
if [ ! -f .env ]; then
    echo "⚠️ .env file not found. Copying .env.example..."
    if [ -f .env.example ]; then
        cp .env.example .env
    fi
fi

# 3. Create logs directory
mkdir -p logs

# 4. Install dependencies if node_modules missing
if [ ! -d "node_modules" ]; then
    echo "📦 Installing npm dependencies..."
    npm install
fi

# 5. Synchronize Prisma SQLite Database
echo "🗄️ Synchronizing SQLite Database..."
npx prisma db push --accept-data-loss
node node_modules/tsx/dist/cli.mjs prisma/seed.ts || true

# 6. Build Next.js production bundle
echo "🏗️ Building Next.js production application..."
npm run build

# 7. Start application via PM2 or Node
if command -v pm2 &> /dev/null; then
    echo "🚀 Launching with PM2 background process manager..."
    pm2 delete cavrix-bot-dashboard 2>/dev/null || true
    pm2 start ecosystem.config.js
    pm2 save
    echo ""
    echo "🎉 [SUCCESS] Cavrix Bot & Control Panel is live!"
    echo "🌐 Control Panel URL: http://localhost:3005"
    echo "📜 View live logs: pm2 logs cavrix-bot-dashboard"
else
    echo "ℹ️ PM2 not found. Launching via node directly on port 3005..."
    echo "Tip: Run 'npm install -g pm2' for 24/7 background process management."
    node node_modules/next/dist/bin/next start -p 3005
fi


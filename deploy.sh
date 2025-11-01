#!/bin/bash

# ====================================
# GhostRooms Backend Deployment Script
# ====================================

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
APP_DIR="/srv/app/backend"
BACKUP_DIR="/srv/db/backups"
APP_NAME="ghostrooms-backend"

# Logging function
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR:${NC} $1"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING:${NC} $1"
}

# Check if we're in the correct directory
if [ "$PWD" != "$APP_DIR" ]; then
    log "Changing to application directory: $APP_DIR"
    cd "$APP_DIR" || { error "Failed to change directory"; exit 1; }
fi

log "Starting deployment process..."

# 1. Backup database before deployment
log "Creating database backup..."
mkdir -p "$BACKUP_DIR"
BACKUP_FILE="$BACKUP_DIR/pre_deploy_$(date +%Y%m%d_%H%M%S).sql"
docker exec chat-postgres pg_dump -U admin adminDB > "$BACKUP_FILE" 2>/dev/null || warn "Database backup failed (might be empty)"
if [ -f "$BACKUP_FILE" ]; then
    gzip "$BACKUP_FILE"
    log "Database backed up to: ${BACKUP_FILE}.gz"
fi

# 2. Pull latest code
log "Pulling latest code from repository..."
git fetch origin
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
log "Current branch: $CURRENT_BRANCH"

# Check if there are any changes
if git diff --quiet origin/$CURRENT_BRANCH; then
    log "No new changes to deploy"
    exit 0
fi

# Show what's about to be deployed
log "New commits to deploy:"
git log --oneline HEAD..origin/$CURRENT_BRANCH | head -5

# Pull the changes
git pull origin "$CURRENT_BRANCH" || { error "Git pull failed"; exit 1; }
log "Code updated successfully"

# 3. Install/update dependencies
log "Checking for dependency changes..."
if git diff HEAD@{1} --name-only | grep -q "package.json\|pnpm-lock.yaml"; then
    log "Dependencies changed, installing..."
    pnpm install --frozen-lockfile || { error "Dependency installation failed"; exit 1; }
else
    log "No dependency changes detected"
fi

# 4. Generate Prisma Client if schema changed
if git diff HEAD@{1} --name-only | grep -q "prisma/schema.prisma"; then
    log "Prisma schema changed, regenerating client..."
    pnpm prisma:generate || { error "Prisma generation failed"; exit 1; }
fi

# 5. Run database migrations
log "Running database migrations..."
pnpm prisma:migrate || { error "Database migration failed"; exit 1; }

# 6. Build TypeScript
log "Building application..."
pnpm build || { error "Build failed"; exit 1; }

# 7. Reload PM2 (zero-downtime)
log "Reloading application with PM2..."
pm2 reload "$APP_NAME" || { error "PM2 reload failed"; exit 1; }

# 8. Wait a moment for the app to start
sleep 3

# 9. Health check
log "Performing health check..."
HEALTH_CHECK=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/health)
if [ "$HEALTH_CHECK" = "200" ]; then
    log "✅ Health check passed!"
else
    error "Health check failed (HTTP $HEALTH_CHECK)"
    warn "Rolling back might be necessary"
    exit 1
fi

# 10. Show current status
log "Deployment completed successfully!"
log "Current status:"
pm2 status "$APP_NAME"

# 11. Show recent logs
log "Recent logs:"
pm2 logs "$APP_NAME" --lines 10 --nostream

log "======================================"
log "Deployment Summary:"
log "  Branch: $CURRENT_BRANCH"
log "  Commit: $(git rev-parse --short HEAD)"
log "  Time: $(date)"
log "======================================"

# Deployment Guide for GCP VM

## Quick Start

### 1. Initial Setup on GCP VM

```bash
# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install pnpm
npm install -g pnpm

# Install PM2 globally
npm install -g pm2

# Install Docker
sudo apt-get update
sudo apt-get install -y docker.io docker-compose
sudo usermod -aG docker $USER
newgrp docker
```

### 2. Directory Structure

```bash
sudo mkdir -p /srv/app/backend
sudo mkdir -p /srv/db
sudo mkdir -p /srv/app/backend/logs
sudo chown -R $USER:$USER /srv/app
```

### 3. Clone Repository

```bash
cd /srv/app/backend
git clone https://github.com/BallBoii/ChatBackEnd.git .
```

### 4. Configure Environment

```bash
# Copy and edit production environment
cp .env.production.example .env
nano .env  # Update DATABASE_URL password, CORS_ORIGIN, etc.

# Set proper permissions
chmod 600 .env
```

### 5. Start Database

```bash
# Start PostgreSQL via Docker
docker-compose up -d

# Verify database is running
docker ps
docker logs chat-postgres
```

### 6. Build and Deploy Backend

```bash
# Install dependencies
pnpm install --frozen-lockfile

# Generate Prisma Client
pnpm prisma:generate

# Run database migrations
pnpm prisma:migrate

# Build TypeScript
pnpm build

# Start with PM2
pm2 start ecosystem.config.js
pm2 save
pm2 startup  # Follow instructions to enable PM2 on system boot
```

### 7. Verify Deployment

```bash
# Check PM2 status
pm2 status
pm2 logs ghostrooms-backend

# Check health endpoint
curl http://localhost:8080/health

# Monitor logs
pm2 logs --lines 50
```

## Common Commands

### Application Management

```bash
# View logs
pm2 logs ghostrooms-backend

# Restart application
pm2 restart ghostrooms-backend

# Stop application
pm2 stop ghostrooms-backend

# Monitor resources
pm2 monit
```

### Database Management

```bash
# View database logs
docker logs chat-postgres

# Access PostgreSQL shell
docker exec -it chat-postgres psql -U admin -d adminDB

# Backup database
docker exec chat-postgres pg_dump -U admin adminDB > /srv/db/backups/backup_$(date +%Y%m%d_%H%M%S).sql

# Restore database
docker exec -i chat-postgres psql -U admin adminDB < /srv/db/backups/backup_file.sql
```

### Deployment Updates

```bash
# Pull latest code
cd /srv/app/backend
git pull origin main

# Install new dependencies (if any)
pnpm install --frozen-lockfile

# Run migrations (if any)
pnpm prisma:migrate

# Rebuild
pnpm build

# Reload application (zero-downtime)
pm2 reload ghostrooms-backend
```

## Nginx Configuration

Create `/etc/nginx/sites-available/ghostrooms`:

```nginx
upstream ghostrooms_backend {
    server 127.0.0.1:8080;
    keepalive 64;
}

server {
    listen 80;
    server_name yourdomain.com;

    # Redirect to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    # SSL Configuration (use certbot for Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # WebSocket support
    location / {
        proxy_pass http://ghostrooms_backend;
        proxy_http_version 1.1;
        
        # WebSocket headers
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        
        # Standard proxy headers
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Timeouts for WebSocket
        proxy_connect_timeout 7d;
        proxy_send_timeout 7d;
        proxy_read_timeout 7d;
    }

    # Health check endpoint
    location /health {
        proxy_pass http://ghostrooms_backend/health;
        access_log off;
    }
}
```

Enable the site:

```bash
sudo ln -s /etc/nginx/sites-available/ghostrooms /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## SSL Certificate (Let's Encrypt)

```bash
sudo apt-get install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

## Firewall Configuration

```bash
# Allow SSH, HTTP, HTTPS
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

## Automated Backups

Create `/srv/infra/scripts/db-backup.sh`:

```bash
#!/bin/bash
BACKUP_DIR="/srv/db/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/ghostrooms_backup_$TIMESTAMP.sql"

# Create backup
docker exec chat-postgres pg_dump -U admin adminDB > "$BACKUP_FILE"

# Compress
gzip "$BACKUP_FILE"

# Keep only last 7 days of backups
find "$BACKUP_DIR" -name "*.sql.gz" -mtime +7 -delete

echo "Backup completed: ${BACKUP_FILE}.gz"
```

Make it executable and add to crontab:

```bash
chmod +x /srv/infra/scripts/db-backup.sh

# Add to crontab (daily at 2 AM)
crontab -e
# Add: 0 2 * * * /srv/infra/scripts/db-backup.sh >> /srv/db/backups/backup.log 2>&1
```

## Monitoring

```bash
# Monitor PM2
pm2 monit

# Check application logs
pm2 logs ghostrooms-backend --lines 100

# Check database
docker stats chat-postgres

# Check disk space
df -h

# Check memory
free -h
```

## Troubleshooting

### Application won't start

```bash
# Check logs
pm2 logs ghostrooms-backend --err

# Verify environment
pm2 show ghostrooms-backend

# Check if port is in use
sudo lsof -i :8080
```

### Database connection issues

```bash
# Check if database is running
docker ps

# Check database logs
docker logs chat-postgres

# Test connection
docker exec chat-postgres psql -U admin -d adminDB -c "SELECT 1"
```

### WebSocket connection issues

```bash
# Check Nginx error logs
sudo tail -f /var/log/nginx/error.log

# Verify WebSocket upgrade headers
curl -i -N -H "Connection: Upgrade" -H "Upgrade: websocket" http://localhost:8080
```

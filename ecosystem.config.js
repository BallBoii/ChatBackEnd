module.exports = {
  apps: [
    {
      name: 'ghostrooms-backend',
      script: './dist/server.js',
      instances: 1,
      exec_mode: 'cluster',
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'production',
        PORT: 8080,
      },
      error_file: './logs/pm2-error.log',
      out_file: './logs/pm2-out.log',
      log_file: './logs/pm2-combined.log',
      time: true,
      merge_logs: true,
      // Graceful shutdown
      kill_timeout: 5000,
      wait_ready: true,
      listen_timeout: 10000,
      // Auto-restart on crash
      min_uptime: '10s',
      max_restarts: 10,
      // Health check
      health_check: {
        url: 'http://localhost:8080/health',
        interval: 30000,
        threshold: 3,
      },
    },
  ],
};

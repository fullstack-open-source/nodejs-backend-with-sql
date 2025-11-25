/**
 * PM2 Ecosystem Configuration
 * Process manager configuration for Node.js application
 */

module.exports = {
  apps: [
    {
      name: 'nodejs-backend-with-postgresql-prod',
      script: './server.js',
      instances: process.env.PM2_INSTANCES || 'max', // Use 'max' to utilize all CPU cores, or set specific number
      exec_mode: 'cluster', // Use cluster mode for better traffic handling
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        API_MODE: 'production',
        DEBUG_MODE: 'False'
      },
      error_file: './logs/errors-server.log',
      out_file: './logs/success-server.log',
      time: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
      max_memory_restart: '1G',
      watch: false,
      ignore_watch: ['node_modules', 'logs', '.git'],
      instance_var: 'INSTANCE_ID',
      kill_timeout: 5000,
      wait_ready: true,
      listen_timeout: 10000,
      shutdown_with_message: true,
      increment_var: 'PORT',
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000
      }
    },
    {
      name: 'nodejs-backend-with-postgresql-staging',
      script: './server.js',
      instances: process.env.PM2_INSTANCES || 2, // Use 2 instances for staging
      exec_mode: 'cluster', // Use cluster mode for better traffic handling
      env: {
        NODE_ENV: 'staging',
        PORT: 3000,
        API_MODE: 'staging',
        DEBUG_MODE: 'False'
      },
      error_file: './logs/errors-server.log',
      out_file: './logs/success-server.log',
      time: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
      max_memory_restart: '1G',
      watch: false,
      ignore_watch: ['node_modules', 'logs', '.git'],
      instance_var: 'INSTANCE_ID',
      kill_timeout: 5000,
      wait_ready: true,
      listen_timeout: 10000
    },
    {
      name: 'nodejs-backend-with-postgresql-dev',
      script: './server.js',
      instances: process.env.PM2_INSTANCES || 1, // Use 1 instance for development
      exec_mode: 'cluster', // Use cluster mode for better traffic handling
      env: {
        NODE_ENV: 'development',
        PORT: 3000,
        API_MODE: 'development',
        DEBUG_MODE: process.env.DEBUG_MODE || 'false'
      },
      error_file: './logs/errors-server.log',
      out_file: './logs/success-server.log',
      time: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
      max_memory_restart: '1G',
      watch: false,
      ignore_watch: ['node_modules', 'logs', '.git'],
      instance_var: 'INSTANCE_ID',
      kill_timeout: 5000,
      wait_ready: true,
      listen_timeout: 10000
    }
  ]
};


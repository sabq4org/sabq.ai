module.exports = {
  apps: [
    {
      name: 'jur3a-cms',
      script: 'npm',
      args: 'start',
      instances: 2,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      error_file: './logs/pm2-error.log',
      out_file: './logs/pm2-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      max_memory_restart: '1G',
      
      // إعدادات المراقبة
      min_uptime: '10s',
      max_restarts: 10,
      
      // إعدادات التحديث بدون توقف
      wait_ready: true,
      listen_timeout: 3000,
      kill_timeout: 5000,
      
      // مراقبة الملفات (معطل في الإنتاج)
      watch: false,
      ignore_watch: ['node_modules', 'logs', 'uploads', 'backups', '.git'],
      
      // متغيرات البيئة الإضافية
      env_production: {
        NODE_ENV: 'production',
        SEED_FAKE_DATA: 'false',
        USE_MOCK_DATA: 'false'
      }
    }
  ],
  
  // إعدادات النشر
  deploy: {
    production: {
      user: 'deploy',
      host: 'jur3a.ai',
      ref: 'origin/main',
      repo: 'git@github.com:your-org/jur3a-cms.git',
      path: '/var/www/jur3a-cms',
      'pre-deploy-local': '',
      'post-deploy': 'npm install && npm run build:production && pm2 reload ecosystem.config.js --env production',
      'pre-setup': ''
    }
  }
}; 
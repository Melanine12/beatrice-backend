module.exports = {
  apps: [
    {
      name: 'beatrice-backend-dev',
      script: 'server/index.js',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'development',
        PORT: 5002
      },
      // Configuration des logs
      log_file: './logs/combined.log',
      out_file: './logs/out.log',
      error_file: './logs/error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      
      // Configuration du processus
      max_memory_restart: '512M',
      min_uptime: '10s',
      max_restarts: 5,
      
      // Configuration du monitoring
      watch: ['server'],
      ignore_watch: ['node_modules', 'logs', 'uploads', 'client'],
      
      // Configuration des timeouts
      kill_timeout: 3000,
      listen_timeout: 3000,
      
      // Configuration des erreurs
      autorestart: true,
      crash_reload: true,
      
      // Configuration des métriques
      pmx: false,
      
      // Configuration des logs de démarrage
      merge_logs: true,
      
      // Arguments Node.js pour le développement
      node_args: '--inspect=0.0.0.0:9229'
    }
  ]
};

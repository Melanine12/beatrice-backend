module.exports = {
  apps: [
    {
      name: 'beatrice-backend',
      script: 'server/index.js',
      instances: 'max', // Utiliser tous les CPU disponibles
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'development',
        PORT: 5002
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 5002
      },
      // Configuration des logs
      log_file: './logs/combined.log',
      out_file: './logs/out.log',
      error_file: './logs/error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      
      // Configuration du processus
      max_memory_restart: '1G',
      min_uptime: '10s',
      max_restarts: 10,
      
      // Configuration du monitoring
      watch: false,
      ignore_watch: ['node_modules', 'logs', 'uploads'],
      
      // Configuration des variables d'environnement
      env_file: '.env',
      
      // Configuration des arguments
      node_args: '--max-old-space-size=1024',
      
      // Configuration des timeouts
      kill_timeout: 5000,
      listen_timeout: 3000,
      
      // Configuration des erreurs
      autorestart: true,
      crash_reload: true,
      
      // Configuration des notifications (optionnel)
      // notify: true,
      // notify_mode: 'reload',
      
      // Configuration des métriques
      pmx: true,
      
      // Configuration des logs de démarrage
      merge_logs: true,
      
      // Configuration des variables d'environnement spécifiques
      env_development: {
        NODE_ENV: 'development',
        PORT: 5002,
        DB_HOST: 'localhost',
        DB_PORT: 3306,
        DB_NAME: 'hotel_beatrice',
        DB_USER: 'root',
        DB_PASSWORD: 'votre_mot_de_passe'
      },
      
      env_staging: {
        NODE_ENV: 'staging',
        PORT: 5002,
        DB_HOST: 'localhost',
        DB_PORT: 3306,
        DB_NAME: 'hotel_beatrice_staging',
        DB_USER: 'root',
        DB_PASSWORD: 'votre_mot_de_passe'
      },
      
      env_production: {
        NODE_ENV: 'production',
        PORT: 5002,
        DB_HOST: 'localhost',
        DB_PORT: 3306,
        DB_NAME: 'hotel_beatrice_prod',
        DB_USER: 'root',
        DB_PASSWORD: 'votre_mot_de_passe_production'
      }
    }
  ],
  
  // Configuration du déploiement
  deploy: {
    production: {
      user: 'deploy',
      host: 'votre_serveur_production.com',
      ref: 'origin/main',
      repo: 'git@github.com:votre_username/beatrice-backend.git',
      path: '/var/www/beatrice-backend',
      'pre-deploy-local': '',
      'post-deploy': 'npm install && pm2 reload ecosystem.config.js --env production',
      'pre-setup': ''
    },
    
    staging: {
      user: 'deploy',
      host: 'votre_serveur_staging.com',
      ref: 'origin/develop',
      repo: 'git@github.com:votre_username/beatrice-backend.git',
      path: '/var/www/beatrice-backend-staging',
      'pre-deploy-local': '',
      'post-deploy': 'npm install && pm2 reload ecosystem.config.js --env staging',
      'pre-setup': ''
    }
  }
}; 
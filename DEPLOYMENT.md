# 🚀 Guide de Déploiement - Hôtel Beatrice Backend

Ce guide détaille le processus de déploiement du backend de l'Hôtel Beatrice en différents environnements.

## 📋 Prérequis

### Système
- **OS** : Ubuntu 20.04+ / CentOS 8+ / macOS 12+
- **RAM** : Minimum 2GB, Recommandé 4GB+
- **CPU** : Minimum 2 cœurs, Recommandé 4 cœurs+
- **Stockage** : Minimum 10GB d'espace libre

### Logiciels
- **Node.js** : Version 18+ (LTS recommandé)
- **npm** : Version 8+
- **MySQL** : Version 8.0+
- **PM2** : Version 5+ (pour la production)
- **Docker** : Version 20.10+ (optionnel)
- **Git** : Version 2.30+

### Comptes et Services
- **GitHub** : Compte avec accès au repository
- **Serveur** : Accès SSH ou console
- **Base de données** : Accès MySQL avec privilèges CREATE/DROP

## 🔧 Installation des Prérequis

### 1. Node.js et npm
```bash
# Ubuntu/Debian
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# CentOS/RHEL
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install -y nodejs

# macOS
brew install node@18

# Vérification
node --version  # Doit afficher v18.x.x
npm --version   # Doit afficher 8.x.x
```

### 2. MySQL
```bash
# Ubuntu/Debian
sudo apt-get install mysql-server mysql-client

# CentOS/RHEL
sudo yum install mysql-server mysql

# macOS
brew install mysql

# Démarrer MySQL
sudo systemctl start mysql
sudo systemctl enable mysql

# Sécuriser l'installation
sudo mysql_secure_installation
```

### 3. PM2 (Production)
```bash
# Installation globale
npm install -g pm2

# Vérification
pm2 --version
```

### 4. Docker (Optionnel)
```bash
# Ubuntu/Debian
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# CentOS/RHEL
sudo yum install -y yum-utils
sudo yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo
sudo yum install docker-ce docker-ce-cli containerd.io

# Démarrer Docker
sudo systemctl start docker
sudo systemctl enable docker
```

## 🚀 Déploiement Automatique

### 1. Cloner le Repository
```bash
git clone https://github.com/votre-username/beatrice-backend.git
cd beatrice-backend
```

### 2. Configuration des Variables d'Environnement
```bash
# Copier le fichier d'exemple
cp config/env.example .env

# Éditer le fichier .env
nano .env
```

**Variables obligatoires :**
```env
DB_HOST=localhost
DB_PORT=3306
DB_NAME=hotel_beatrice
DB_USER=root
DB_PASSWORD=votre_mot_de_passe_securise
JWT_SECRET=votre_secret_jwt_tres_long_et_complexe
JWT_EXPIRES_IN=24h
NODE_ENV=production
PORT=5002
```

### 3. Déploiement avec le Script Automatisé
```bash
# Rendre le script exécutable
chmod +x deploy.sh

# Déploiement en développement
./deploy.sh development

# Déploiement en staging
./deploy.sh staging

# Déploiement en production
./deploy.sh production
```

## 🐳 Déploiement avec Docker

### 1. Construction de l'Image
```bash
# Construire l'image
docker build -t beatrice-backend:latest .

# Vérifier l'image
docker images | grep beatrice-backend
```

### 2. Déploiement avec Docker Compose
```bash
# Déploiement complet (MySQL + Backend)
docker-compose up -d

# Déploiement en mode production
docker-compose --profile production up -d

# Vérifier les services
docker-compose ps
```

### 3. Gestion des Conteneurs
```bash
# Voir les logs
docker-compose logs -f backend

# Redémarrer un service
docker-compose restart backend

# Arrêter tous les services
docker-compose down
```

## 📊 Déploiement avec PM2

### 1. Configuration PM2
```bash
# Utiliser la configuration de développement
pm2 start pm2.config.js

# Utiliser la configuration de production
pm2 start ecosystem.config.js --env production

# Vérifier le statut
pm2 list
```

### 2. Gestion des Processus
```bash
# Redémarrer l'application
pm2 restart beatrice-backend

# Voir les logs
pm2 logs beatrice-backend

# Monitorer en temps réel
pm2 monit

# Arrêter l'application
pm2 stop beatrice-backend
```

### 3. Configuration PM2 pour la Production
```bash
# Sauvegarder la configuration
pm2 save

# Configurer le démarrage automatique
pm2 startup

# Redémarrer le serveur
sudo reboot
```

## 🗄️ Configuration de la Base de Données

### 1. Création de la Base
```bash
# Se connecter à MySQL
mysql -u root -p

# Créer la base de données
CREATE DATABASE hotel_beatrice CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

# Créer un utilisateur dédié
CREATE USER 'beatrice_user'@'localhost' IDENTIFIED BY 'mot_de_passe_securise';
GRANT ALL PRIVILEGES ON hotel_beatrice.* TO 'beatrice_user'@'localhost';
FLUSH PRIVILEGES;

# Quitter MySQL
EXIT;
```

### 2. Exécution des Scripts de Migration
```bash
# Exécuter les scripts de base
mysql -u root -p hotel_beatrice < database/create_caisses_table.sql
mysql -u root -p hotel_beatrice < database/create_paiements_table.sql

# Vérifier les tables créées
mysql -u root -p -e "USE hotel_beatrice; SHOW TABLES;"
```

### 3. Données de Test (Optionnel)
```bash
# Insérer des données de test
mysql -u root -p hotel_beatrice < database/demo_data.sql
```

## 🔒 Configuration de la Sécurité

### 1. Firewall
```bash
# Ubuntu/Debian
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 3306/tcp  # MySQL (si externe)
sudo ufw allow 5002/tcp  # Application
sudo ufw enable

# CentOS/RHEL
sudo firewall-cmd --permanent --add-port=22/tcp
sudo firewall-cmd --permanent --add-port=3306/tcp
sudo firewall-cmd --permanent --add-port=5002/tcp
sudo firewall-cmd --reload
```

### 2. SSL/TLS (Production)
```bash
# Générer un certificat auto-signé (développement)
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout nginx/ssl/key.pem \
  -out nginx/ssl/cert.pem

# Ou utiliser Let's Encrypt (production)
sudo apt-get install certbot python3-certbot-nginx
sudo certbot --nginx -d votre-domaine.com
```

### 3. Variables d'Environnement Sécurisées
```bash
# Ne jamais commiter le fichier .env
echo ".env" >> .gitignore

# Utiliser des secrets dans la production
export JWT_SECRET=$(openssl rand -hex 64)
export DB_PASSWORD=$(openssl rand -hex 32)
```

## 📊 Monitoring et Logs

### 1. Logs de l'Application
```bash
# Voir les logs en temps réel
tail -f logs/app.log

# Voir les logs d'erreur
tail -f logs/error.log

# Rotation automatique des logs
sudo logrotate -f /etc/logrotate.d/beatrice-backend
```

### 2. Monitoring PM2
```bash
# Interface web de monitoring
pm2 web

# Métriques en temps réel
pm2 monit

# Statistiques
pm2 show beatrice-backend
```

### 3. Monitoring Docker
```bash
# Statistiques des conteneurs
docker stats

# Utilisation des ressources
docker system df

# Nettoyage automatique
docker system prune -f
```

## 🔄 Mise à Jour et Maintenance

### 1. Mise à Jour du Code
```bash
# Récupérer les dernières modifications
git pull origin main

# Installer les nouvelles dépendances
npm install

# Redémarrer l'application
pm2 restart beatrice-backend
# ou
docker-compose restart backend
```

### 2. Sauvegarde de la Base de Données
```bash
# Sauvegarde automatique
mysqldump -u root -p hotel_beatrice > backup_$(date +%Y%m%d_%H%M%S).sql

# Restauration
mysql -u root -p hotel_beatrice < backup_20250101_120000.sql
```

### 3. Nettoyage et Maintenance
```bash
# Nettoyage automatique
./cleanup.sh all

# Nettoyage des logs
./cleanup.sh logs

# Nettoyage des uploads
./cleanup.sh uploads
```

## 🚨 Dépannage

### 1. Problèmes Courants

#### Application ne démarre pas
```bash
# Vérifier les logs
pm2 logs beatrice-backend
# ou
docker-compose logs backend

# Vérifier la configuration
node -c server/index.js

# Vérifier les variables d'environnement
echo $NODE_ENV
echo $DB_HOST
```

#### Erreurs de base de données
```bash
# Tester la connexion
mysql -u root -p -h $DB_HOST -P $DB_PORT

# Vérifier les permissions
SHOW GRANTS FOR 'beatrice_user'@'localhost';

# Vérifier l'état du service
sudo systemctl status mysql
```

#### Problèmes de mémoire
```bash
# Vérifier l'utilisation mémoire
free -h
pm2 monit

# Ajuster la limite mémoire
pm2 restart beatrice-backend --max-memory-restart 1G
```

### 2. Logs d'Erreur
```bash
# Logs système
sudo journalctl -u mysql
sudo journalctl -u docker

# Logs de l'application
tail -f logs/error.log
tail -f logs/combined.log
```

### 3. Redémarrage d'Urgence
```bash
# Arrêter tous les services
pm2 stop all
sudo systemctl stop mysql

# Redémarrer dans l'ordre
sudo systemctl start mysql
sleep 10
pm2 start ecosystem.config.js --env production
```

## 📞 Support et Maintenance

### Contacts
- **Développeur** : Assistant IA Claude
- **Documentation** : [Wiki du projet]
- **Issues** : [GitHub Issues]

### Procédures d'Urgence
1. **Arrêt immédiat** : `pm2 stop all` ou `docker-compose down`
2. **Sauvegarde** : `mysqldump -u root -p hotel_beatrice > emergency_backup.sql`
3. **Redémarrage** : Suivre la procédure de redémarrage d'urgence
4. **Contact** : Ouvrir une issue GitHub avec le tag "urgent"

---

**Hôtel Beatrice Management System** - Guide de Déploiement v1.0.0
*Dernière mise à jour : 2025-01-27*

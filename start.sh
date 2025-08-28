#!/bin/bash

# Script de démarrage pour le Backend Hôtel Beatrice
# Usage: ./start.sh [dev|prod|test]

set -e

# Couleurs pour les messages
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
MODE=${1:-dev}
APP_NAME="beatrice-backend"

# Fonction pour afficher les messages
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

info() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] INFO: $1${NC}"
}

# Fonction pour vérifier les prérequis
check_prerequisites() {
    log "Vérification des prérequis..."
    
    # Vérifier Node.js
    if ! command -v node &> /dev/null; then
        echo "❌ Node.js n'est pas installé"
        exit 1
    fi
    
    # Vérifier npm
    if ! command -v npm &> /dev/null; then
        echo "❌ npm n'est pas installé"
        exit 1
    fi
    
    # Vérifier le fichier .env
    if [ ! -f ".env" ]; then
        warn "Fichier .env non trouvé"
        if [ -f "config/env.example" ]; then
            info "Copie du fichier d'exemple..."
            cp config/env.example .env
            warn "Veuillez configurer le fichier .env avant de continuer"
            exit 1
        else
            echo "❌ Fichier .env et config/env.example non trouvés"
            exit 1
        fi
    fi
    
    log "Prérequis vérifiés avec succès"
}

# Fonction pour installer les dépendances
install_dependencies() {
    log "Installation des dépendances..."
    
    if [ ! -d "node_modules" ]; then
        npm install
        log "Dépendances installées avec succès"
    else
        info "Dépendances déjà installées"
    fi
}

# Fonction pour démarrer en mode développement
start_dev() {
    log "Démarrage en mode développement..."
    npm run dev
}

# Fonction pour démarrer en mode production
start_prod() {
    log "Démarrage en mode production..."
    
    # Vérifier PM2
    if ! command -v pm2 &> /dev/null; then
        warn "PM2 n'est pas installé. Installation..."
        npm install -g pm2
    fi
    
    # Démarrer avec PM2
    pm2 start ecosystem.config.js --env production
    pm2 list
    log "Application démarrée avec PM2"
}

# Fonction pour démarrer en mode test
start_test() {
    log "Démarrage des tests..."
    npm test
}

# Fonction pour vérifier la santé de l'application
health_check() {
    log "Vérification de la santé de l'application..."
    
    # Lire le port depuis la configuration
    source .env 2>/dev/null || warn "Fichier .env non trouvé"
    PORT=${PORT:-5002}
    
    # Attendre que l'application soit prête
    local max_attempts=30
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if curl -s "http://localhost:$PORT/api/health" > /dev/null 2>&1; then
            log "✅ Application en ligne et répondant sur le port $PORT"
            return 0
        fi
        
        info "Tentative $attempt/$max_attempts - Attente..."
        sleep 2
        attempt=$((attempt + 1))
    done
    
    echo "❌ L'application ne répond pas après $max_attempts tentatives"
    return 1
}

# Fonction principale
main() {
    log "=== Démarrage de $APP_NAME en mode $MODE ==="
    
    check_prerequisites
    install_dependencies
    
    case $MODE in
        "dev")
            start_dev
            ;;
        "prod")
            start_prod
            health_check
            ;;
        "test")
            start_test
            ;;
        *)
            echo "Usage: $0 [dev|prod|test]"
            echo "  dev  - Mode développement (défaut)"
            echo "  prod - Mode production avec PM2"
            echo "  test - Exécution des tests"
            exit 1
            ;;
    esac
    
    log "=== Démarrage terminé ==="
}

# Exécution du script
main

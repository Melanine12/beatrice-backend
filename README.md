# 🏨 Hôtel Beatrice - Backend API

Backend Node.js/Express pour le système de gestion de l'Hôtel Beatrice.

## 🚀 Fonctionnalités

- **Gestion des Caisses** : Création, modification, calcul des soldes
- **Paiements Partiels** : Gestion des paiements différés et immédiats
- **Génération de Rapports PDF** : Rapports financiers professionnels
- **API RESTful** : Endpoints sécurisés avec JWT
- **Base de Données MySQL** : Avec Sequelize ORM
- **Authentification** : Système de rôles et permissions

## 🛠️ Technologies

- **Runtime** : Node.js 18+
- **Framework** : Express.js
- **Base de Données** : MySQL 8.0+
- **ORM** : Sequelize 6+
- **Authentification** : JWT
- **Génération PDF** : PDFKit
- **Tests** : Jest + Supertest

## 📦 Installation

```bash
cd backend
npm install
```

## 🔧 Configuration

1. Copier le fichier d'environnement :
```bash
cp config/env.example .env
```

2. Configurer les variables dans `.env`

## 🚀 Démarrage

### Développement
```bash
npm run dev
```

### Production
```bash
npm start
```

### Avec PM2
```bash
npm run deploy:prod
```

### Avec Docker
```bash
npm run docker:compose
```

## 🧪 Tests

```bash
npm test
npm run test:coverage
```

## 📚 Documentation

Voir `DEPLOYMENT.md` pour le guide de déploiement complet.

## 🔗 API Endpoints

- **Base URL** : `http://localhost:5002/api`
- **Documentation** : `/api/health`
- **Authentification** : `/api/auth/*`
- **Caisses** : `/api/caisses/*`
- **Paiements** : `/api/paiements/*`
- **Paiements Partiels** : `/api/paiements-partiels/*`

---

**Hôtel Beatrice Backend** v1.0.0

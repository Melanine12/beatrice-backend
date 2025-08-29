# 🚀 Guide de Déploiement Render

## Configuration CORS pour Render

### Problème résolu
- ✅ Configuration CORS mise à jour pour `https://hotelbeatricesys.com`
- ✅ Support Socket.IO avec CORS approprié
- ✅ Gestion des requêtes preflight OPTIONS
- ✅ En-têtes de sécurité configurés

## 📋 Variables d'environnement Render

### Variables obligatoires
```bash
NODE_ENV=production
PORT=10000
CORS_ORIGIN=https://hotelbeatricesys.com
SOCKET_CORS_ORIGIN=https://hotelbeatricesys.com
```

### Base de données
```bash
DB_HOST=your-render-db-host
DB_PORT=3306
DB_NAME=your-render-db-name
DB_USER=your-render-db-user
DB_PASSWORD=your-render-db-password
```

### JWT
```bash
JWT_SECRET=your-super-secure-jwt-secret
JWT_EXPIRES_IN=24h
```

### Cloudinary (optionnel)
```bash
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

## ⚙️ Configuration Render

### Build Command
```bash
npm install
```

### Start Command
```bash
npm start
```

### Health Check Path
```
/api/health
```

## 🔧 Vérification du déploiement

### 1. Test de santé
```bash
curl https://beatrice-backend.onrender.com/api/health
```

### 2. Test CORS
```bash
curl -H "Origin: https://hotelbeatricesys.com" \
     -H "Access-Control-Request-Method: POST" \
     -H "Access-Control-Request-Headers: Content-Type" \
     -X OPTIONS \
     https://beatrice-backend.onrender.com/api/auth/login
```

### 3. Test Socket.IO
```javascript
// Dans votre frontend
const socket = io('https://beatrice-backend.onrender.com', {
  withCredentials: true,
  transports: ['websocket', 'polling']
});
```

## 🚨 Résolution des erreurs CORS

### Si l'erreur persiste
1. Vérifiez que `NODE_ENV=production` est défini
2. Vérifiez que `CORS_ORIGIN=https://hotelbeatricesys.com` est correct
3. Redémarrez votre service Render
4. Vérifiez les logs Render pour les erreurs

### Logs utiles
```bash
# Dans Render Dashboard > Logs
# Recherchez les erreurs CORS ou Socket.IO
```

## 📱 Configuration Frontend

### Mise à jour de l'URL de l'API
```javascript
// Dans votre frontend
const API_BASE_URL = 'https://beatrice-backend.onrender.com/api';
const SOCKET_URL = 'https://beatrice-backend.onrender.com';
```

### Configuration Socket.IO
```javascript
import { io } from 'socket.io-client';

const socket = io('https://beatrice-backend.onrender.com', {
  withCredentials: true,
  transports: ['websocket', 'polling'],
  timeout: 20000
});
```

## 🔄 Redéploiement

Après modification des variables d'environnement :
1. Sauvegardez les variables dans Render
2. Redémarrez manuellement le service
3. Vérifiez les logs pour confirmer le redémarrage

## 📞 Support

En cas de problème persistant :
1. Vérifiez les logs Render
2. Testez l'endpoint `/api/health`
3. Vérifiez la configuration CORS
4. Contactez le support si nécessaire
# Trigger Render redeploy - Ven 29 aoû 2025 02:06:04 WAT

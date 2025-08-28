// Configuration Cloudinary - Fichier d'exemple
// Copiez ce fichier vers cloudinary.js et remplissez vos informations

const cloudinary = require('cloudinary').v2;

// Configuration Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'your_cloud_name',
  api_key: process.env.CLOUDINARY_API_KEY || 'your_api_key',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'your_api_secret'
});

// Variables d'environnement à configurer dans votre .env :
// CLOUDINARY_CLOUD_NAME=votre_nom_de_cloud
// CLOUDINARY_API_KEY=votre_clé_api
// CLOUDINARY_API_SECRET=votre_secret_api
// CLOUDINARY_UPLOAD_PRESET=hotel_beatrice

module.exports = cloudinary;

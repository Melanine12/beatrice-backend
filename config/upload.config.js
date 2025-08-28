/**
 * Configuration de l'upload des fichiers
 * Tous les fichiers sont maintenant gérés par Cloudinary
 */

module.exports = {
  // Configuration de l'upload
  upload: {
    // Stockage : Cloudinary uniquement (plus de stockage local)
    storage: 'cloudinary',
    
    // Taille maximale des fichiers (5MB)
    maxFileSize: process.env.MAX_FILE_SIZE || 5 * 1024 * 1024,
    
    // Types de fichiers autorisés
    allowedMimeTypes: [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'image/bmp'
    ],
    
    // Extensions autorisées
    allowedExtensions: ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'],
    
    // Configuration Cloudinary
    cloudinary: {
      folder: 'hotel_beatrice',
      resourceType: 'image',
      transformations: [
        { quality: 'auto:good' },
        { fetch_format: 'auto' }
      ]
    }
  },
  
  // Messages d'information
  info: {
    message: '🚀 Upload 100% Cloudinary - Plus de stockage local',
    benefits: [
      'Performance améliorée (CDN global)',
      'Scalabilité automatique',
      'Optimisation automatique des images',
      'Sauvegarde et réplication automatiques',
      'Pas de gestion d\'espace disque'
    ]
  }
};

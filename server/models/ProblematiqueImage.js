const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const ProblematiqueImage = sequelize.define('ProblematiqueImage', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  problematique_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'tbl_problematiques',
      key: 'id'
    },
    comment: 'ID de la problématique associée'
  },
  nom_fichier: {
    type: DataTypes.STRING(255),
    allowNull: false,
    comment: 'Nom du fichier sur le serveur'
  },
  nom_original: {
    type: DataTypes.STRING(255),
    allowNull: false,
    comment: 'Nom original du fichier uploadé'
  },
  chemin_fichier: {
    type: DataTypes.STRING(500),
    allowNull: false,
    comment: 'Chemin complet vers le fichier sur le serveur'
  },
  type_mime: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: 'Type MIME du fichier'
  },
  taille: {
    type: DataTypes.BIGINT,
    allowNull: false,
    comment: 'Taille du fichier en octets'
  },
  source: {
    type: DataTypes.ENUM('camera', 'upload', 'existing'),
    allowNull: false,
    defaultValue: 'upload',
    comment: 'Source de l\'image (caméra, upload, existant)'
  },
  date_upload: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    comment: 'Date et heure de l\'upload'
  },
  utilisateur_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'tbl_utilisateurs',
      key: 'id'
    },
    comment: 'ID de l\'utilisateur qui a uploadé l\'image'
  },
  statut: {
    type: DataTypes.ENUM('actif', 'supprime'),
    allowNull: false,
    defaultValue: 'actif',
    comment: 'Statut de l\'image (actif ou supprimé)'
  },
  metadata: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Métadonnées supplémentaires (EXIF, dimensions, etc.)'
  }
}, {
  tableName: 'tbl_problematiques_images',
  timestamps: false, // Désactive createdAt et updatedAt automatiques
  indexes: [
    {
      fields: ['problematique_id']
    },
    {
      fields: ['utilisateur_id']
    },
    {
      fields: ['date_upload']
    },
    {
      fields: ['statut']
    },
    {
      fields: ['source']
    },
    {
      fields: ['problematique_id', 'statut', 'date_upload'],
      name: 'idx_problematiques_images_composite'
    }
  ]
});

// Instance method to get file size in human readable format
ProblematiqueImage.prototype.getFileSizeFormatted = function() {
  const bytes = this.taille;
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Instance method to check if image is from camera
ProblematiqueImage.prototype.isFromCamera = function() {
  return this.source === 'camera';
};

// Instance method to check if image is uploaded
ProblematiqueImage.prototype.isUploaded = function() {
  return this.source === 'upload';
};

// Instance method to check if image is existing
ProblematiqueImage.prototype.isExisting = function() {
  return this.source === 'existing';
};

// Instance method to get image URL for frontend
ProblematiqueImage.prototype.getImageUrl = function() {
  return `/uploads/problematiques/${this.nom_fichier}`;
};

// Instance method to get thumbnail URL
ProblematiqueImage.prototype.getThumbnailUrl = function() {
  const nameWithoutExt = this.nom_fichier.replace(/\.[^/.]+$/, '');
  const extension = this.nom_fichier.split('.').pop();
  return `/uploads/problematiques/thumbnails/${nameWithoutExt}_thumb.${extension}`;
};

// Instance method to check if file is image
ProblematiqueImage.prototype.isImage = function() {
  return this.type_mime.startsWith('image/');
};

// Instance method to check if file is video
ProblematiqueImage.prototype.isVideo = function() {
  return this.type_mime.startsWith('video/');
};

// Instance method to get file extension
ProblematiqueImage.prototype.getFileExtension = function() {
  return this.nom_fichier.split('.').pop().toLowerCase();
};

// Instance method to check if file can be previewed
ProblematiqueImage.prototype.canBePreviewed = function() {
  const previewableTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/bmp'];
  return previewableTypes.includes(this.type_mime);
};

// Instance method to get image dimensions from metadata
ProblematiqueImage.prototype.getImageDimensions = function() {
  if (this.metadata && this.metadata.dimensions) {
    return {
      width: this.metadata.dimensions.width,
      height: this.metadata.dimensions.height
    };
  }
  return null;
};

// Instance method to check if image is landscape
ProblematiqueImage.prototype.isLandscape = function() {
  const dimensions = this.getImageDimensions();
  if (dimensions) {
    return dimensions.width > dimensions.height;
  }
  return false;
};

// Instance method to check if image is portrait
ProblematiqueImage.prototype.isPortrait = function() {
  const dimensions = this.getImageDimensions();
  if (dimensions) {
    return dimensions.height > dimensions.width;
  }
  return false;
};

// Instance method to check if image is square
ProblematiqueImage.prototype.isSquare = function() {
  const dimensions = this.getImageDimensions();
  if (dimensions) {
    return dimensions.width === dimensions.height;
  }
  return false;
};

// Instance method to get upload date in relative format
ProblematiqueImage.prototype.getRelativeUploadDate = function() {
  const now = new Date();
  const uploadDate = new Date(this.date_upload);
  const diffTime = Math.abs(now - uploadDate);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return 'Aujourd\'hui';
  if (diffDays === 1) return 'Hier';
  if (diffDays < 7) return `Il y a ${diffDays} jours`;
  if (diffDays < 30) return `Il y a ${Math.floor(diffDays / 7)} semaines`;
  if (diffDays < 365) return `Il y a ${Math.floor(diffDays / 30)} mois`;
  return `Il y a ${Math.floor(diffDays / 365)} ans`;
};

module.exports = ProblematiqueImage;

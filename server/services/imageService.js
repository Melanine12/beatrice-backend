const fs = require('fs').promises;
const path = require('path');
const sharp = require('sharp');
const { v4: uuidv4 } = require('uuid');

class ImageService {
  constructor() {
    this.uploadDir = path.join(__dirname, '../../uploads/problematiques');
    this.thumbnailsDir = path.join(__dirname, '../../uploads/problematiques/thumbnails');
    this.maxFileSize = 5 * 1024 * 1024; // 5MB
    this.allowedMimeTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'image/bmp'
    ];
    this.thumbnailSizes = {
      small: { width: 150, height: 150 },
      medium: { width: 300, height: 300 },
      large: { width: 600, height: 600 }
    };
  }

  // Initialiser les dossiers d'upload
  async initializeDirectories() {
    try {
      await fs.mkdir(this.uploadDir, { recursive: true });
      await fs.mkdir(this.thumbnailsDir, { recursive: true });
      console.log('📁 Dossiers d\'upload initialisés avec succès');
    } catch (error) {
      console.error('❌ Erreur lors de l\'initialisation des dossiers:', error);
      throw error;
    }
  }

  // Valider un fichier image
  validateImage(file) {
    const errors = [];

    // Vérifier la taille
    if (file.size > this.maxFileSize) {
      errors.push(`Fichier trop volumineux. Taille maximum: ${this.maxFileSize / (1024 * 1024)}MB`);
    }

    // Vérifier le type MIME
    if (!this.allowedMimeTypes.includes(file.mimetype)) {
      errors.push(`Type de fichier non supporté. Types autorisés: ${this.allowedMimeTypes.join(', ')}`);
    }

    // Vérifier l'extension
    const ext = path.extname(file.originalname).toLowerCase();
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'];
    if (!allowedExtensions.includes(ext)) {
      errors.push(`Extension non supportée. Extensions autorisées: ${allowedExtensions.join(', ')}`);
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Générer un nom de fichier unique
  generateUniqueFilename(originalName, problematiqueId) {
    const ext = path.extname(originalName);
    const timestamp = Date.now();
    const randomId = uuidv4().substring(0, 8);
    return `problematique_${problematiqueId}_${timestamp}_${randomId}${ext}`;
  }

  // Traiter et sauvegarder une image - Version simplifiée
  async processAndSaveImage(file, problematiqueId, userId, source = 'upload') {
    try {
      console.log('🔍 Début du traitement de l\'image:', file.originalname);
      console.log('📊 Informations du fichier:', {
        originalname: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        buffer: file.buffer ? 'Buffer présent' : 'Buffer manquant'
      });

      // Valider le fichier
      console.log('✅ Validation du fichier...');
      const validation = this.validateImage(file);
      if (!validation.isValid) {
        console.error('❌ Validation échouée:', validation.errors);
        throw new Error(validation.errors.join(', '));
      }
      console.log('✅ Fichier validé avec succès');

      // Générer le nom de fichier unique
      console.log('🏷️ Génération du nom de fichier...');
      const filename = this.generateUniqueFilename(file.originalname, problematiqueId);
      const filePath = path.join(this.uploadDir, filename);
      console.log('📁 Chemin du fichier:', filePath);

      // Lire le buffer du fichier
      console.log('📖 Lecture du buffer...');
      const imageBuffer = file.buffer;
      if (!imageBuffer) {
        throw new Error('Buffer du fichier manquant');
      }
      console.log('✅ Buffer lu, taille:', imageBuffer.length);

      // Sauvegarder l'image directement (sans traitement Sharp)
      console.log('💾 Sauvegarde de l\'image...');
      await fs.writeFile(filePath, imageBuffer);
      console.log('✅ Image sauvegardée sur le disque');

      // Retourner les informations du fichier (sans traitement complexe)
      const result = {
        nom_fichier: filename,
        nom_original: file.originalname,
        chemin_fichier: `/uploads/problematiques/${filename}`,
        type_mime: file.mimetype,
        taille: file.size,
        source: source,
        utilisateur_id: userId,
        metadata: {
          format: path.extname(file.originalname).substring(1),
          width: null,
          height: null
        },
        thumbnails: {}
      };

      console.log('🎉 Traitement simplifié terminé avec succès:', result);
      return result;

    } catch (error) {
      console.error('❌ Erreur lors du traitement de l\'image:', error);
      console.error('📚 Stack trace:', error.stack);
      throw error;
    }
  }

  // Traiter l'image (redimensionnement, compression, etc.)
  async processImage(imageBuffer) {
    try {
      const image = sharp(imageBuffer);
      
      // Obtenir les métadonnées
      const metadata = await image.metadata();
      
      // Redimensionner si l'image est trop grande
      if (metadata.width > 1920 || metadata.height > 1080) {
        image.resize(1920, 1080, {
          fit: 'inside',
          withoutEnlargement: true
        });
      }

      // Optimiser selon le format
      if (metadata.format === 'jpeg' || metadata.format === 'jpg') {
        return await image.jpeg({ quality: 80, progressive: true }).toBuffer();
      } else if (metadata.format === 'png') {
        return await image.png({ compressionLevel: 9 }).toBuffer();
      } else if (metadata.format === 'webp') {
        return await image.webp({ quality: 80 }).toBuffer();
      } else {
        return await image.toBuffer();
      }

    } catch (error) {
      console.error('❌ Erreur lors du traitement de l\'image:', error);
      throw error;
    }
  }

  // Créer les thumbnails
  async createThumbnails(imageBuffer, filename) {
    try {
      const thumbnails = {};
      const nameWithoutExt = filename.replace(/\.[^/.]+$/, '');
      const ext = path.extname(filename);

      for (const [size, dimensions] of Object.entries(this.thumbnailSizes)) {
        const thumbnailFilename = `${nameWithoutExt}_${size}${ext}`;
        const thumbnailPath = path.join(this.thumbnailsDir, thumbnailFilename);

        await sharp(imageBuffer)
          .resize(dimensions.width, dimensions.height, {
            fit: 'cover',
            position: 'center'
          })
          .jpeg({ quality: 70 })
          .toFile(thumbnailPath);

        thumbnails[size] = `/uploads/problematiques/thumbnails/${thumbnailFilename}`;
      }

      return thumbnails;

    } catch (error) {
      console.error('❌ Erreur lors de la création des thumbnails:', error);
      return {};
    }
  }

  // Extraire les métadonnées de l'image
  async extractMetadata(imageBuffer) {
    try {
      const image = sharp(imageBuffer);
      const metadata = await image.metadata();

      return {
        format: metadata.format,
        width: metadata.width,
        height: metadata.height,
        channels: metadata.channels,
        hasAlpha: metadata.hasAlpha,
        hasProfile: metadata.hasProfile,
        isOpaque: metadata.isOpaque,
        orientation: metadata.orientation,
        space: metadata.space,
        depth: metadata.depth,
        density: metadata.density
      };

    } catch (error) {
      console.error('❌ Erreur lors de l\'extraction des métadonnées:', error);
      return {};
    }
  }

  // Supprimer une image et ses thumbnails
  async deleteImage(filename) {
    try {
      const filePath = path.join(this.uploadDir, filename);
      const nameWithoutExt = filename.replace(/\.[^/.]+$/, '');
      const ext = path.extname(filename);

      // Supprimer le fichier principal
      await fs.unlink(filePath);

      // Supprimer les thumbnails
      for (const size of Object.keys(this.thumbnailSizes)) {
        const thumbnailPath = path.join(this.thumbnailsDir, `${nameWithoutExt}_${size}${ext}`);
        try {
          await fs.unlink(thumbnailPath);
        } catch (error) {
          // Ignorer si le thumbnail n'existe pas
        }
      }

      console.log(`✅ Image ${filename} supprimée avec succès`);

    } catch (error) {
      console.error(`❌ Erreur lors de la suppression de l'image ${filename}:`, error);
      throw error;
    }
  }

  // Nettoyer les anciens fichiers
  async cleanupOldFiles(daysOld = 30) {
    try {
      const files = await fs.readdir(this.uploadDir);
      const now = Date.now();
      const cutoffTime = now - (daysOld * 24 * 60 * 60 * 1000);

      let deletedCount = 0;

      for (const file of files) {
        const filePath = path.join(this.uploadDir, file);
        const stats = await fs.stat(filePath);

        if (stats.mtime.getTime() < cutoffTime) {
          await this.deleteImage(file);
          deletedCount++;
        }
      }

      console.log(`🧹 Nettoyage terminé: ${deletedCount} fichiers supprimés`);
      return deletedCount;

    } catch (error) {
      console.error('❌ Erreur lors du nettoyage:', error);
      throw error;
    }
  }

  // Obtenir les statistiques d'utilisation
  async getStorageStats() {
    try {
      const files = await fs.readdir(this.uploadDir);
      let totalSize = 0;
      let fileCount = 0;

      for (const file of files) {
        const filePath = path.join(this.uploadDir, file);
        const stats = await fs.stat(filePath);
        totalSize += stats.size;
        fileCount++;
      }

      return {
        fileCount,
        totalSize,
        totalSizeFormatted: this.formatBytes(totalSize),
        averageFileSize: fileCount > 0 ? totalSize / fileCount : 0,
        averageFileSizeFormatted: fileCount > 0 ? this.formatBytes(totalSize / fileCount) : '0 B'
      };

    } catch (error) {
      console.error('❌ Erreur lors du calcul des statistiques:', error);
      return {
        fileCount: 0,
        totalSize: 0,
        totalSizeFormatted: '0 B',
        averageFileSize: 0,
        averageFileSizeFormatted: '0 B'
      };
    }
  }

  // Formater les bytes en format lisible
  formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // Vérifier l'intégrité des fichiers
  async verifyFileIntegrity() {
    try {
      const files = await fs.readdir(this.uploadDir);
      const results = [];

      for (const file of files) {
        const filePath = path.join(this.uploadDir, file);
        
        try {
          // Vérifier si le fichier peut être lu
          await sharp(filePath).metadata();
          results.push({ file, status: 'OK', error: null });
        } catch (error) {
          results.push({ file, status: 'CORRUPTED', error: error.message });
        }
      }

      return results;

    } catch (error) {
      console.error('❌ Erreur lors de la vérification d\'intégrité:', error);
      throw error;
    }
  }
}

module.exports = new ImageService();

const { CloudinaryService } = require('./cloudinaryService');
const sharp = require('sharp');
const { v4: uuidv4 } = require('uuid');

class CloudinaryImageService {
  constructor() {
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
    
    console.log('🚀 Service CloudinaryImageService initialisé - Stockage 100% Cloudinary');
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
    const path = require('path');
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
    const path = require('path');
    const ext = path.extname(originalName);
    const timestamp = Date.now();
    const randomId = uuidv4().substring(0, 8);
    return `problematique_${problematiqueId}_${timestamp}_${randomId}${ext}`;
  }

  // Traiter et sauvegarder une image sur Cloudinary
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
      
      // Lire le buffer du fichier
      console.log('📖 Lecture du buffer...');
      const imageBuffer = file.buffer;
      if (!imageBuffer) {
        throw new Error('Buffer du fichier manquant');
      }
      console.log('✅ Buffer lu, taille:', imageBuffer.length);

      // Traiter l'image avec Sharp pour optimisation (optionnel)
      console.log('🔄 Traitement de l\'image...');
      let processedBuffer;
      try {
        processedBuffer = await this.processImage(imageBuffer);
        console.log('✅ Image traitée avec succès');
      } catch (error) {
        console.log('⚠️ Traitement Sharp échoué, utilisation du buffer original');
        processedBuffer = imageBuffer;
      }

      // Upload vers Cloudinary
      console.log('☁️ Upload vers Cloudinary...');
      const folder = `problematiques/${problematiqueId}`;
      const uploadResult = await CloudinaryService.uploadImageBuffer(processedBuffer, folder, {
        public_id: filename.replace(/\.[^/.]+$/, ''), // Sans extension
        overwrite: false
      });

      if (!uploadResult.success) {
        throw new Error(`Erreur upload Cloudinary: ${uploadResult.error}`);
      }

      console.log('✅ Image uploadée vers Cloudinary:', uploadResult.public_id);

      // Créer les thumbnails sur Cloudinary (optionnel)
      console.log('🖼️ Création des thumbnails...');
      let thumbnails = {};
      try {
        thumbnails = await this.createCloudinaryThumbnails(processedBuffer, filename, folder);
        console.log('✅ Thumbnails créés avec succès');
      } catch (error) {
        console.log('⚠️ Création des thumbnails échouée, continuation sans thumbnails');
        thumbnails = {};
      }

      // Retourner les informations du fichier
      const result = {
        nom_fichier: filename,
        nom_original: file.originalname,
        chemin_fichier: uploadResult.secure_url, // URL Cloudinary directe
        public_id: uploadResult.public_id, // ID Cloudinary
        type_mime: file.mimetype,
        taille: file.size,
        source: source,
        utilisateur_id: userId,
        metadata: {
          format: uploadResult.format,
          width: uploadResult.width,
          height: uploadResult.height,
          bytes: uploadResult.bytes
        },
        thumbnails: thumbnails,
        cloudinary_data: {
          public_id: uploadResult.public_id,
          secure_url: uploadResult.secure_url,
          url: uploadResult.url,
          created_at: uploadResult.created_at,
          width: uploadResult.width,
          height: uploadResult.height,
          format: uploadResult.format,
          bytes: uploadResult.bytes
        }
      };

      console.log('🎉 Traitement Cloudinary terminé avec succès:', result);
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

  // Créer les thumbnails sur Cloudinary
  async createCloudinaryThumbnails(imageBuffer, filename, folder) {
    try {
      const thumbnails = {};
      const nameWithoutExt = filename.replace(/\.[^/.]+$/, '');

      for (const [size, dimensions] of Object.entries(this.thumbnailSizes)) {
        const thumbnailFilename = `${nameWithoutExt}_${size}`;
        
        // Créer le thumbnail avec Sharp
        const thumbnailBuffer = await sharp(imageBuffer)
          .resize(dimensions.width, dimensions.height, {
            fit: 'cover',
            position: 'center'
          })
          .jpeg({ quality: 70 })
          .toBuffer();

        // Upload le thumbnail vers Cloudinary
        const thumbnailResult = await CloudinaryService.uploadImageBuffer(thumbnailBuffer, folder, {
          public_id: thumbnailFilename,
          overwrite: false
        });

        if (thumbnailResult.success) {
          thumbnails[size] = {
            url: thumbnailResult.secure_url,
            public_id: thumbnailResult.public_id,
            width: dimensions.width,
            height: dimensions.height
          };
        }
      }

      return thumbnails;

    } catch (error) {
      console.error('❌ Erreur lors de la création des thumbnails Cloudinary:', error);
      return {};
    }
  }

  // Supprimer une image de Cloudinary
  async deleteImage(publicId) {
    try {
      console.log('🗑️ Suppression de l\'image Cloudinary:', publicId);
      const result = await CloudinaryService.deleteImage(publicId);
      
      if (result.success) {
        console.log('✅ Image supprimée de Cloudinary');
        return result;
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('❌ Erreur lors de la suppression de l\'image:', error);
      throw error;
    }
  }

  // Mettre à jour une image sur Cloudinary
  async updateImage(publicId, newImageBuffer, options = {}) {
    try {
      console.log('🔄 Mise à jour de l\'image Cloudinary:', publicId);
      
      // Traiter la nouvelle image
      const processedBuffer = await this.processImage(newImageBuffer);
      
      // Supprimer l'ancienne image
      await this.deleteImage(publicId);
      
      // Uploader la nouvelle image
      const folder = publicId.split('/').slice(0, -1).join('/');
      const uploadResult = await CloudinaryService.uploadImageBuffer(processedBuffer, folder, {
        public_id: publicId.split('/').pop(),
        overwrite: true,
        ...options
      });

      if (!uploadResult.success) {
        throw new Error(`Erreur upload Cloudinary: ${uploadResult.error}`);
      }

      console.log('✅ Image mise à jour sur Cloudinary');
      return uploadResult;

    } catch (error) {
      console.error('❌ Erreur lors de la mise à jour de l\'image:', error);
      throw error;
    }
  }

  // Obtenir les informations d'une image
  async getImageInfo(publicId) {
    try {
      const cloudinary = require('../../config/cloudinary');
      const result = await cloudinary.api.resource(publicId);
      
      return {
        success: true,
        public_id: result.public_id,
        secure_url: result.secure_url,
        url: result.url,
        format: result.format,
        width: result.width,
        height: result.height,
        bytes: result.bytes,
        created_at: result.created_at
      };
    } catch (error) {
      console.error('❌ Erreur lors de la récupération des infos image:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = CloudinaryImageService;

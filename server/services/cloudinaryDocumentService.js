const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const path = require('path');

// Configuration Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

class CloudinaryDocumentService {
  constructor() {
    this.maxFileSize = 10 * 1024 * 1024; // 10MB
    this.allowedMimeTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp'
    ];
    
    console.log('🚀 Service CloudinaryDocumentService initialisé');
  }

  // Valider un fichier
  validateFile(file) {
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
    const allowedExtensions = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.jpg', '.jpeg', '.png', '.gif', '.webp'];
    if (!allowedExtensions.includes(ext)) {
      errors.push(`Extension non supportée. Extensions autorisées: ${allowedExtensions.join(', ')}`);
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Générer un nom de fichier unique
  generateUniqueFilename(originalName) {
    const ext = path.extname(originalName);
    const timestamp = Date.now();
    const random = Math.round(Math.random() * 1000000);
    return `rh_doc_${timestamp}_${random}${ext}`;
  }

  // Uploader un document vers Cloudinary
  async uploadDocument(filePath, folder = 'beatrice_rh_documents') {
    try {
      console.log('☁️ Upload vers Cloudinary:', filePath);
      
      // Lire le fichier
      const fileBuffer = fs.readFileSync(filePath);
      console.log('📖 Fichier lu, taille:', fileBuffer.length);

      // Upload vers Cloudinary
      const result = await cloudinary.uploader.upload(filePath, {
        folder: folder,
        resource_type: 'raw', // Pour les documents (PDF, DOC, etc.)
        use_filename: false,
        unique_filename: true
      });

      console.log('✅ Document uploadé vers Cloudinary:', result.public_id);

      return {
        success: true,
        url: result.secure_url,
        public_id: result.public_id,
        format: result.format,
        bytes: result.bytes,
        created_at: result.created_at
      };

    } catch (error) {
      console.error('❌ Erreur lors de l\'upload Cloudinary:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Supprimer un document de Cloudinary
  async deleteDocument(publicId) {
    try {
      console.log('🗑️ Suppression du document Cloudinary:', publicId);
      
      const result = await cloudinary.uploader.destroy(publicId, {
        resource_type: 'raw'
      });
      
      console.log('✅ Document supprimé de Cloudinary');
      return {
        success: result.result === 'ok',
        result: result.result
      };

    } catch (error) {
      console.error('❌ Erreur lors de la suppression du document:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Traiter et sauvegarder un document
  async processAndSaveDocument(file, documentType = 'document') {
    try {
      console.log('🔍 Début du traitement du document:', file.originalname);
      console.log('📊 Informations du fichier:', {
        originalname: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        path: file.path
      });

      // Valider le fichier
      console.log('✅ Validation du fichier...');
      const validation = this.validateFile(file);
      if (!validation.isValid) {
        console.error('❌ Validation échouée:', validation.errors);
        throw new Error(validation.errors.join(', '));
      }
      console.log('✅ Fichier validé avec succès');

      // Upload vers Cloudinary
      console.log('☁️ Upload vers Cloudinary...');
      const folder = `beatrice_rh_documents/${documentType}`;
      const uploadResult = await this.uploadDocument(file.path, folder);

      if (!uploadResult.success) {
        throw new Error(`Erreur upload Cloudinary: ${uploadResult.error}`);
      }

      console.log('✅ Document uploadé vers Cloudinary:', uploadResult.public_id);

      // Nettoyer le fichier temporaire
      try {
        fs.unlinkSync(file.path);
        console.log('🗑️ Fichier temporaire supprimé');
      } catch (cleanupError) {
        console.log('⚠️ Erreur lors de la suppression du fichier temporaire:', cleanupError.message);
      }

      // Retourner les informations du fichier
      const result = {
        nom_fichier: this.generateUniqueFilename(file.originalname),
        nom_fichier_original: file.originalname,
        chemin_fichier: uploadResult.url,
        url_cloudinary: uploadResult.url,
        public_id_cloudinary: uploadResult.public_id,
        taille_fichier: file.size,
        type_mime: file.mimetype,
        cloudinary_data: {
          public_id: uploadResult.public_id,
          secure_url: uploadResult.url,
          url: uploadResult.url,
          created_at: uploadResult.created_at,
          format: uploadResult.format,
          bytes: uploadResult.bytes
        }
      };

      console.log('🎉 Traitement Cloudinary terminé avec succès');
      return result;

    } catch (error) {
      console.error('❌ Erreur lors du traitement du document:', error);
      console.error('📚 Stack trace:', error.stack);
      throw error;
    }
  }
}

module.exports = CloudinaryDocumentService;

const cloudinary = require('../../config/cloudinary');
const { Readable } = require('stream');

class CloudinaryService {
  /**
   * Upload une image vers Cloudinary
   * @param {Buffer|string} file - Fichier à uploader (buffer ou chemin)
   * @param {string} folder - Dossier de destination sur Cloudinary
   * @param {Object} options - Options supplémentaires
   * @returns {Promise<Object>} Résultat de l'upload
   */
  static async uploadImage(file, folder = 'hotel_beatrice', options = {}) {
    try {
      const uploadOptions = {
        folder,
        resource_type: 'image',
        ...options
      };

      let result;
      
      if (Buffer.isBuffer(file)) {
        // Upload depuis un buffer - méthode simplifiée et robuste
        result = await new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(uploadOptions, (error, result) => {
            if (error) {
              reject(error);
              return;
            }
            resolve(result);
          });
          
          stream.end(file);
        });
      } else {
        // Upload depuis un chemin de fichier
        result = await cloudinary.uploader.upload(file, uploadOptions);
      }

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
      console.error('Erreur upload Cloudinary:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Supprime une image de Cloudinary
   * @param {string} publicId - ID public de l'image
   * @returns {Promise<Object>} Résultat de la suppression
   */
  static async deleteImage(publicId) {
    try {
      const result = await cloudinary.uploader.destroy(publicId);
      return {
        success: true,
        result
      };
    } catch (error) {
      console.error('Erreur suppression Cloudinary:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Met à jour une image sur Cloudinary
   * @param {string} publicId - ID public de l'image
   * @param {Object} options - Options de mise à jour
   * @returns {Promise<Object>} Résultat de la mise à jour
   */
  static async updateImage(publicId, options = {}) {
    try {
      const result = await cloudinary.uploader.explicit(publicId, {
        type: 'upload',
        ...options
      });
      
      return {
        success: true,
        result
      };
    } catch (error) {
      console.error('Erreur mise à jour Cloudinary:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Génère une URL signée pour un upload direct
   * @param {string} folder - Dossier de destination
   * @param {Object} options - Options supplémentaires
   * @returns {string} URL signée
   */
  static generateUploadUrl(folder = 'hotel_beatrice', options = {}) {
    const timestamp = Math.round(new Date().getTime() / 1000);
    const params = {
      timestamp,
      folder,
      ...options
    };
    
    return cloudinary.url('', {
      sign_url: true,
      ...params
    });
  }
}

module.exports = CloudinaryService;

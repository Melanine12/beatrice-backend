const cloudinary = require('cloudinary').v2;
const multer = require('multer');
const path = require('path');

// Configuration Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configuration Multer pour l'upload temporaire
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/temp/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'employee-photo-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB max
  },
  fileFilter: function (req, file, cb) {
    // Vérifier le type de fichier
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Seules les images sont autorisées'), false);
    }
  }
});

class CloudinaryService {
  // Upload d'une photo d'employé
  static async uploadEmployeePhoto(file, employeeId) {
    try {
      // Upload vers Cloudinary
      const result = await cloudinary.uploader.upload(file.path, {
        folder: 'hotel-beatrice/employees',
        public_id: `employee_${employeeId}_${Date.now()}`,
        transformation: [
          { width: 400, height: 400, crop: 'fill', gravity: 'face' },
          { quality: 'auto' },
          { format: 'auto' }
        ],
        resource_type: 'image'
      });

      return {
        success: true,
        url: result.secure_url,
        public_id: result.public_id
      };
    } catch (error) {
      console.error('Erreur lors de l\'upload Cloudinary:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Supprimer une photo d'employé
  static async deleteEmployeePhoto(publicId) {
    try {
      if (!publicId) return { success: true };

      const result = await cloudinary.uploader.destroy(publicId);
      
      return {
        success: result.result === 'ok',
        result: result.result
      };
    } catch (error) {
      console.error('Erreur lors de la suppression Cloudinary:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Extraire le public_id d'une URL Cloudinary
  static extractPublicId(url) {
    if (!url) return null;
    
    const matches = url.match(/\/v\d+\/(.+)\.(jpg|jpeg|png|gif|webp)/);
    if (matches && matches[1]) {
      return matches[1];
    }
    return null;
  }

  // Obtenir l'URL optimisée pour l'affichage
  static getOptimizedUrl(originalUrl, options = {}) {
    if (!originalUrl) return null;

    const {
      width = 200,
      height = 200,
      crop = 'fill',
      gravity = 'face',
      quality = 'auto'
    } = options;

    // Si c'est déjà une URL Cloudinary, on peut l'optimiser
    if (originalUrl.includes('cloudinary.com')) {
      const publicId = this.extractPublicId(originalUrl);
      if (publicId) {
        return cloudinary.url(publicId, {
          width,
          height,
          crop,
          gravity,
          quality,
          format: 'auto'
        });
      }
    }

    return originalUrl;
  }
}

module.exports = {
  CloudinaryService,
  upload
};
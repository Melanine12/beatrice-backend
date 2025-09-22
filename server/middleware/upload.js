const multer = require('multer');
const CloudinaryStorage = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinary');

// Configuration du stockage Cloudinary
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'beatrice_rh_documents',
    resource_type: 'raw',
    public_id: (req, file) => {
      // Générer un public_id avec extension
      const timestamp = Date.now();
      const random = Math.round(Math.random() * 1000000);
      const originalName = file.originalname || 'document';
      
      // Nettoyer et extraire l'extension de manière robuste
      const parts = originalName.split('.');
      let ext = 'file'; // extension par défaut
      
      if (parts.length > 1) {
        ext = parts[parts.length - 1]
          .toLowerCase()
          .trim()
          .replace(/[^a-z0-9]/g, ''); // Supprimer tous les caractères non alphanumériques
        if (!ext) ext = 'file';
      }
      
      const publicId = `rh_${timestamp}_${random}.${ext}`;
      console.log('Generated public_id:', publicId);
      return publicId;
    }
  }
});

console.log('✅ Cloudinary configuré pour l\'upload de fichiers');

// Configuration multer
const upload = multer({
  storage: storage,
  limits: { 
    fileSize: 10 * 1024 * 1024 // 10 MB file size limit
  },
  fileFilter: (req, file, cb) => {
    console.log('=== MULTER FILE FILTER ===');
    console.log('File fieldname:', file.fieldname);
    console.log('File originalname:', file.originalname);
    console.log('File mimetype:', file.mimetype);
    console.log('==========================');
    
    const allowedTypes = /jpeg|jpg|png|pdf|doc|docx|xls|xlsx/;
    const extname = allowedTypes.test(file.originalname.toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      console.log('✅ Fichier autorisé');
      return cb(null, true);
    } else {
      console.log('❌ Fichier non autorisé');
      cb(new Error('Type de fichier non autorisé. Formats acceptés: jpg, jpeg, png, pdf, doc, docx, xls, xlsx'), false);
    }
  }
});

module.exports = upload;
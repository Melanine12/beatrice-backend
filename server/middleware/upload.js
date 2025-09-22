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
      // Préserver l'extension du fichier
      const timestamp = Date.now();
      const random = Math.round(Math.random() * 1000000);
      const ext = file.originalname.split('.').pop().toLowerCase().trim();
      return `rh_${timestamp}_${random}.${ext}`;
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
    const allowedTypes = /jpeg|jpg|png|pdf|doc|docx|xls|xlsx/;
    const extname = allowedTypes.test(file.originalname.toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Type de fichier non autorisé. Formats acceptés: jpg, jpeg, png, pdf, doc, docx, xls, xlsx'), false);
    }
  }
});

module.exports = upload;
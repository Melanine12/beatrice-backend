const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configuration du stockage temporaire (comme pour les problématiques)
const uploadDir = path.join(__dirname, '../../uploads/temp');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const random = Math.round(Math.random() * 1000000);
    const ext = path.extname(file.originalname);
    cb(null, `rh_doc_${timestamp}_${random}${ext}`);
  }
});

console.log('✅ Stockage temporaire configuré pour l\'upload de fichiers');

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
    
    // Vérifier le mimetype d'abord
    const allowedMimeTypes = [
      'image/jpeg',
      'image/jpg', 
      'image/png',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];
    
    // Vérifier l'extension du fichier
    const allowedExtensions = /\.(jpeg|jpg|png|pdf|doc|docx|xls|xlsx)$/i;
    const hasValidExtension = allowedExtensions.test(file.originalname);
    
    // Vérifier le mimetype
    const hasValidMimeType = allowedMimeTypes.includes(file.mimetype);
    
    console.log('Validation:', {
      hasValidExtension,
      hasValidMimeType,
      originalname: file.originalname,
      mimetype: file.mimetype
    });

    if (hasValidMimeType || hasValidExtension) {
      console.log('✅ Fichier autorisé');
      return cb(null, true);
    } else {
      console.log('❌ Fichier non autorisé');
      cb(new Error('Type de fichier non autorisé. Formats acceptés: jpg, jpeg, png, pdf, doc, docx, xls, xlsx'), false);
    }
  }
});

module.exports = upload;
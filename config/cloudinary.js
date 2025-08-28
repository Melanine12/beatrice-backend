const cloudinary = require('cloudinary').v2;

// Configuration Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'df5isxcdl',
  api_key: process.env.CLOUDINARY_API_KEY || '713813752134233',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'kAa4XWzZOZ1bf_rT1AmTzBZbxRo'
});

module.exports = cloudinary;

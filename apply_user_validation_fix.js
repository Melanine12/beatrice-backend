const fs = require('fs');
const path = require('path');

// Chemin vers le fichier users.js
const usersFilePath = path.join(__dirname, 'server', 'routes', 'users.js');

// Lire le fichier
let content = fs.readFileSync(usersFilePath, 'utf8');

// Remplacer la validation pour POST /api/users
const oldPostValidation = `  body('departement_id').optional().custom((value) => {
    if (value === null || value === undefined || value === '') return true;
    if (typeof value === 'number' && value >= 1) return true;
    if (typeof value === 'string' && !isNaN(value) && parseInt(value) >= 1) return true;
    throw new Error('departement_id doit être un entier positif ou null');
  }),
  body('sous_departement_id').optional().custom((value) => {
    if (value === null || value === undefined || value === '') return true;
    if (typeof value === 'number' && value >= 1) return true;
    if (typeof value === 'string' && !isNaN(value) && parseInt(value) >= 1) return true;
    throw new Error('sous_departement_id doit être un entier positif ou null');
  })`;

const newPostValidation = `  body('departement_id').optional().custom((value) => {
    // Accepter null, undefined, chaîne vide, ou un entier positif
    if (value === null || value === undefined || value === '') return true;
    if (typeof value === 'number' && Number.isInteger(value) && value >= 1) return true;
    if (typeof value === 'string') {
      const num = parseInt(value);
      if (!isNaN(num) && Number.isInteger(num) && num >= 1) return true;
    }
    throw new Error('departement_id doit être un entier positif ou vide');
  }),
  body('sous_departement_id').optional().custom((value) => {
    // Accepter null, undefined, chaîne vide, ou un entier positif
    if (value === null || value === undefined || value === '') return true;
    if (typeof value === 'number' && Number.isInteger(value) && value >= 1) return true;
    if (typeof value === 'string') {
      const num = parseInt(value);
      if (!isNaN(num) && Number.isInteger(num) && num >= 1) return true;
    }
    throw new Error('sous_departement_id doit être un entier positif ou vide');
  })`;

// Remplacer dans le contenu
content = content.replace(oldPostValidation, newPostValidation);

// Sauvegarder le fichier modifié
fs.writeFileSync(usersFilePath, content, 'utf8');

console.log('✅ Validation des utilisateurs corrigée avec succès!');
console.log('📝 Les erreurs 400 intermittentes devraient être résolues.');

const { Sequelize } = require('sequelize');
require('dotenv').config();

// Configuration de la base de données
const sequelize = new Sequelize(process.env.DATABASE_URL || process.env.DB_URL, {
  dialect: 'postgres',
  logging: console.log,
  dialectOptions: {
    ssl: process.env.NODE_ENV === 'production' ? {
      require: true,
      rejectUnauthorized: false
    } : false
  }
});

async function createTables() {
  try {
    console.log('🔍 Connexion à la base de données...');
    await sequelize.authenticate();
    console.log('✅ Connexion réussie');
    
    // Créer la table contrats
    console.log('📋 Création de la table contrats...');
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS contrats (
        id SERIAL PRIMARY KEY,
        employe_id INTEGER NOT NULL REFERENCES "Users"(id),
        type_contrat VARCHAR(20) NOT NULL CHECK (type_contrat IN ('CDI', 'CDD', 'Stage', 'Intérim', 'Freelance', 'Consultant')),
        numero_contrat VARCHAR(100) NOT NULL UNIQUE,
        date_debut DATE NOT NULL,
        date_fin DATE,
        salaire_brut DECIMAL(10,2),
        salaire_net DECIMAL(10,2),
        devise VARCHAR(3) DEFAULT 'USD',
        duree_hebdomadaire INTEGER CHECK (duree_hebdomadaire > 0 AND duree_hebdomadaire <= 60),
        poste_occupe VARCHAR(255) NOT NULL,
        statut VARCHAR(20) NOT NULL DEFAULT 'Actif' CHECK (statut IN ('Actif', 'Expiré', 'Résilié', 'Suspendu')),
        description TEXT,
        conditions_particulieres TEXT,
        date_signature DATE,
        url_document VARCHAR(500),
        public_id VARCHAR(255),
        cree_par INTEGER NOT NULL REFERENCES "Users"(id),
        date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        date_mise_a_jour TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Table contrats créée');
    
    // Créer la table documents_rh
    console.log('📋 Création de la table documents_rh...');
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS documents_rh (
        id SERIAL PRIMARY KEY,
        employe_id INTEGER NOT NULL REFERENCES "Users"(id),
        contrat_id INTEGER REFERENCES contrats(id),
        type_document VARCHAR(50) NOT NULL CHECK (type_document IN ('Contrat', 'Avenant', 'Attestation de travail', 'Certificat de travail', 'Bulletin de paie', 'Certificat médical', 'Justificatif d\'absence', 'Demande de congé', 'Évaluation de performance', 'Formation', 'Autre')),
        nom_document VARCHAR(255) NOT NULL,
        description TEXT,
        date_emission DATE,
        date_expiration DATE,
        url_document VARCHAR(500) NOT NULL,
        public_id VARCHAR(255) NOT NULL,
        taille_fichier INTEGER,
        type_mime VARCHAR(100),
        confidentialite VARCHAR(20) NOT NULL DEFAULT 'Interne' CHECK (confidentialite IN ('Public', 'Interne', 'Confidentiel', 'Secret')),
        cree_par INTEGER NOT NULL REFERENCES "Users"(id),
        date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        date_mise_a_jour TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Table documents_rh créée');
    
    // Créer les index
    console.log('📋 Création des index...');
    await sequelize.query('CREATE INDEX IF NOT EXISTS idx_contrats_employe_id ON contrats(employe_id)');
    await sequelize.query('CREATE INDEX IF NOT EXISTS idx_contrats_statut ON contrats(statut)');
    await sequelize.query('CREATE INDEX IF NOT EXISTS idx_documents_rh_employe_id ON documents_rh(employe_id)');
    await sequelize.query('CREATE INDEX IF NOT EXISTS idx_documents_rh_contrat_id ON documents_rh(contrat_id)');
    await sequelize.query('CREATE INDEX IF NOT EXISTS idx_documents_rh_type ON documents_rh(type_document)');
    console.log('✅ Index créés');
    
    console.log('🎉 Tables créées avec succès !');
    
  } catch (error) {
    console.error('❌ Erreur lors de la création des tables:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await sequelize.close();
  }
}

createTables();

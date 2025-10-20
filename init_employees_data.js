const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 3306
};

// Données d'employés de test
const employeesData = [
  {
    civilite: 'M.',
    nom_famille: 'Dupont',
    nom_usage: null,
    prenoms: 'Jean Pierre',
    date_naissance: '1985-03-15',
    lieu_naissance: 'Paris, France',
    nationalite: 'Française',
    numero_securite_sociale: null,
    situation_famille: null,
    adresse: '123 Rue de la Paix',
    code_postal: '75001',
    ville: 'Paris',
    pays: 'France',
    telephone_personnel: '0123456789',
    telephone_domicile: null,
    email_personnel: 'jean.dupont@hotel-beatrice.com',
    contact_urgence_nom: null,
    contact_urgence_prenom: null,
    contact_urgence_lien: null,
    contact_urgence_telephone: null,
    matricule: 'EMP001',
    poste: 'Réceptionniste',
    departement_id: null,
    sous_departement_id: null,
    date_embauche: '2023-01-15',
    type_contrat: 'CDI',
    date_fin_contrat: null,
    temps_travail: 'Temps plein',
    statut: 'Actif',
    niveau_classification: null,
    photo_url: null
  },
  {
    civilite: 'Mme',
    nom_famille: 'Martin',
    nom_usage: null,
    prenoms: 'Marie Claire',
    date_naissance: '1982-07-22',
    lieu_naissance: 'Lyon, France',
    nationalite: 'Française',
    numero_securite_sociale: null,
    situation_famille: null,
    adresse: '456 Avenue des Champs',
    code_postal: '69000',
    ville: 'Lyon',
    pays: 'France',
    telephone_personnel: '0987654321',
    telephone_domicile: null,
    email_personnel: 'marie.martin@hotel-beatrice.com',
    contact_urgence_nom: null,
    contact_urgence_prenom: null,
    contact_urgence_lien: null,
    contact_urgence_telephone: null,
    matricule: 'EMP002',
    poste: 'Chef de cuisine',
    departement_id: null,
    sous_departement_id: null,
    date_embauche: '2022-06-01',
    type_contrat: 'CDI',
    date_fin_contrat: null,
    temps_travail: 'Temps plein',
    statut: 'Actif',
    niveau_classification: null,
    photo_url: null
  },
  {
    civilite: 'M.',
    nom_famille: 'Bernard',
    nom_usage: null,
    prenoms: 'Pierre',
    date_naissance: '1990-11-08',
    lieu_naissance: 'Marseille, France',
    nationalite: 'Française',
    numero_securite_sociale: null,
    situation_famille: null,
    adresse: '789 Boulevard de la République',
    code_postal: '13000',
    ville: 'Marseille',
    pays: 'France',
    telephone_personnel: '0147258369',
    telephone_domicile: null,
    email_personnel: 'pierre.bernard@hotel-beatrice.com',
    contact_urgence_nom: null,
    contact_urgence_prenom: null,
    contact_urgence_lien: null,
    contact_urgence_telephone: null,
    matricule: 'EMP003',
    poste: 'Agent d\'entretien',
    departement_id: 11,
    sous_departement_id: 13,
    date_embauche: '2023-03-10',
    type_contrat: 'CDI',
    date_fin_contrat: null,
    temps_travail: 'Temps plein',
    statut: 'Actif',
    niveau_classification: null,
    photo_url: null
  }
];

async function initEmployeesData() {
  let connection;
  
  try {
    console.log('🔌 Connexion à la base de données...');
    connection = await mysql.createConnection(dbConfig);
    
    // Vérifier si la table existe
    console.log('🔍 Vérification de la table tbl_employes...');
    const [tables] = await connection.execute("SHOW TABLES LIKE 'tbl_employes'");
    
    if (tables.length === 0) {
      console.log('❌ La table tbl_employes n\'existe pas!');
      return;
    }
    
    console.log('✅ La table tbl_employes existe');
    
    // Vérifier s'il y a déjà des employés
    const [countResult] = await connection.execute('SELECT COUNT(*) as total FROM tbl_employes');
    const total = countResult[0].total;
    console.log(`📊 Nombre d'employés existants: ${total}`);
    
    if (total > 0) {
      console.log('⚠️  Des employés existent déjà. Voulez-vous continuer? (y/N)');
      // En production, on peut continuer automatiquement
    }
    
    // Insérer les employés
    console.log('👥 Insertion des employés...');
    
    for (const emp of employeesData) {
      try {
        const query = `
          INSERT INTO tbl_employes (
            civilite, nom_famille, nom_usage, prenoms, date_naissance, lieu_naissance, nationalite,
            numero_securite_sociale, situation_famille, adresse, code_postal, ville, pays,
            telephone_personnel, telephone_domicile, email_personnel, contact_urgence_nom,
            contact_urgence_prenom, contact_urgence_lien, contact_urgence_telephone, matricule,
            poste, departement_id, sous_departement_id, date_embauche, type_contrat, date_fin_contrat, temps_travail,
            statut, niveau_classification, photo_url, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
        `;
        
        const values = [
          emp.civilite, emp.nom_famille, emp.nom_usage, emp.prenoms, emp.date_naissance, emp.lieu_naissance, emp.nationalite,
          emp.numero_securite_sociale, emp.situation_famille, emp.adresse, emp.code_postal, emp.ville, emp.pays,
          emp.telephone_personnel, emp.telephone_domicile, emp.email_personnel, emp.contact_urgence_nom,
          emp.contact_urgence_prenom, emp.contact_urgence_lien, emp.contact_urgence_telephone, emp.matricule,
          emp.poste, emp.departement_id, emp.sous_departement_id, emp.date_embauche, emp.type_contrat, emp.date_fin_contrat, emp.temps_travail,
          emp.statut, emp.niveau_classification, emp.photo_url
        ];
        
        await connection.execute(query, values);
        console.log(`✅ Employé créé: ${emp.prenoms} ${emp.nom_famille} (${emp.matricule})`);
        
      } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
          console.log(`⚠️  Employé déjà existant: ${emp.prenoms} ${emp.nom_famille}`);
        } else {
          console.error(`❌ Erreur lors de la création de ${emp.prenoms} ${emp.nom_famille}:`, error.message);
        }
      }
    }
    
    // Vérifier le résultat final
    const [finalCount] = await connection.execute('SELECT COUNT(*) as total FROM tbl_employes');
    console.log(`📊 Nombre total d'employés après insertion: ${finalCount[0].total}`);
    
    console.log('✅ Initialisation des données d\'employés terminée!');
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Exécuter seulement si ce script est appelé directement
if (require.main === module) {
  initEmployeesData();
}

module.exports = { initEmployeesData, employeesData };

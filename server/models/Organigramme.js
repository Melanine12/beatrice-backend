const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'hotel_beatrice'
};

class Organigramme {
  constructor(data) {
    this.id = data.id;
    this.nom = data.nom;
    this.description = data.description;
    this.niveau = data.niveau;
    this.parent_id = data.parent_id;
    this.employe_id = data.employe_id;
    this.ordre = data.ordre;
    this.couleur = data.couleur;
    this.statut = data.statut;
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
    this.created_by = data.created_by;
    this.updated_by = data.updated_by;
    
    // Données de l'employé assigné
    this.employe = data.employe || null;
    
    // Enfants (pour la structure hiérarchique)
    this.enfants = data.enfants || [];
  }

  // Récupérer l'organigramme complet avec les employés assignés
  static async getOrganigrammeComplet() {
    const query = `
      SELECT 
        o.*,
        e.id as employe_id,
        e.civilite,
        e.nom_famille,
        e.prenoms,
        e.poste,
        e.photo_url,
        e.email_personnel,
        e.telephone_personnel
      FROM tbl_organigramme o
      LEFT JOIN tbl_employes e ON o.employe_id = e.id
      WHERE o.statut = 'Actif'
      ORDER BY o.niveau, o.ordre
    `;

    try {
      const connection = await mysql.createConnection(dbConfig);
      const [rows] = await connection.execute(query);
      await connection.end();

      // Construire la structure hiérarchique
      const organigramme = this.buildHierarchy(rows);
      return organigramme;
    } catch (error) {
      throw new Error(`Erreur lors de la récupération de l'organigramme: ${error.message}`);
    }
  }

  // Construire la structure hiérarchique
  static buildHierarchy(rows) {
    const map = {};
    const roots = [];

    // Créer un map de tous les éléments
    rows.forEach(row => {
      const item = new Organigramme({
        ...row,
        employe: row.employe_id ? {
          id: row.employe_id,
          civilite: row.civilite,
          nom_famille: row.nom_famille,
          prenoms: row.prenoms,
          poste: row.poste,
          photo_url: row.photo_url,
          email_personnel: row.email_personnel,
          telephone_personnel: row.telephone_personnel
        } : null,
        enfants: []
      });
      map[row.id] = item;
    });

    // Construire la hiérarchie
    rows.forEach(row => {
      if (row.parent_id === null) {
        roots.push(map[row.id]);
      } else if (map[row.parent_id]) {
        map[row.parent_id].enfants.push(map[row.id]);
      }
    });

    return roots;
  }

  // Assigner un employé à un poste de l'organigramme
  static async assignerEmploye(posteId, employeId, userId) {
    const query = `
      UPDATE tbl_organigramme 
      SET employe_id = ?, updated_by = ?, updated_at = NOW()
      WHERE id = ?
    `;

    try {
      const connection = await mysql.createConnection(dbConfig);
      const [result] = await connection.execute(query, [employeId, userId, posteId]);
      await connection.end();
      return result.affectedRows > 0;
    } catch (error) {
      throw new Error(`Erreur lors de l'assignation de l'employé: ${error.message}`);
    }
  }

  // Désassigner un employé d'un poste
  static async desassignerEmploye(posteId, userId) {
    const query = `
      UPDATE tbl_organigramme 
      SET employe_id = NULL, updated_by = ?, updated_at = NOW()
      WHERE id = ?
    `;

    try {
      const connection = await mysql.createConnection(dbConfig);
      const [result] = await connection.execute(query, [userId, posteId]);
      await connection.end();
      return result.affectedRows > 0;
    } catch (error) {
      throw new Error(`Erreur lors de la désassignation de l'employé: ${error.message}`);
    }
  }

  // Récupérer les employés disponibles (non assignés)
  static async getEmployesDisponibles() {
    const query = `
      SELECT 
        e.id,
        e.civilite,
        e.nom_famille,
        e.prenoms,
        e.poste,
        e.photo_url,
        e.email_personnel,
        e.telephone_personnel
      FROM tbl_employes e
      LEFT JOIN tbl_organigramme o ON e.id = o.employe_id
      WHERE e.statut = 'Actif' AND o.employe_id IS NULL
      ORDER BY e.nom_famille, e.prenoms
    `;

    try {
      const connection = await mysql.createConnection(dbConfig);
      const [rows] = await connection.execute(query);
      await connection.end();
      return rows;
    } catch (error) {
      throw new Error(`Erreur lors de la récupération des employés disponibles: ${error.message}`);
    }
  }

  // Récupérer un poste par ID
  static async getPosteById(id) {
    const query = `
      SELECT 
        o.*,
        e.id as employe_id,
        e.civilite,
        e.nom_famille,
        e.prenoms,
        e.poste,
        e.photo_url,
        e.email_personnel,
        e.telephone_personnel
      FROM tbl_organigramme o
      LEFT JOIN tbl_employes e ON o.employe_id = e.id
      WHERE o.id = ?
    `;

    try {
      const connection = await mysql.createConnection(dbConfig);
      const [rows] = await connection.execute(query, [id]);
      await connection.end();
      
      if (rows.length === 0) return null;
      
      const row = rows[0];
      return new Organigramme({
        ...row,
        employe: row.employe_id ? {
          id: row.employe_id,
          civilite: row.civilite,
          nom_famille: row.nom_famille,
          prenoms: row.prenoms,
          poste: row.poste,
          photo_url: row.photo_url,
          email_personnel: row.email_personnel,
          telephone_personnel: row.telephone_personnel
        } : null
      });
    } catch (error) {
      throw new Error(`Erreur lors de la récupération du poste: ${error.message}`);
    }
  }

  // Mettre à jour un poste
  static async updatePoste(id, data, userId) {
    const fields = [];
    const values = [];

    if (data.nom !== undefined) {
      fields.push('nom = ?');
      values.push(data.nom);
    }
    if (data.description !== undefined) {
      fields.push('description = ?');
      values.push(data.description);
    }
    if (data.couleur !== undefined) {
      fields.push('couleur = ?');
      values.push(data.couleur);
    }
    if (data.ordre !== undefined) {
      fields.push('ordre = ?');
      values.push(data.ordre);
    }

    if (fields.length === 0) return true;

    fields.push('updated_by = ?', 'updated_at = NOW()');
    values.push(userId, id);

    const query = `UPDATE tbl_organigramme SET ${fields.join(', ')} WHERE id = ?`;

    try {
      const connection = await mysql.createConnection(dbConfig);
      const [result] = await connection.execute(query, values);
      await connection.end();
      return result.affectedRows > 0;
    } catch (error) {
      throw new Error(`Erreur lors de la mise à jour du poste: ${error.message}`);
    }
  }
}

module.exports = Organigramme;

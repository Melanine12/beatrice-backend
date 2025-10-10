-- Tables pour les dépendants, sanctions et gratifications
-- Ces tables n'existent pas encore dans la base de données

-- Table des dépendants
CREATE TABLE IF NOT EXISTS `tbl_dependants` (
  `id` int NOT NULL AUTO_INCREMENT,
  `employe_id` int NOT NULL,
  `nom` varchar(100) NOT NULL,
  `prenom` varchar(100) NOT NULL,
  `type` enum('conjoint','enfant','parent','autre') NOT NULL,
  `date_naissance` date DEFAULT NULL,
  `lieu_naissance` varchar(200) DEFAULT NULL,
  `nationalite` varchar(100) DEFAULT NULL,
  `numero_securite_sociale` varchar(20) DEFAULT NULL,
  `situation_famille` varchar(50) DEFAULT NULL,
  `adresse` text DEFAULT NULL,
  `code_postal` varchar(10) DEFAULT NULL,
  `ville` varchar(100) DEFAULT NULL,
  `pays` varchar(100) DEFAULT NULL,
  `telephone` varchar(20) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `statut` enum('actif','inactif') NOT NULL DEFAULT 'actif',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_employe_id` (`employe_id`),
  KEY `idx_type` (`type`),
  KEY `idx_statut` (`statut`),
  CONSTRAINT `tbl_dependants_ibfk_1` FOREIGN KEY (`employe_id`) REFERENCES `tbl_employes` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Table des dépendants des employés';

-- Table des sanctions
CREATE TABLE IF NOT EXISTS `tbl_sanctions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `employe_id` int NOT NULL,
  `type` enum('avertissement','blame','mise_a_pied','licenciement') NOT NULL DEFAULT 'avertissement',
  `motif` text NOT NULL,
  `description` text DEFAULT NULL,
  `date_sanction` date NOT NULL,
  `duree` varchar(100) DEFAULT NULL,
  `montant_amende` decimal(10,2) DEFAULT NULL,
  `statut` enum('actif','annule','suspendu') NOT NULL DEFAULT 'actif',
  `sanction_par` int DEFAULT NULL,
  `date_fin_suspension` date DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_employe_id` (`employe_id`),
  KEY `idx_type` (`type`),
  KEY `idx_date_sanction` (`date_sanction`),
  KEY `idx_statut` (`statut`),
  KEY `idx_sanction_par` (`sanction_par`),
  CONSTRAINT `tbl_sanctions_ibfk_1` FOREIGN KEY (`employe_id`) REFERENCES `tbl_employes` (`id`) ON DELETE CASCADE,
  CONSTRAINT `tbl_sanctions_ibfk_2` FOREIGN KEY (`sanction_par`) REFERENCES `tbl_employes` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Table des sanctions appliquées aux employés';

-- Table des gratifications
CREATE TABLE IF NOT EXISTS `tbl_gratifications` (
  `id` int NOT NULL AUTO_INCREMENT,
  `employe_id` int NOT NULL,
  `type_gratification` enum('prime','bonus','commission','gratification_exceptionnelle','prime_performance','prime_anciennete') NOT NULL,
  `montant` decimal(10,2) NOT NULL,
  `motif` varchar(500) NOT NULL,
  `description` text DEFAULT NULL,
  `date_gratification` date NOT NULL,
  `periode` varchar(100) DEFAULT NULL,
  `statut` enum('actif','annule','suspendu') NOT NULL DEFAULT 'actif',
  `gratification_par` int DEFAULT NULL,
  `date_creation` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `date_modification` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_employe_id` (`employe_id`),
  KEY `idx_type_gratification` (`type_gratification`),
  KEY `idx_date_gratification` (`date_gratification`),
  KEY `idx_statut` (`statut`),
  KEY `idx_gratification_par` (`gratification_par`),
  CONSTRAINT `tbl_gratifications_ibfk_1` FOREIGN KEY (`employe_id`) REFERENCES `tbl_employes` (`id`) ON DELETE CASCADE,
  CONSTRAINT `tbl_gratifications_ibfk_2` FOREIGN KEY (`gratification_par`) REFERENCES `tbl_employes` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Table des gratifications des employés';

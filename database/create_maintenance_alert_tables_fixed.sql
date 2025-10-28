-- Script SQL pour créer les tables tbl_suivi_maintenances et tbl_alertes

-- Table des suivis de maintenance
CREATE TABLE IF NOT EXISTS `tbl_suivi_maintenances` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `titre` varchar(255) NOT NULL,
  `description` text,
  `type` enum('Maintenance','Réparation','Inspection','Préventive','Corrective') NOT NULL DEFAULT 'Maintenance',
  `priorite` enum('Basse','Normale','Haute','Urgente') NOT NULL DEFAULT 'Normale',
  `statut` enum('Planifiée','En cours','En attente','Terminée','Annulée') NOT NULL DEFAULT 'Planifiée',
  `responsable_id` int(11) DEFAULT NULL,
  `chambre_id` int(11) DEFAULT NULL,
  `createur_id` int(11) NOT NULL,
  `date_planifiee` date DEFAULT NULL,
  `date_debut` date DEFAULT NULL,
  `date_fin` date DEFAULT NULL,
  `cout_estime` decimal(10,2) DEFAULT NULL,
  `cout_reel` decimal(10,2) DEFAULT NULL,
  `materiel_utilise` text,
  `notes` text,
  `date_creation` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `date_modification` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_suivi_maintenance_responsable` (`responsable_id`),
  KEY `fk_suivi_maintenance_chambre` (`chambre_id`),
  KEY `fk_suivi_maintenance_createur` (`createur_id`),
  KEY `idx_suivi_maintenance_statut` (`statut`),
  KEY `idx_suivi_maintenance_priorite` (`priorite`),
  KEY `idx_suivi_maintenance_type` (`type`),
  KEY `idx_suivi_maintenance_date_planifiee` (`date_planifiee`),
  CONSTRAINT `fk_suivi_maintenance_responsable` FOREIGN KEY (`responsable_id`) REFERENCES `tbl_utilisateurs` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_suivi_maintenance_chambre` FOREIGN KEY (`chambre_id`) REFERENCES `tbl_chambres` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_suivi_maintenance_createur` FOREIGN KEY (`createur_id`) REFERENCES `tbl_utilisateurs` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table des alertes (version simplifiée compatible avec le système existant)
CREATE TABLE IF NOT EXISTS `tbl_alertes` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `titre` varchar(255) NOT NULL,
  `message` text NOT NULL,
  `type` enum('info','warning','error','success') NOT NULL DEFAULT 'info',
  `priorite` enum('basse','normale','haute','critique') NOT NULL DEFAULT 'normale',
  `statut` enum('active','resolue','archivee') NOT NULL DEFAULT 'active',
  `utilisateur_id` int(11) DEFAULT NULL,
  `date_echeance` datetime DEFAULT NULL,
  `created_by` int(11) DEFAULT NULL,
  `updated_by` int(11) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_alerte_utilisateur` (`utilisateur_id`),
  KEY `fk_alerte_created_by` (`created_by`),
  KEY `fk_alerte_updated_by` (`updated_by`),
  KEY `idx_alerte_statut` (`statut`),
  KEY `idx_alerte_priorite` (`priorite`),
  KEY `idx_alerte_type` (`type`),
  KEY `idx_alerte_date_creation` (`created_at`),
  CONSTRAINT `fk_alerte_utilisateur` FOREIGN KEY (`utilisateur_id`) REFERENCES `tbl_utilisateurs` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_alerte_created_by` FOREIGN KEY (`created_by`) REFERENCES `tbl_utilisateurs` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_alerte_updated_by` FOREIGN KEY (`updated_by`) REFERENCES `tbl_utilisateurs` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Index pour optimiser les requêtes fréquentes
CREATE INDEX `idx_suivi_maintenance_composite` ON `tbl_suivi_maintenances` (`statut`, `date_planifiee`, `priorite`);
CREATE INDEX `idx_alerte_composite` ON `tbl_alertes` (`utilisateur_id`, `statut`, `created_at`);

-- Triggers pour mettre à jour automatiquement la date de modification
DELIMITER $$

CREATE TRIGGER `tr_suivi_maintenance_update` 
BEFORE UPDATE ON `tbl_suivi_maintenances`
FOR EACH ROW
BEGIN
    SET NEW.date_modification = NOW();
END$$

DELIMITER ;

-- Insertion de données de test (optionnel)
INSERT INTO `tbl_suivi_maintenances` (`titre`, `description`, `type`, `priorite`, `statut`, `createur_id`, `date_planifiee`) VALUES
('Maintenance climatiseur chambre 101', 'Réparation du système de climatisation', 'Réparation', 'Haute', 'Planifiée', 1, '2024-01-15'),
('Inspection mensuelle ascenseur', 'Contrôle de sécurité et maintenance préventive', 'Inspection', 'Normale', 'Planifiée', 1, '2024-01-20'),
('Réparation fuite d\'eau cuisine', 'Réparation urgente de la fuite dans la cuisine principale', 'Réparation', 'Urgente', 'En cours', 1, '2024-01-10');

-- Vue pour les maintenances en retard
CREATE VIEW `vw_maintenances_en_retard` AS
SELECT 
    sm.*,
    u_responsable.prenom as responsable_prenom,
    u_responsable.nom as responsable_nom,
    u_createur.prenom as createur_prenom,
    u_createur.nom as createur_nom,
    c.numero as chambre_numero,
    c.type as chambre_type,
    DATEDIFF(CURDATE(), sm.date_planifiee) as jours_retard
FROM `tbl_suivi_maintenances` sm
LEFT JOIN `tbl_utilisateurs` u_responsable ON sm.responsable_id = u_responsable.id
LEFT JOIN `tbl_utilisateurs` u_createur ON sm.createur_id = u_createur.id
LEFT JOIN `tbl_chambres` c ON sm.chambre_id = c.id
WHERE sm.date_planifiee < CURDATE() 
AND sm.statut NOT IN ('Terminée', 'Annulée');

-- Vue pour les maintenances prévues bientôt
CREATE VIEW `vw_maintenances_prevues` AS
SELECT 
    sm.*,
    u_responsable.prenom as responsable_prenom,
    u_responsable.nom as responsable_nom,
    u_createur.prenom as createur_prenom,
    u_createur.nom as createur_nom,
    c.numero as chambre_numero,
    c.type as chambre_type,
    DATEDIFF(sm.date_planifiee, CURDATE()) as jours_restants
FROM `tbl_suivi_maintenances` sm
LEFT JOIN `tbl_utilisateurs` u_responsable ON sm.responsable_id = u_responsable.id
LEFT JOIN `tbl_utilisateurs` u_createur ON sm.createur_id = u_createur.id
LEFT JOIN `tbl_chambres` c ON sm.chambre_id = c.id
WHERE sm.date_planifiee BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 7 DAY)
AND sm.statut NOT IN ('Terminée', 'Annulée');

-- Procédure stockée pour créer des alertes automatiques
DELIMITER $$

CREATE PROCEDURE `sp_creer_alertes_maintenances`()
BEGIN
    DECLARE done INT DEFAULT FALSE;
    DECLARE maintenance_id INT;
    DECLARE maintenance_titre VARCHAR(255);
    DECLARE maintenance_date_planifiee DATE;
    DECLARE maintenance_responsable_id INT;
    DECLARE maintenance_createur_id INT;
    DECLARE jours_retard INT;
    DECLARE jours_restants INT;
    
    -- Curseur pour les maintenances en retard
    DECLARE cur_overdue CURSOR FOR
        SELECT id, titre, date_planifiee, responsable_id, createur_id
        FROM tbl_suivi_maintenances
        WHERE date_planifiee < CURDATE() 
        AND statut NOT IN ('Terminée', 'Annulée')
        AND id NOT IN (
            SELECT DISTINCT CAST(SUBSTRING(message, LOCATE('maintenance #', message) + 13, 10) AS UNSIGNED)
            FROM tbl_alertes 
            WHERE type = 'error' 
            AND message LIKE '%maintenance en retard%'
            AND statut = 'active'
        );
    
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;
    
    -- Traiter les maintenances en retard
    OPEN cur_overdue;
    read_loop: LOOP
        FETCH cur_overdue INTO maintenance_id, maintenance_titre, maintenance_date_planifiee, maintenance_responsable_id, maintenance_createur_id;
        IF done THEN
            LEAVE read_loop;
        END IF;
        
        SET jours_retard = DATEDIFF(CURDATE(), maintenance_date_planifiee);
        
        -- Créer alerte pour le responsable
        IF maintenance_responsable_id IS NOT NULL THEN
            INSERT INTO tbl_alertes (titre, message, type, priorite, utilisateur_id, statut, created_by)
            VALUES (
                'Maintenance en retard',
                CONCAT('La maintenance "', maintenance_titre, '" est en retard depuis le ', DATE_FORMAT(maintenance_date_planifiee, '%d/%m/%Y'), ' (maintenance #', maintenance_id, ')'),
                'error',
                'haute',
                maintenance_responsable_id,
                'active',
                1
            );
        END IF;
        
        -- Créer alerte pour les superviseurs techniques
        INSERT INTO tbl_alertes (titre, message, type, priorite, utilisateur_id, statut, created_by)
        SELECT 
            'Maintenance en retard',
            CONCAT('La maintenance "', maintenance_titre, '" est en retard depuis le ', DATE_FORMAT(maintenance_date_planifiee, '%d/%m/%Y'), ' (maintenance #', maintenance_id, ')'),
            'error',
            'haute',
            id,
            'active',
            1
        FROM tbl_utilisateurs 
        WHERE role = 'Superviseur Technique' 
        AND id NOT IN (maintenance_responsable_id, maintenance_createur_id);
        
    END LOOP;
    CLOSE cur_overdue;
    
    -- Réinitialiser done pour le prochain curseur
    SET done = FALSE;
    
    -- Curseur pour les maintenances prévues bientôt
    DECLARE cur_due_soon CURSOR FOR
        SELECT id, titre, date_planifiee, responsable_id, createur_id
        FROM tbl_suivi_maintenances
        WHERE date_planifiee BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 7 DAY)
        AND statut NOT IN ('Terminée', 'Annulée')
        AND id NOT IN (
            SELECT DISTINCT CAST(SUBSTRING(message, LOCATE('maintenance #', message) + 13, 10) AS UNSIGNED)
            FROM tbl_alertes 
            WHERE type = 'warning' 
            AND message LIKE '%maintenance prévue%'
            AND statut = 'active'
        );
    
    -- Traiter les maintenances prévues bientôt
    OPEN cur_due_soon;
    read_loop2: LOOP
        FETCH cur_due_soon INTO maintenance_id, maintenance_titre, maintenance_date_planifiee, maintenance_responsable_id, maintenance_createur_id;
        IF done THEN
            LEAVE read_loop2;
        END IF;
        
        SET jours_restants = DATEDIFF(maintenance_date_planifiee, CURDATE());
        
        -- Créer alerte pour le responsable
        IF maintenance_responsable_id IS NOT NULL THEN
            INSERT INTO tbl_alertes (titre, message, type, priorite, utilisateur_id, statut, created_by)
            VALUES (
                'Maintenance prévue bientôt',
                CONCAT('La maintenance "', maintenance_titre, '" est prévue pour le ', DATE_FORMAT(maintenance_date_planifiee, '%d/%m/%Y'), ' (maintenance #', maintenance_id, ')'),
                'warning',
                CASE WHEN jours_restants <= 1 THEN 'haute' ELSE 'normale' END,
                maintenance_responsable_id,
                'active',
                1
            );
        END IF;
        
        -- Créer alerte pour les superviseurs techniques
        INSERT INTO tbl_alertes (titre, message, type, priorite, utilisateur_id, statut, created_by)
        SELECT 
            'Maintenance prévue bientôt',
            CONCAT('La maintenance "', maintenance_titre, '" est prévue pour le ', DATE_FORMAT(maintenance_date_planifiee, '%d/%m/%Y'), ' (maintenance #', maintenance_id, ')'),
            'warning',
            CASE WHEN jours_restants <= 1 THEN 'haute' ELSE 'normale' END,
            id,
            'active',
            1
        FROM tbl_utilisateurs 
        WHERE role = 'Superviseur Technique' 
        AND id NOT IN (maintenance_responsable_id, maintenance_createur_id);
        
    END LOOP;
    CLOSE cur_due_soon;
    
END$$

DELIMITER ;

-- Événement pour exécuter automatiquement la procédure toutes les heures
-- (Décommentez si vous voulez utiliser les événements MySQL)
-- CREATE EVENT IF NOT EXISTS `ev_alertes_maintenances`
-- ON SCHEDULE EVERY 1 HOUR
-- STARTS CURRENT_TIMESTAMP
-- DO
--   CALL sp_creer_alertes_maintenances();

-- Message de confirmation
SELECT 'Tables tbl_suivi_maintenances et tbl_alertes créées avec succès!' as message;

-- Script SQL pour créer uniquement les tables tbl_suivi_maintenances et tbl_alertes
-- (tbl_chambres existe déjà)

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
  `date_modification` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_maintenance_responsable` (`responsable_id`),
  KEY `idx_maintenance_chambre` (`chambre_id`),
  KEY `idx_maintenance_createur` (`createur_id`),
  KEY `idx_maintenance_statut` (`statut`),
  KEY `idx_maintenance_date_planifiee` (`date_planifiee`),
  CONSTRAINT `fk_maintenance_responsable` FOREIGN KEY (`responsable_id`) REFERENCES `tbl_utilisateurs` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_maintenance_chambre` FOREIGN KEY (`chambre_id`) REFERENCES `tbl_chambres` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_maintenance_createur` FOREIGN KEY (`createur_id`) REFERENCES `tbl_utilisateurs` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Table des suivis de maintenance';

-- Table des alertes
CREATE TABLE IF NOT EXISTS `tbl_alertes` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `type` enum('Maintenance','Stock','Paiement','Problème','Système') NOT NULL,
  `titre` varchar(255) NOT NULL,
  `message` text NOT NULL,
  `priorite` enum('Basse','Normale','Haute','Urgente') NOT NULL DEFAULT 'Normale',
  `statut` enum('Non lue','Lue','Archivée') NOT NULL DEFAULT 'Non lue',
  `destinataire_id` int(11) DEFAULT NULL,
  `maintenance_id` int(11) DEFAULT NULL,
  `donnees_extra` json DEFAULT NULL,
  `date_creation` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `date_lecture` datetime DEFAULT NULL,
  `date_archivage` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_alerte_destinataire` (`destinataire_id`),
  KEY `idx_alerte_maintenance` (`maintenance_id`),
  KEY `idx_alerte_statut` (`statut`),
  KEY `idx_alerte_type` (`type`),
  KEY `idx_alerte_date_creation` (`date_creation`),
  CONSTRAINT `fk_alerte_destinataire` FOREIGN KEY (`destinataire_id`) REFERENCES `tbl_utilisateurs` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_alerte_maintenance` FOREIGN KEY (`maintenance_id`) REFERENCES `tbl_suivi_maintenances` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Table des alertes système';

-- Données d'exemple pour les maintenances
INSERT INTO `tbl_suivi_maintenances` (`titre`, `description`, `type`, `priorite`, `statut`, `createur_id`, `date_planifiee`) VALUES
('Maintenance climatiseur chambre 1001', 'Réparation du système de climatisation', 'Réparation', 'Haute', 'Planifiée', 1, '2024-01-15'),
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

-- Supprimer les triggers existants s'ils existent
DROP TRIGGER IF EXISTS `tr_suivi_maintenance_update`;
DROP TRIGGER IF EXISTS `tr_alerte_read`;

-- Créer les triggers avec la syntaxe correcte
DELIMITER $$

CREATE TRIGGER `tr_suivi_maintenance_update` 
BEFORE UPDATE ON `tbl_suivi_maintenances`
FOR EACH ROW
BEGIN
    SET NEW.date_modification = CURRENT_TIMESTAMP;
END$$

CREATE TRIGGER `tr_alerte_read` 
BEFORE UPDATE ON `tbl_alertes`
FOR EACH ROW
BEGIN
    IF NEW.statut = 'Lue' AND OLD.statut = 'Non lue' THEN
        SET NEW.date_lecture = CURRENT_TIMESTAMP;
    END IF;
    
    IF NEW.statut = 'Archivée' AND OLD.statut != 'Archivée' THEN
        SET NEW.date_archivage = CURRENT_TIMESTAMP;
    END IF;
END$$

DELIMITER ;

-- Supprimer la procédure existante si elle existe
DROP PROCEDURE IF EXISTS `sp_creer_alertes_maintenances`;

-- Créer la procédure stockée pour créer des alertes automatiques
DELIMITER $$

CREATE PROCEDURE `sp_creer_alertes_maintenances`()
BEGIN
    DECLARE done INT DEFAULT FALSE;
    DECLARE maintenance_id INT;
    DECLARE maintenance_titre VARCHAR(255);
    DECLARE maintenance_responsable_id INT;
    DECLARE jours_retard INT;
    
    -- Curseur pour les maintenances en retard
    DECLARE cur_maintenances CURSOR FOR 
        SELECT sm.id, sm.titre, sm.responsable_id, DATEDIFF(CURDATE(), sm.date_planifiee) as jours_retard
        FROM tbl_suivi_maintenances sm
        WHERE sm.date_planifiee < CURDATE() 
        AND sm.statut NOT IN ('Terminée', 'Annulée')
        AND NOT EXISTS (
            SELECT 1 FROM tbl_alertes a 
            WHERE a.maintenance_id = sm.id 
            AND a.type = 'Maintenance' 
            AND a.statut = 'Non lue'
        );
    
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;
    
    OPEN cur_maintenances;
    
    read_loop: LOOP
        FETCH cur_maintenances INTO maintenance_id, maintenance_titre, maintenance_responsable_id, jours_retard;
        IF done THEN
            LEAVE read_loop;
        END IF;
        
        -- Créer une alerte pour la maintenance en retard
        INSERT INTO tbl_alertes (type, titre, message, priorite, destinataire_id, maintenance_id, donnees_extra)
        VALUES (
            'Maintenance',
            CONCAT('Maintenance en retard: ', maintenance_titre),
            CONCAT('La maintenance "', maintenance_titre, '" est en retard de ', jours_retard, ' jour(s).'),
            CASE 
                WHEN jours_retard > 7 THEN 'Urgente'
                WHEN jours_retard > 3 THEN 'Haute'
                ELSE 'Normale'
            END,
            maintenance_responsable_id,
            maintenance_id,
            JSON_OBJECT('jours_retard', jours_retard)
        );
        
    END LOOP;
    
    CLOSE cur_maintenances;
END$$

DELIMITER ;

-- Index supplémentaires pour optimiser les performances
CREATE INDEX IF NOT EXISTS `idx_maintenance_priorite` ON `tbl_suivi_maintenances` (`priorite`);
CREATE INDEX IF NOT EXISTS `idx_maintenance_type` ON `tbl_suivi_maintenances` (`type`);
CREATE INDEX IF NOT EXISTS `idx_alerte_priorite` ON `tbl_alertes` (`priorite`);
CREATE INDEX IF NOT EXISTS `idx_alerte_date_lecture` ON `tbl_alertes` (`date_lecture`);

-- Commentaires sur les tables
ALTER TABLE `tbl_suivi_maintenances` COMMENT = 'Table des suivis de maintenance et réparations';
ALTER TABLE `tbl_alertes` COMMENT = 'Table des alertes système pour maintenance, stock, paiements et problèmes';

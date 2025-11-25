-- Script SQL sécurisé pour ajouter le champ etage à tbl_inventaire
-- Ce script utilise des procédures stockées pour éviter les erreurs si la colonne existe déjà

DELIMITER $$

-- Procédure pour ajouter la colonne etage si elle n'existe pas
DROP PROCEDURE IF EXISTS AddEtageColumnIfNotExists$$
CREATE PROCEDURE AddEtageColumnIfNotExists()
BEGIN
    DECLARE column_exists INT DEFAULT 0;
    
    -- Vérifier si la colonne existe
    SELECT COUNT(*) INTO column_exists
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'tbl_inventaire'
      AND COLUMN_NAME = 'etage';
    
    -- Ajouter la colonne si elle n'existe pas
    IF column_exists = 0 THEN
        ALTER TABLE `tbl_inventaire`
          ADD COLUMN `etage` INT NULL DEFAULT NULL 
          AFTER `emplacement_id`;
        SELECT 'Column etage added successfully' AS result;
    ELSE
        SELECT 'Column etage already exists' AS result;
    END IF;
END$$

-- Procédure pour créer l'index si il n'existe pas
DROP PROCEDURE IF EXISTS AddEtageIndexIfNotExists$$
CREATE PROCEDURE AddEtageIndexIfNotExists()
BEGIN
    DECLARE index_exists INT DEFAULT 0;
    
    -- Vérifier si l'index existe
    SELECT COUNT(*) INTO index_exists
    FROM INFORMATION_SCHEMA.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'tbl_inventaire'
      AND INDEX_NAME = 'idx_inventaire_etage';
    
    -- Créer l'index si il n'existe pas
    IF index_exists = 0 THEN
        CREATE INDEX `idx_inventaire_etage` ON `tbl_inventaire`(`etage`);
        SELECT 'Index idx_inventaire_etage created successfully' AS result;
    ELSE
        SELECT 'Index idx_inventaire_etage already exists' AS result;
    END IF;
END$$

DELIMITER ;

-- Exécuter les procédures
CALL AddEtageColumnIfNotExists();
CALL AddEtageIndexIfNotExists();

-- Modifier la colonne pour s'assurer qu'elle est nullable avec DEFAULT NULL
ALTER TABLE `tbl_inventaire`
  MODIFY COLUMN `etage` INT NULL DEFAULT NULL COMMENT 'Étage où se trouve l\'article';

-- Nettoyer les procédures temporaires
DROP PROCEDURE IF EXISTS AddEtageColumnIfNotExists;
DROP PROCEDURE IF EXISTS AddEtageIndexIfNotExists;


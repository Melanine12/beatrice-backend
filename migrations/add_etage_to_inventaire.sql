-- Ajout du champ etage à la table tbl_inventaire
-- Vérifier si la colonne existe déjà
SET @col_exists = (
  SELECT COUNT(*) 
  FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'tbl_inventaire' 
    AND COLUMN_NAME = 'etage'
);

-- Si la colonne n'existe pas, l'ajouter
SET @sql = IF(@col_exists = 0,
  'ALTER TABLE `tbl_inventaire` ADD COLUMN `etage` INT NULL DEFAULT NULL AFTER `emplacement_id`',
  'SELECT "Column etage already exists" AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- S'assurer que la colonne est nullable avec DEFAULT NULL
ALTER TABLE `tbl_inventaire`
  MODIFY COLUMN `etage` INT NULL DEFAULT NULL COMMENT 'Étage où se trouve l\'article';

-- Ajout d'un index pour améliorer les performances des requêtes par étage
-- Vérifier si l'index existe déjà
SET @idx_exists = (
  SELECT COUNT(*) 
  FROM INFORMATION_SCHEMA.STATISTICS 
  WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'tbl_inventaire' 
    AND INDEX_NAME = 'idx_inventaire_etage'
);

-- Si l'index n'existe pas, le créer
SET @sql_idx = IF(@idx_exists = 0,
  'CREATE INDEX `idx_inventaire_etage` ON `tbl_inventaire`(`etage`)',
  'SELECT "Index idx_inventaire_etage already exists" AS message'
);
PREPARE stmt_idx FROM @sql_idx;
EXECUTE stmt_idx;
DEALLOCATE PREPARE stmt_idx;


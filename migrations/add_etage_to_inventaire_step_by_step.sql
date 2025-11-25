-- Script SQL étape par étape pour ajouter le champ etage à tbl_inventaire
-- Exécutez chaque commande séparément et ignorez les erreurs "Duplicate" si elles apparaissent

-- ÉTAPE 1: Ajouter la colonne etage (si elle n'existe pas encore)
-- Si vous obtenez l'erreur "Duplicate column name 'etage'", la colonne existe déjà, passez à l'étape 2
ALTER TABLE `tbl_inventaire`
  ADD COLUMN `etage` INT NULL DEFAULT NULL 
  AFTER `emplacement_id`;

-- ÉTAPE 2: Modifier la colonne pour s'assurer qu'elle est nullable avec DEFAULT NULL
-- Cette commande fonctionne que la colonne existe déjà ou non
ALTER TABLE `tbl_inventaire`
  MODIFY COLUMN `etage` INT NULL DEFAULT NULL COMMENT 'Étage où se trouve l\'article';

-- ÉTAPE 3: Ajouter un index pour améliorer les performances
-- Si vous obtenez l'erreur "Duplicate key name 'idx_inventaire_etage'", l'index existe déjà, c'est OK
CREATE INDEX `idx_inventaire_etage` ON `tbl_inventaire`(`etage`);


-- Script SQL simple pour ajouter le champ etage à tbl_inventaire
-- Exécuter ce script pour ajouter ou modifier la colonne etage

-- Étape 1: Vérifier si la colonne existe et l'ajouter si nécessaire
-- Si la colonne n'existe pas, cette commande l'ajoutera
-- Si elle existe déjà, vous obtiendrez une erreur "Duplicate column name" - c'est normal, passez à l'étape 2

ALTER TABLE `tbl_inventaire`
  ADD COLUMN `etage` INT NULL DEFAULT NULL 
  AFTER `emplacement_id`;

-- Étape 2: Modifier la colonne pour s'assurer qu'elle est nullable avec DEFAULT NULL
-- Exécutez cette commande même si vous avez eu l'erreur "Duplicate column name" à l'étape 1
ALTER TABLE `tbl_inventaire`
  MODIFY COLUMN `etage` INT NULL DEFAULT NULL COMMENT 'Étage où se trouve l\'article';

-- Étape 3: Ajouter un index pour améliorer les performances
-- Si l'index existe déjà, vous obtiendrez une erreur "Duplicate key name" - c'est normal
CREATE INDEX `idx_inventaire_etage` ON `tbl_inventaire`(`etage`);


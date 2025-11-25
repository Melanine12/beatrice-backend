-- Script pour corriger la colonne etage dans tbl_inventaire (MySQL compatible)
-- La colonne existe déjà mais est définie comme NOT NULL sans valeur par défaut
-- Ce script la rend nullable avec DEFAULT NULL

-- Modifier la colonne etage pour qu'elle soit nullable avec DEFAULT NULL
ALTER TABLE `tbl_inventaire`
  MODIFY COLUMN `etage` INT NULL DEFAULT NULL COMMENT 'Étage où se trouve l\'article';

-- Vérifier si l'index existe avant de le créer (pour MySQL qui ne supporte pas IF NOT EXISTS)
-- Si vous obtenez une erreur "Duplicate key name", l'index existe déjà - c'est normal
-- Exécutez cette commande séparément si nécessaire
CREATE INDEX `idx_inventaire_etage` ON `tbl_inventaire`(`etage`);


-- Script pour corriger la colonne etage dans tbl_inventaire
-- La colonne existe déjà mais est définie comme NOT NULL sans valeur par défaut
-- Ce script la rend nullable avec DEFAULT NULL

-- Modifier la colonne etage pour qu'elle soit nullable avec DEFAULT NULL
ALTER TABLE `tbl_inventaire`
  MODIFY COLUMN `etage` INT NULL DEFAULT NULL COMMENT 'Étage où se trouve l\'article';

-- Ajouter un index si il n'existe pas déjà (optionnel, pour améliorer les performances)
-- Si l'index existe déjà, cette commande échouera - c'est normal, ignorez l'erreur
CREATE INDEX IF NOT EXISTS `idx_inventaire_etage` ON `tbl_inventaire`(`etage`);


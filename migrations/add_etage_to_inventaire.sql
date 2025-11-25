-- Ajout du champ etage à la table tbl_inventaire
ALTER TABLE `tbl_inventaire`
  ADD COLUMN `etage` INT NULL 
  AFTER `emplacement_id`;

-- Ajout d'un index pour améliorer les performances des requêtes par étage
CREATE INDEX `idx_inventaire_etage` ON `tbl_inventaire`(`etage`);

-- Commentaire pour documenter le champ
ALTER TABLE `tbl_inventaire` 
  MODIFY COLUMN `etage` INT NULL COMMENT 'Étage où se trouve l\'article';


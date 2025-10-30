-- Ajout du champ employeur_direct à la table tbl_employes
ALTER TABLE `tbl_employes`
  ADD COLUMN `employeur_direct` VARCHAR(50) NULL AFTER `situation_famille`;

-- Valeur par défaut facultative
-- UPDATE `tbl_employes` SET `employeur_direct` = 'Beatrice Hotel' WHERE `employeur_direct` IS NULL;

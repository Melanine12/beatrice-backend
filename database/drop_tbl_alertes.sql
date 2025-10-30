-- Safe drop of tbl_alertes and related artifacts
SET FOREIGN_KEY_CHECKS = 0;

-- Drop triggers if they exist (common names used in prior scripts)
DROP TRIGGER IF EXISTS tr_alerts_before_update;
DROP TRIGGER IF EXISTS tr_suivi_maintenance_update_alerts;

-- Drop indexes that may have been created explicitly
-- (Dropping table will drop its indexes, but included for clarity)
-- DROP INDEX idx_alerte_priorite ON tbl_alertes;
-- DROP INDEX idx_alerte_date_lecture ON tbl_alertes;
-- DROP INDEX idx_alerte_composite ON tbl_alertes;

-- Finally drop the table
DROP TABLE IF EXISTS tbl_alertes;

SET FOREIGN_KEY_CHECKS = 1;

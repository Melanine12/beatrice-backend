-- Add encaissement_caisse_id column to tbl_encaissements
ALTER TABLE tbl_encaissements 
ADD COLUMN encaissement_caisse_id INT NULL 
AFTER reference;

-- Add foreign key constraint
ALTER TABLE tbl_encaissements 
ADD CONSTRAINT fk_encaissement_caisse 
FOREIGN KEY (encaissement_caisse_id) 
REFERENCES tbl_caisses(id);

-- Add index for performance
CREATE INDEX idx_encaissement_caisse_id 
ON tbl_encaissements(encaissement_caisse_id);

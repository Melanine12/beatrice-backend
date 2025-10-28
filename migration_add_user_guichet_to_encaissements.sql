-- Add user_guichet_id column to tbl_encaissements
ALTER TABLE tbl_encaissements 
ADD COLUMN user_guichet_id INT NULL 
AFTER encaissement_caisse_id;

-- Add foreign key constraint to tbl_utilisateurs
ALTER TABLE tbl_encaissements 
ADD CONSTRAINT fk_encaissement_user_guichet 
FOREIGN KEY (user_guichet_id) 
REFERENCES tbl_utilisateurs(id);

-- Add index for performance
CREATE INDEX idx_encaissement_user_guichet_id 
ON tbl_encaissements(user_guichet_id);

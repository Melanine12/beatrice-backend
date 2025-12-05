-- Migration pour créer les tables de chat
-- Tables: tbl_conversations et tbl_messages

-- Table des conversations
CREATE TABLE IF NOT EXISTS `tbl_conversations` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `user1_id` INT(11) NOT NULL COMMENT 'ID du premier utilisateur',
  `user2_id` INT(11) NOT NULL COMMENT 'ID du deuxième utilisateur',
  `last_message_id` INT(11) DEFAULT NULL COMMENT 'ID du dernier message',
  `last_message_at` DATETIME DEFAULT NULL COMMENT 'Date du dernier message',
  `user1_unread_count` INT(11) DEFAULT 0 COMMENT 'Nombre de messages non lus pour user1',
  `user2_unread_count` INT(11) DEFAULT 0 COMMENT 'Nombre de messages non lus pour user2',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_conversation` (`user1_id`, `user2_id`),
  KEY `idx_user1_id` (`user1_id`),
  KEY `idx_user2_id` (`user2_id`),
  KEY `idx_last_message_at` (`last_message_at`),
  CONSTRAINT `fk_conversation_user1` FOREIGN KEY (`user1_id`) REFERENCES `tbl_utilisateurs` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_conversation_user2` FOREIGN KEY (`user2_id`) REFERENCES `tbl_utilisateurs` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table des messages
CREATE TABLE IF NOT EXISTS `tbl_messages` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `conversation_id` INT(11) NOT NULL COMMENT 'ID de la conversation',
  `sender_id` INT(11) NOT NULL COMMENT 'ID de l\'expéditeur',
  `receiver_id` INT(11) NOT NULL COMMENT 'ID du destinataire',
  `content` TEXT NOT NULL COMMENT 'Contenu du message',
  `message_type` ENUM('text', 'image', 'file', 'system') DEFAULT 'text' COMMENT 'Type de message',
  `is_read` TINYINT(1) DEFAULT 0 COMMENT 'Message lu ou non',
  `read_at` DATETIME DEFAULT NULL COMMENT 'Date de lecture',
  `file_url` VARCHAR(500) DEFAULT NULL COMMENT 'URL du fichier si message_type est file ou image',
  `file_name` VARCHAR(255) DEFAULT NULL COMMENT 'Nom du fichier',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_conversation_id` (`conversation_id`),
  KEY `idx_sender_id` (`sender_id`),
  KEY `idx_receiver_id` (`receiver_id`),
  KEY `idx_created_at` (`created_at`),
  KEY `idx_is_read` (`is_read`),
  CONSTRAINT `fk_message_conversation` FOREIGN KEY (`conversation_id`) REFERENCES `tbl_conversations` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_message_sender` FOREIGN KEY (`sender_id`) REFERENCES `tbl_utilisateurs` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_message_receiver` FOREIGN KEY (`receiver_id`) REFERENCES `tbl_utilisateurs` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Ajouter la contrainte pour last_message_id après la création de la table messages
ALTER TABLE `tbl_conversations`
  ADD CONSTRAINT `fk_conversation_last_message` FOREIGN KEY (`last_message_id`) REFERENCES `tbl_messages` (`id`) ON DELETE SET NULL;


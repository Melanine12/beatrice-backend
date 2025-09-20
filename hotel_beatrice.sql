-- MySQL dump 10.13  Distrib 9.0.1, for macos14 (arm64)
--
-- Host: localhost    Database: hotel_beatrice
-- ------------------------------------------------------
-- Server version	9.0.1

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `bons_de_menage`
--

DROP TABLE IF EXISTS `bons_de_menage`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `bons_de_menage` (
  `id` int NOT NULL AUTO_INCREMENT,
  `utilisateur_id` int NOT NULL,
  `nom_utilisateur` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `numero_chambre_espace` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `chambre_id` int DEFAULT NULL,
  `etat_matin` enum('Propre','Sale','Très sale','En désordre','Rien à signaler') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Rien à signaler',
  `designation` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `heure_entree` time NOT NULL,
  `heure_sortie` time DEFAULT NULL,
  `etat_chambre_apres_entretien` enum('Parfait','Bon','Moyen','Problème signalé') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Bon',
  `observation` text COLLATE utf8mb4_unicode_ci,
  `shift` enum('Matin','Après-midi','Soir','Nuit') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Matin',
  `date_creation` datetime DEFAULT CURRENT_TIMESTAMP,
  `heure_creation` time DEFAULT (curtime()),
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `created_by` int DEFAULT NULL,
  `updated_by` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_utilisateur_id` (`utilisateur_id`),
  KEY `idx_nom_utilisateur` (`nom_utilisateur`),
  KEY `idx_numero_chambre_espace` (`numero_chambre_espace`),
  KEY `idx_etat_matin` (`etat_matin`),
  KEY `idx_etat_chambre_apres_entretien` (`etat_chambre_apres_entretien`),
  KEY `idx_shift` (`shift`),
  KEY `idx_date_creation` (`date_creation`),
  KEY `idx_heure_entree` (`heure_entree`),
  KEY `idx_heure_sortie` (`heure_sortie`),
  KEY `fk_bons_menage_created_by` (`created_by`),
  KEY `fk_bons_menage_updated_by` (`updated_by`),
  KEY `idx_bons_menage_chambre_id` (`chambre_id`),
  CONSTRAINT `fk_bons_menage_chambre` FOREIGN KEY (`chambre_id`) REFERENCES `tbl_chambres` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_bons_menage_created_by` FOREIGN KEY (`created_by`) REFERENCES `tbl_utilisateurs` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_bons_menage_updated_by` FOREIGN KEY (`updated_by`) REFERENCES `tbl_utilisateurs` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_bons_menage_utilisateur` FOREIGN KEY (`utilisateur_id`) REFERENCES `tbl_utilisateurs` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Table des bons de ménage pour le suivi des tâches d''entretien des espaces';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `bons_de_menage`
--

LOCK TABLES `bons_de_menage` WRITE;
/*!40000 ALTER TABLE `bons_de_menage` DISABLE KEYS */;
INSERT INTO `bons_de_menage` VALUES (1,1,'Marie Dubois','Chambre 101',6,'Propre','Nettoyage quotidien de la chambre 101 - Changement de draps et serviettes','08:00:00','09:30:00','Parfait','Chambre parfaitement nettoyée. Aucun problème signalé.','Matin','2025-09-17 21:15:30','21:15:30','2025-09-17 20:15:30','2025-09-17 20:20:17',1,NULL),(2,1,'Marie Dubois','Chambre 102',7,'Sale','Nettoyage en profondeur de la chambre 102 - Nettoyage des sanitaires et changement de draps','09:45:00','11:15:00','Bon','Chambre nettoyée. Problème de robinetterie signalé au service technique.','Matin','2025-09-17 21:15:30','21:15:30','2025-09-17 20:15:30','2025-09-17 20:20:31',1,NULL),(3,2,'Jean Martin','Salle de réunion A',29,'En désordre','Remise en ordre et nettoyage de la salle de réunion A après réunion','14:00:00','15:30:00','Parfait','Salle parfaitement rangée et nettoyée. Matériel de projection vérifié.','Après-midi','2025-09-17 21:15:30','21:15:30','2025-09-17 20:15:30','2025-09-17 20:21:36',2,NULL),(4,3,'Sophie Bernard','Restaurant principal',30,'Très sale','Nettoyage complet du restaurant après service du midi','16:00:00','18:30:00','Bon','Restaurant nettoyé. Tables et chaises désinfectées. Sol lavé.','Après-midi','2025-09-17 21:15:30','21:15:30','2025-09-17 20:15:30','2025-09-17 20:21:49',3,NULL),(5,1,'Marie Dubois','Chambre 201',11,'Rien à signaler','Nettoyage de routine de la chambre 201','20:00:00','21:00:00','Parfait','Chambre en bon état, nettoyage rapide effectué.','Soir','2025-09-17 21:15:30','21:15:30','2025-09-17 20:15:30','2025-09-17 20:20:46',1,NULL),(7,2,'Alim Mpaka','101',6,'Très sale','test','07:25:00','09:30:00','Bon','nettoyer correctement','Matin','2025-09-17 21:26:36','21:26:37','2025-09-17 21:26:36','2025-09-17 21:26:36',2,2);
/*!40000 ALTER TABLE `bons_de_menage` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tbl_achats`
--

DROP TABLE IF EXISTS `tbl_achats`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tbl_achats` (
  `id` int NOT NULL AUTO_INCREMENT,
  `numero_commande` varchar(50) NOT NULL,
  `fournisseur_id` int NOT NULL,
  `demandeur_id` int NOT NULL,
  `approbateur_id` int DEFAULT NULL,
  `statut` enum('Brouillon','En attente','Approuvée','Commandée','Réceptionnée','Annulée') DEFAULT 'Brouillon',
  `priorite` enum('Basse','Normale','Haute','Urgente') DEFAULT 'Normale',
  `date_commande` datetime DEFAULT NULL,
  `date_livraison_souhaitee` date DEFAULT NULL,
  `date_livraison_reelle` datetime DEFAULT NULL,
  `montant_total` decimal(10,2) DEFAULT '0.00',
  `montant_ht` decimal(10,2) DEFAULT '0.00',
  `montant_tva` decimal(10,2) DEFAULT '0.00',
  `taux_tva` decimal(5,2) DEFAULT '20.00',
  `conditions_paiement` varchar(100) DEFAULT '30 jours',
  `mode_livraison` varchar(100) DEFAULT NULL,
  `frais_livraison` decimal(10,2) DEFAULT '0.00',
  `adresse_livraison` text,
  `notes` text,
  `pieces_justificatives` text COMMENT 'URLs ou chemins vers les pièces justificatives (factures, devis, etc.)',
  `motif_annulation` text,
  `date_creation` datetime DEFAULT CURRENT_TIMESTAMP,
  `date_modification` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `numero_commande` (`numero_commande`),
  KEY `approbateur_id` (`approbateur_id`),
  KEY `idx_numero_commande` (`numero_commande`),
  KEY `idx_fournisseur` (`fournisseur_id`),
  KEY `idx_demandeur` (`demandeur_id`),
  KEY `idx_statut` (`statut`),
  KEY `idx_date_commande` (`date_commande`),
  KEY `idx_date_creation` (`date_creation`),
  KEY `idx_pieces_justificatives` (`pieces_justificatives`(100)),
  CONSTRAINT `tbl_achats_ibfk_1` FOREIGN KEY (`fournisseur_id`) REFERENCES `tbl_fournisseurs` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `tbl_achats_ibfk_2` FOREIGN KEY (`demandeur_id`) REFERENCES `tbl_utilisateurs` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `tbl_achats_ibfk_3` FOREIGN KEY (`approbateur_id`) REFERENCES `tbl_utilisateurs` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tbl_achats`
--

LOCK TABLES `tbl_achats` WRITE;
/*!40000 ALTER TABLE `tbl_achats` DISABLE KEYS */;
INSERT INTO `tbl_achats` VALUES (1,'CMD-20250731-810',5,2,NULL,'Brouillon','Normale',NULL,'2025-08-03',NULL,0.00,0.00,0.00,20.00,'30 jours',NULL,0.00,NULL,'rhtjykujk.hgfds','[{\"id\":1753994377073.9146,\"nom\":\"rapport_postes_superviseur_Ntumba_Toussaint_15_07_2025 (1) (1).pdf\",\"taille\":\"24.0 KB\",\"type\":\"application/pdf\",\"url\":\"blob:http://localhost:3000/2f233ba6-8ccc-4b65-97ff-dcec4a25955b\",\"date_upload\":\"2025-07-31T20:39:37.074Z\",\"status\":\"success\"},{\"id\":1753994377634.633,\"nom\":\"compound_daily_1753462625.pdf\",\"taille\":\"38.6 KB\",\"type\":\"application/pdf\",\"url\":\"blob:http://localhost:3000/47ed18d2-31a5-4d31-8a2f-9e930a79833d\",\"date_upload\":\"2025-07-31T20:39:37.634Z\",\"status\":\"success\"}]',NULL,'2025-07-31 20:39:41','2025-07-31 20:39:41'),(2,'CMD-20250731-335',5,2,NULL,'Brouillon','Normale',NULL,'2025-08-03',NULL,300.00,250.00,50.00,20.00,'30 jours',NULL,0.00,NULL,'bio degats','[{\"id\":1753995176465.884,\"nom\":\"rapport_postes_superviseur_Ntumba Toussaint_17_07_2025.pdf\",\"taille\":\"9.8 KB\",\"type\":\"application/pdf\",\"url\":\"blob:http://localhost:3000/8aebf8e3-d905-4b60-bc12-557c797a7acc\",\"date_upload\":\"2025-07-31T20:52:56.466Z\",\"status\":\"success\"},{\"id\":1753995177028.042,\"nom\":\"listing_superviseurs_19_07_2025 (2).pdf\",\"taille\":\"11.6 KB\",\"type\":\"application/pdf\",\"url\":\"blob:http://localhost:3000/725611fe-8cc1-4199-adb7-54476bd7917b\",\"date_upload\":\"2025-07-31T20:52:57.029Z\",\"status\":\"success\"}]',NULL,'2025-07-31 20:53:04','2025-07-31 20:53:04'),(3,'CMD-20250731-887',2,2,NULL,'Brouillon','Normale',NULL,'2025-08-03',NULL,120.00,100.00,20.00,20.00,'30 jours',NULL,0.00,NULL,'yango','[{\"id\":1753995420533.863,\"nom\":\"rapport-assignations (7).pdf\",\"taille\":\"28.4 KB\",\"type\":\"application/pdf\",\"url\":\"blob:http://localhost:3000/f82b8bff-8fb6-4cc6-a327-016c44f8eb23\",\"date_upload\":\"2025-07-31T20:57:00.534Z\",\"status\":\"success\"}]',NULL,'2025-07-31 20:57:07','2025-07-31 20:57:07'),(4,'CMD-20250731-403',8,2,NULL,'Brouillon','Normale',NULL,'2025-08-07',NULL,600.00,500.00,100.00,20.00,'30 jours',NULL,0.00,NULL,'test','[{\"id\":1753997781505.8098,\"nom\":\"rapport-assignations (6).pdf\",\"taille\":\"37.8 KB\",\"type\":\"application/pdf\",\"url\":\"blob:http://localhost:3000/3d68aa5d-7a58-4755-bd32-da57139a8f5e\",\"date_upload\":\"2025-07-31T21:36:21.506Z\",\"status\":\"success\"}]',NULL,'2025-07-31 21:36:28','2025-07-31 21:36:28'),(5,'CMD-20250819-370',4,2,NULL,'Brouillon','Normale',NULL,'2025-08-20',NULL,1200.00,1000.00,200.00,20.00,'30 jours',NULL,0.00,NULL,NULL,'[{\"id\":1755634875890.6565,\"nom\":\"Demande 3 - 19_08_2025 18_13_42.pdf\",\"taille\":\"81.3 KB\",\"type\":\"application/pdf\",\"url\":\"blob:http://localhost:3000/1f9ffe9a-956d-479b-8277-1a8b0f514d0d\",\"date_upload\":\"2025-08-19T20:21:15.891Z\",\"status\":\"success\"}]',NULL,'2025-08-19 20:21:18','2025-08-19 20:21:18');
/*!40000 ALTER TABLE `tbl_achats` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tbl_affectations_chambres`
--

DROP TABLE IF EXISTS `tbl_affectations_chambres`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tbl_affectations_chambres` (
  `id` int NOT NULL AUTO_INCREMENT,
  `utilisateur_id` int NOT NULL,
  `chambre_id` int NOT NULL,
  `date_affectation` datetime DEFAULT CURRENT_TIMESTAMP,
  `remarque` text,
  PRIMARY KEY (`id`),
  KEY `utilisateur_id` (`utilisateur_id`),
  KEY `chambre_id` (`chambre_id`),
  CONSTRAINT `tbl_affectations_chambres_ibfk_1` FOREIGN KEY (`utilisateur_id`) REFERENCES `tbl_utilisateurs` (`id`) ON DELETE CASCADE,
  CONSTRAINT `tbl_affectations_chambres_ibfk_2` FOREIGN KEY (`chambre_id`) REFERENCES `tbl_chambres` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=23 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tbl_affectations_chambres`
--

LOCK TABLES `tbl_affectations_chambres` WRITE;
/*!40000 ALTER TABLE `tbl_affectations_chambres` DISABLE KEYS */;
INSERT INTO `tbl_affectations_chambres` VALUES (1,1,6,'2025-07-30 00:03:56','Suivi de chambre simple, côté jardin'),(2,3,8,'2025-07-30 00:04:40','Suite VIP en gestion'),(3,4,9,'2025-07-30 00:04:43','Prévoir inspection après nettoyage'),(4,5,10,'2025-07-30 00:04:45','Affectation économique'),(5,1,11,'2025-07-30 00:04:48','Chambre double occupée à vérifier'),(6,2,7,'2025-07-30 00:04:50','Client régulier à surveiller'),(7,4,9,'2025-07-30 00:04:58','Prévoir inspection après nettoyage'),(8,1,11,'2025-07-30 00:05:02','Chambre double occupée à vérifier'),(9,2,12,'2025-07-30 00:05:04','Suite avec cuisine, à préparer'),(10,3,13,'2025-07-30 00:05:06','Maintenance climatisation à suivre'),(11,4,14,'2025-07-30 00:05:09','Préparation chambre moderne'),(12,5,15,'2025-07-30 00:05:11','Chambre avec bureau, en service'),(13,1,16,'2025-07-30 00:05:13','Suite familiale pour famille attendue'),(14,2,17,'2025-07-30 00:05:16','Chambre balcon à préparer'),(15,3,18,'2025-07-30 00:05:18','Prévoir nettoyage approfondi'),(16,4,19,'2025-07-30 00:05:21','Chambre rénovée, première utilisation'),(17,5,20,'2025-07-30 00:05:23','Client VIP à gérer avec attention'),(18,1,21,'2025-07-30 00:05:27','Chambre en coin à inspecter'),(19,2,22,'2025-07-30 00:05:29','Problème d’eau signalé'),(20,3,23,'2025-07-30 00:05:32','Vue mer, inspection spéciale'),(21,4,24,'2025-07-30 00:05:34','Client régulier à l’étage 4'),(22,5,25,'2025-07-30 00:05:37','Petite chambre libre à attribuer');
/*!40000 ALTER TABLE `tbl_affectations_chambres` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tbl_buanderie`
--

DROP TABLE IF EXISTS `tbl_buanderie`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tbl_buanderie` (
  `id` int NOT NULL AUTO_INCREMENT,
  `inventaire_id` int NOT NULL COMMENT 'Référence vers l''article de linge',
  `chambre_id` int DEFAULT NULL COMMENT 'Chambre/espace source ou destination',
  `type_operation` enum('Envoi','Retour','Transfert','Perte','Endommagement') COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Type d''opération',
  `quantite` int NOT NULL DEFAULT '1' COMMENT 'Quantité de linge',
  `etat_linge` enum('Propre','Sale','En cours','Perdu','Endommagé') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Propre' COMMENT 'État du linge',
  `priorite` enum('Urgente','Normale','Basse') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Normale' COMMENT 'Priorité de traitement',
  `date_operation` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Date de l''opération',
  `date_retour_prevue` datetime DEFAULT NULL COMMENT 'Date de retour prévue',
  `responsable_id` int DEFAULT NULL COMMENT 'Utilisateur responsable',
  `utilisateur_id` int NOT NULL COMMENT 'Utilisateur qui effectue l''opération',
  `motif` text COLLATE utf8mb4_unicode_ci COMMENT 'Motif de l''opération',
  `notes` text COLLATE utf8mb4_unicode_ci COMMENT 'Notes additionnelles',
  `statut` enum('En cours','Terminé','Annulé') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'En cours' COMMENT 'Statut de l''opération',
  `cout_operation` decimal(10,2) DEFAULT '0.00' COMMENT 'Coût de l''opération',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_inventaire_id` (`inventaire_id`),
  KEY `idx_chambre_id` (`chambre_id`),
  KEY `idx_type_operation` (`type_operation`),
  KEY `idx_etat_linge` (`etat_linge`),
  KEY `idx_priorite` (`priorite`),
  KEY `idx_date_operation` (`date_operation`),
  KEY `idx_responsable_id` (`responsable_id`),
  KEY `idx_utilisateur_id` (`utilisateur_id`),
  KEY `idx_statut` (`statut`),
  CONSTRAINT `fk_buanderie_chambre` FOREIGN KEY (`chambre_id`) REFERENCES `tbl_chambres` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_buanderie_inventaire` FOREIGN KEY (`inventaire_id`) REFERENCES `tbl_inventaire` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_buanderie_responsable` FOREIGN KEY (`responsable_id`) REFERENCES `tbl_utilisateurs` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_buanderie_utilisateur` FOREIGN KEY (`utilisateur_id`) REFERENCES `tbl_utilisateurs` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Table dédiée à la gestion de la buanderie';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tbl_buanderie`
--

LOCK TABLES `tbl_buanderie` WRITE;
/*!40000 ALTER TABLE `tbl_buanderie` DISABLE KEYS */;
INSERT INTO `tbl_buanderie` VALUES (1,2,6,'Envoi',2,'Sale','Normale','2025-08-26 23:46:10','2025-08-28 23:46:10',1,1,'Linge sale de la chambre','Drap et serviette','En cours',0.00,'2025-08-26 22:46:10','2025-08-26 22:46:10'),(2,2,7,'Envoi',1,'Sale','Urgente','2025-08-26 23:46:10','2025-08-27 23:46:10',1,1,'Linge urgent','Serviette de bain','En cours',0.00,'2025-08-26 22:46:10','2025-08-26 23:37:33'),(3,2,8,'Retour',3,'Propre','Normale','2025-08-26 23:46:10',NULL,1,1,'Retour de linge propre','Drap, serviette et taie','Terminé',0.00,'2025-08-26 22:46:10','2025-08-26 23:37:40'),(4,2,6,'Transfert',1,'En cours','Normale','2025-08-26 23:46:10','2025-08-27 23:46:10',1,1,'Transfert vers repassage','Drap en cours de repassage','En cours',0.00,'2025-08-26 22:46:10','2025-08-26 22:46:10'),(5,2,6,'Envoi',1,'Sale','Normale','2025-08-26 22:54:11',NULL,NULL,1,'Test création opération','Test via script','En cours',0.00,'2025-08-26 22:54:11','2025-08-26 22:54:11');
/*!40000 ALTER TABLE `tbl_buanderie` ENABLE KEYS */;
UNLOCK TABLES;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50003 TRIGGER `tr_buanderie_verifier_quantite` BEFORE INSERT ON `tbl_buanderie` FOR EACH ROW BEGIN
  DECLARE quantite_disponible INT DEFAULT 0;
  
  IF NEW.type_operation = 'Envoi' THEN
    SELECT quantite INTO quantite_disponible 
    FROM `tbl_inventaire` 
    WHERE id = NEW.inventaire_id;
    
    IF quantite_disponible < NEW.quantite THEN
      SIGNAL SQLSTATE '45000' 
      SET MESSAGE_TEXT = 'Quantité insuffisante en stock pour cette opération';
    END IF;
  END IF;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50003 TRIGGER `tr_buanderie_update_timestamp` BEFORE UPDATE ON `tbl_buanderie` FOR EACH ROW BEGIN
  SET NEW.updated_at = CURRENT_TIMESTAMP;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;

--
-- Table structure for table `tbl_caisses`
--

DROP TABLE IF EXISTS `tbl_caisses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tbl_caisses` (
  `id` int NOT NULL AUTO_INCREMENT COMMENT 'Identifiant unique de la caisse',
  `nom` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Nom de la caisse (ex: Caisse 1, Caisse principale)',
  `code_caisse` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Code unique de la caisse (ex: CAISSE-001)',
  `description` text COLLATE utf8mb4_unicode_ci COMMENT 'Description de la caisse',
  `emplacement` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Emplacement physique de la caisse',
  `solde_initial` decimal(10,2) NOT NULL DEFAULT '0.00' COMMENT 'Solde initial de la caisse',
  `solde_actuel` decimal(10,2) NOT NULL DEFAULT '0.00' COMMENT 'Solde actuel de la caisse',
  `devise` varchar(3) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'EUR' COMMENT 'Devise de la caisse (EUR, USD, etc.)',
  `statut` enum('Active','Inactive','En maintenance','Fermée') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Active' COMMENT 'Statut de la caisse',
  `responsable_id` int DEFAULT NULL COMMENT 'ID de l''utilisateur responsable de la caisse',
  `date_ouverture` datetime DEFAULT NULL COMMENT 'Date d''ouverture de la caisse',
  `date_fermeture` datetime DEFAULT NULL COMMENT 'Date de fermeture de la caisse',
  `limite_retrait` decimal(10,2) DEFAULT NULL COMMENT 'Limite de retrait quotidien',
  `limite_depot` decimal(10,2) DEFAULT NULL COMMENT 'Limite de dépôt quotidien',
  `notes` text COLLATE utf8mb4_unicode_ci COMMENT 'Notes additionnelles',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Date de création',
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Date de dernière modification',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_code_caisse` (`code_caisse`),
  KEY `idx_statut` (`statut`),
  KEY `idx_responsable_id` (`responsable_id`),
  KEY `idx_created_at` (`created_at`),
  KEY `idx_emplacement` (`emplacement`),
  KEY `idx_devise` (`devise`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Table des caisses enregistreuses de l''hôtel';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tbl_caisses`
--

LOCK TABLES `tbl_caisses` WRITE;
/*!40000 ALTER TABLE `tbl_caisses` DISABLE KEYS */;
INSERT INTO `tbl_caisses` VALUES (1,'Caisse Solange','CAISSE-1754858048457-559','Caisse principale','Reception',1000.00,6865.50,'USD','Active',4,'2025-08-10 20:35:50',NULL,300.00,3000.00,'Test notes','2025-08-10 20:35:50','2025-09-08 09:41:55'),(2,'Caisse ezekiel','CAISSE-1754915321782-911','Caisse restaurant','Restaurant',1000.00,1000.00,'USD','Active',4,'2025-08-11 12:30:08',NULL,200.00,2000.00,'bio','2025-08-11 12:30:08','2025-09-08 09:41:55'),(3,'Caisse secondaire FC','CAISSE-1755210584487-379','test caisse francs','Reception',200000.00,638800.00,'FC','Active',4,'2025-08-14 22:30:44',NULL,20000.00,300000.00,'test','2025-08-14 22:30:44','2025-09-08 09:41:55'),(4,'Caisse principale Euro','CAISSE-1755213374385-508','Caisse Euro','Bureau Administration',1500.00,1500.00,'EUR','Active',4,'2025-08-14 23:17:21',NULL,500.00,5000.00,'test','2025-08-14 23:17:21','2025-09-08 09:41:55');
/*!40000 ALTER TABLE `tbl_caisses` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tbl_chambres`
--

DROP TABLE IF EXISTS `tbl_chambres`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tbl_chambres` (
  `id` int NOT NULL AUTO_INCREMENT,
  `numero` varchar(20) DEFAULT NULL COMMENT 'Numéro/Identifiant de l''espace',
  `type` varchar(100) NOT NULL DEFAULT 'Chambre' COMMENT 'Type d''espace (Chambre, Salle de fête, Restaurant, etc.)',
  `categorie` varchar(50) DEFAULT 'Standard' COMMENT 'Catégorie de chambre (Standard, Confort, Premium, Suite, Familiale, Accessible)',
  `statut` varchar(50) NOT NULL DEFAULT 'Libre' COMMENT 'Statut de l''espace (Libre, Occupé, En maintenance, etc.)',
  `capacite` int DEFAULT NULL COMMENT 'Capacité en nombre de personnes',
  `surface` decimal(8,2) DEFAULT NULL COMMENT 'Surface en m² pour salles, restaurants, etc.',
  `acoustique` tinyint(1) DEFAULT '0' COMMENT 'Acoustique optimisée pour salles',
  `cuisine_equipee` tinyint(1) DEFAULT '0' COMMENT 'Cuisine équipée pour restaurants/bars',
  `terrasse` tinyint(1) DEFAULT '0' COMMENT 'Présence d''une terrasse',
  `douches` int DEFAULT '0' COMMENT 'Nombre de douches pour spas/gyms',
  `vestiaires` int DEFAULT '0' COMMENT 'Nombre de vestiaires pour spas/gyms',
  `places` int DEFAULT '0' COMMENT 'Nombre de places pour parkings',
  `couvert` tinyint(1) DEFAULT '0' COMMENT 'Parking couvert',
  `profondeur_max` decimal(4,2) DEFAULT NULL COMMENT 'Profondeur maximale en m pour piscines',
  `chauffage` tinyint(1) DEFAULT '0' COMMENT 'Piscine chauffée',
  `superficie` decimal(10,2) DEFAULT NULL COMMENT 'Superficie en m² pour jardins',
  `arrosage_automatique` tinyint(1) DEFAULT '0' COMMENT 'Arrosage automatique pour jardins',
  `hauteur_plafond` decimal(5,2) DEFAULT NULL COMMENT 'Hauteur plafond en m pour entrepôts',
  `quai_chargement` tinyint(1) DEFAULT '0' COMMENT 'Quai de chargement pour entrepôts',
  `prix_nuit` decimal(10,2) DEFAULT NULL COMMENT 'Tarif par nuit (principalement pour chambres)',
  `etage` int NOT NULL,
  `description` text,
  `equipements` text,
  `notes` text,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `numero` (`numero`),
  KEY `tbl_chambres_statut` (`statut`),
  KEY `tbl_chambres_type` (`type`),
  KEY `idx_chambres_type` (`type`),
  KEY `idx_chambres_categorie` (`categorie`)
) ENGINE=InnoDB AUTO_INCREMENT=31 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Table des espaces (chambres, salles, restaurants, parkings, etc.)';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tbl_chambres`
--

LOCK TABLES `tbl_chambres` WRITE;
/*!40000 ALTER TABLE `tbl_chambres` DISABLE KEYS */;
INSERT INTO `tbl_chambres` VALUES (6,'101','Chambre','Standard','Libre',1,NULL,0,0,0,0,0,0,0,NULL,0,NULL,0,NULL,0,50.00,1,'Chambre simple avec un lit','WiFi, TV','Calme, côté jardin','2025-07-29 23:52:48','2025-07-29 23:52:48'),(7,'102','Chambre','Standard','Occupée',2,NULL,0,0,0,0,0,0,0,NULL,0,NULL,0,NULL,0,75.00,1,'Chambre double confortable','WiFi, TV, Mini-bar','Client régulier','2025-07-29 23:52:48','2025-07-29 23:52:48'),(8,'103','Chambre','Standard','Libre',3,NULL,0,0,0,0,0,0,0,NULL,0,NULL,0,NULL,0,150.00,1,'Suite luxueuse','WiFi, TV, Mini-bar, Jacuzzi','VIP','2025-07-29 23:52:48','2025-07-29 23:52:48'),(9,'104','Chambre','Standard','En nettoyage',2,NULL,0,0,0,0,0,0,0,NULL,0,NULL,0,NULL,0,80.00,1,'Chambre double avec vue','WiFi, TV, Balcon','','2025-07-29 23:52:48','2025-07-29 23:52:48'),(10,'105','Chambre','Standard','Libre',1,NULL,0,0,0,0,0,0,0,NULL,0,NULL,0,NULL,0,55.00,1,'Chambre économique','WiFi','','2025-07-29 23:52:48','2025-07-29 23:52:48'),(11,'201','Chambre','Standard','Occupée',2,NULL,0,0,0,0,0,0,0,NULL,0,NULL,0,NULL,0,85.00,2,'Chambre spacieuse','WiFi, TV, Mini-bar','','2025-07-29 23:52:48','2025-07-29 23:52:48'),(12,'202','Chambre','Standard','Libre',4,NULL,0,0,0,0,0,0,0,NULL,0,NULL,0,NULL,0,170.00,2,'Suite avec salon','WiFi, TV, Mini-bar, Cuisine','','2025-07-29 23:52:48','2025-07-29 23:52:48'),(13,'203','Chambre','Standard','En maintenance',1,NULL,0,0,0,0,0,0,0,NULL,0,NULL,0,NULL,0,50.00,2,'Chambre avec problèmes de clim','WiFi','À réparer','2025-07-29 23:52:48','2025-07-29 23:52:48'),(14,'204','Chambre','Standard','Libre',2,NULL,0,0,0,0,0,0,0,NULL,0,NULL,0,NULL,0,90.00,2,'Chambre moderne','WiFi, TV, Clim','','2025-07-29 23:52:48','2025-07-29 23:52:48'),(15,'205','Chambre','Standard','Occupée',1,NULL,0,0,0,0,0,0,0,NULL,0,NULL,0,NULL,0,60.00,2,'Chambre avec bureau','WiFi, TV','','2025-07-29 23:52:48','2025-07-29 23:52:48'),(16,'301','Chambre','Standard','Libre',3,NULL,0,0,0,0,0,0,0,NULL,0,NULL,0,NULL,0,160.00,3,'Suite familiale','WiFi, TV, Mini-bar, Lit bébé','','2025-07-29 23:52:48','2025-07-29 23:52:48'),(17,'302','Chambre','Standard','Libre',2,NULL,0,0,0,0,0,0,0,NULL,0,NULL,0,NULL,0,85.00,3,'Chambre avec balcon','WiFi, TV, Balcon','','2025-07-29 23:52:48','2025-07-29 23:52:48'),(18,'303','Chambre','Standard','En nettoyage',1,NULL,0,0,0,0,0,0,0,NULL,0,NULL,0,NULL,0,55.00,3,'Chambre cosy','WiFi','','2025-07-29 23:52:48','2025-07-29 23:52:48'),(19,'304','Chambre','Standard','Libre',2,NULL,0,0,0,0,0,0,0,NULL,0,NULL,0,NULL,0,80.00,3,'Chambre rénovée','WiFi, TV','','2025-07-29 23:52:48','2025-07-29 23:52:48'),(20,'305','Chambre','Standard','Occupée',4,NULL,0,0,0,0,0,0,0,NULL,0,NULL,0,NULL,0,175.00,3,'Suite premium','WiFi, TV, Jacuzzi, Terrasse','Client VIP','2025-07-29 23:52:48','2025-07-29 23:52:48'),(21,'401','Chambre','Standard','Libre',1,NULL,0,0,0,0,0,0,0,NULL,0,NULL,0,NULL,0,58.00,4,'Chambre en coin','WiFi, TV','','2025-07-29 23:52:48','2025-07-29 23:52:48'),(22,'402','Chambre','Standard','En maintenance',2,NULL,0,0,0,0,0,0,0,NULL,0,NULL,0,NULL,0,78.00,4,'Chambre avec problème d’eau','WiFi, TV','Plomberie à vérifier','2025-07-29 23:52:48','2025-07-29 23:52:48'),(23,'403','Chambre','Standard','Libre',3,NULL,0,0,0,0,0,0,0,NULL,0,NULL,0,NULL,0,155.00,4,'Suite avec vue mer','WiFi, TV, Mini-bar, Vue','','2025-07-29 23:52:48','2025-07-29 23:52:48'),(24,'404','Chambre','Standard','Occupée',2,NULL,0,0,0,0,0,0,0,NULL,0,NULL,0,NULL,0,82.00,4,'Chambre standard','WiFi, TV','','2025-07-29 23:52:48','2025-07-29 23:52:48'),(25,'405','Chambre','Standard','Libre',1,NULL,0,0,0,0,0,0,0,NULL,0,NULL,0,NULL,0,52.00,4,'Petite chambre tranquille','WiFi','','2025-07-29 23:52:48','2025-07-29 23:52:48'),(26,'SALLE1','Salle de fête','Standard','Libre',50,120.50,1,0,0,0,0,0,0,NULL,0,NULL,0,NULL,0,NULL,0,'Grande salle pour événements','Sonorisation, Éclairage, Scène','Réservation minimum 24h à l\'avance','2025-08-16 16:18:43','2025-08-16 16:18:43'),(27,'BUR-002-DG','Bureau administratif','Standard','Libre',1,NULL,0,0,0,NULL,NULL,NULL,0,NULL,0,NULL,0,NULL,0,NULL,0,'test','Wifi','test','2025-08-16 16:28:50','2025-08-16 16:28:50'),(28,'REST-001','Restaurant','Standard','Libre',1,NULL,0,1,0,NULL,NULL,NULL,0,NULL,0,NULL,0,NULL,0,NULL,0,'test','wifi','test note','2025-08-16 16:30:45','2025-08-16 16:30:45'),(29,'SALLE-A','Salle de réunion','Standard','Libre',20,NULL,0,0,0,0,0,0,0,NULL,0,NULL,0,NULL,0,NULL,2,NULL,NULL,NULL,'2025-09-17 21:21:21','2025-09-17 21:21:21'),(30,'RESTAURANT-1','Restaurant','Standard','Libre',50,NULL,0,0,0,0,0,0,0,NULL,0,NULL,0,NULL,0,NULL,1,NULL,NULL,NULL,'2025-09-17 21:21:21','2025-09-17 21:21:21');
/*!40000 ALTER TABLE `tbl_chambres` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tbl_config_upload`
--

DROP TABLE IF EXISTS `tbl_config_upload`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tbl_config_upload` (
  `id` int NOT NULL AUTO_INCREMENT,
  `cle` varchar(100) NOT NULL,
  `valeur` text NOT NULL,
  `description` text,
  `date_modification` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `cle` (`cle`)
) ENGINE=InnoDB AUTO_INCREMENT=25 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tbl_config_upload`
--

LOCK TABLES `tbl_config_upload` WRITE;
/*!40000 ALTER TABLE `tbl_config_upload` DISABLE KEYS */;
INSERT INTO `tbl_config_upload` VALUES (1,'max_images_problematique','5','Nombre maximum d\'images par problématique','2025-08-17 22:51:25'),(2,'max_taille_fichier','5242880','Taille maximum des fichiers en octets (5MB)','2025-08-17 22:51:25'),(3,'types_mime_autorises','image/jpeg,image/png,image/gif,image/webp','Types MIME autorisés pour les images','2025-08-17 22:51:25'),(4,'dossier_upload','/uploads/problematiques','Dossier de stockage des images','2025-08-17 22:51:25'),(5,'qualite_compression','80','Qualité de compression JPEG (1-100)','2025-08-17 22:51:25'),(6,'redimensionner_images','true','Redimensionner automatiquement les images trop grandes','2025-08-17 22:51:25'),(7,'largeur_max','1920','Largeur maximum des images redimensionnées','2025-08-17 22:51:25'),(8,'hauteur_max','1080','Hauteur maximum des images redimensionnées','2025-08-17 22:51:25');
/*!40000 ALTER TABLE `tbl_config_upload` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tbl_cycle_vie_articles`
--

DROP TABLE IF EXISTS `tbl_cycle_vie_articles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tbl_cycle_vie_articles` (
  `id` int NOT NULL AUTO_INCREMENT,
  `article_id` int NOT NULL,
  `type_operation` enum('Creation','Reception','Transfert','Utilisation','Maintenance','Perte','Vol','Destruction','Vente','Don') NOT NULL,
  `date_operation` datetime DEFAULT CURRENT_TIMESTAMP,
  `utilisateur_id` int NOT NULL,
  `quantite` decimal(10,2) NOT NULL DEFAULT '1.00',
  `unite` varchar(20) DEFAULT 'unité',
  `lieu_origine` varchar(100) DEFAULT NULL,
  `lieu_destination` varchar(100) DEFAULT NULL,
  `reference_document` varchar(100) DEFAULT NULL,
  `cout_unitaire` decimal(12,2) DEFAULT NULL,
  `cout_total` decimal(12,2) DEFAULT NULL,
  `statut` enum('En cours','Termine','Annule','En attente') DEFAULT 'Termine',
  `observations` text,
  `date_creation` datetime DEFAULT CURRENT_TIMESTAMP,
  `date_modification` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_article_id` (`article_id`),
  KEY `idx_type_operation` (`type_operation`),
  KEY `idx_date_operation` (`date_operation`),
  KEY `idx_utilisateur_id` (`utilisateur_id`),
  KEY `idx_statut` (`statut`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tbl_cycle_vie_articles`
--

LOCK TABLES `tbl_cycle_vie_articles` WRITE;
/*!40000 ALTER TABLE `tbl_cycle_vie_articles` DISABLE KEYS */;
INSERT INTO `tbl_cycle_vie_articles` VALUES (1,1,'Creation','2025-08-26 22:42:48',1,10.00,'unité','Fournisseur ABC','Entrepôt Principal','Facture ABC-001',15000.00,150000.00,'Termine','Création initiale des articles','2025-08-26 22:42:48','2025-08-26 22:42:48'),(2,1,'Reception','2025-08-26 22:42:48',2,10.00,'unité','Entrepôt Principal','Entrepôt Principal','Bon de réception BR-001',15000.00,150000.00,'Termine','Réception et vérification','2025-08-26 22:42:48','2025-08-26 22:42:48'),(3,2,'Creation','2025-08-26 22:42:48',1,5.00,'unité','Fournisseur XYZ','Entrepôt Principal','Facture XYZ-002',25000.00,125000.00,'Termine','Création de nouveaux articles','2025-08-26 22:42:48','2025-08-26 22:42:48'),(4,3,'Transfert','2025-08-26 22:42:48',3,2.00,'unité','Entrepôt Principal','Entrepôt Secondaire','Bon de transfert BT-001',18000.00,36000.00,'Termine','Transfert vers entrepôt secondaire','2025-08-26 22:42:48','2025-08-26 22:42:48'),(5,1,'Utilisation','2025-08-26 22:42:48',4,1.00,'unité','Entrepôt Principal','Chambre 101','Demande d\'utilisation DU-001',15000.00,15000.00,'Termine','Utilisation en chambre','2025-08-26 22:42:48','2025-08-26 22:42:48'),(6,2,'Maintenance','2025-08-26 22:42:48',5,1.00,'unité','Entrepôt Principal','Atelier','Ordre de maintenance OM-001',25000.00,25000.00,'Termine','Maintenance préventive','2025-08-26 22:42:48','2025-08-26 22:42:48');
/*!40000 ALTER TABLE `tbl_cycle_vie_articles` ENABLE KEYS */;
UNLOCK TABLES;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50003 TRIGGER `tr_verifier_quantite_stock` BEFORE INSERT ON `tbl_cycle_vie_articles` FOR EACH ROW BEGIN
    DECLARE v_quantite_stock DECIMAL(10,2);
    
    IF NEW.type_operation IN ('Utilisation', 'Vente', 'Perte', 'Vol') THEN
        SELECT quantite_stock INTO v_quantite_stock
        FROM tbl_inventaire
        WHERE id = NEW.article_id;
        
        IF NEW.quantite > v_quantite_stock THEN
            SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Quantité insuffisante en stock pour cette opération';
        END IF;
    END IF;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50003 TRIGGER `tr_cycle_vie_update_timestamp` BEFORE UPDATE ON `tbl_cycle_vie_articles` FOR EACH ROW BEGIN
    SET NEW.date_modification = CURRENT_TIMESTAMP;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;

--
-- Table structure for table `tbl_demandes`
--

DROP TABLE IF EXISTS `tbl_demandes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tbl_demandes` (
  `id` int NOT NULL AUTO_INCREMENT,
  `motif` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Motif de la demande de décaissement',
  `description` text COLLATE utf8mb4_unicode_ci COMMENT 'Description détaillée de la demande',
  `montant` decimal(10,2) NOT NULL COMMENT 'Montant demandé en FCFA',
  `statut` enum('en_attente','approuvee','rejetee','annulee') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'en_attente' COMMENT 'Statut de la demande',
  `date_demande` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Date de création de la demande',
  `date_validation` datetime DEFAULT NULL COMMENT 'Date de validation/rejet par le superviseur',
  `guichetier_id` int NOT NULL COMMENT 'ID de l''utilisateur guichetier qui fait la demande',
  `superviseur_id` int DEFAULT NULL COMMENT 'ID de l''utilisateur superviseur qui valide/rejette',
  `commentaire_superviseur` text COLLATE utf8mb4_unicode_ci COMMENT 'Commentaire du superviseur sur sa décision',
  `priorite` enum('basse','normale','haute','urgente') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'normale' COMMENT 'Niveau de priorité de la demande',
  `categorie` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Catégorie de la dépense (ex: maintenance, fournitures, etc.)',
  `piece_justificative` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Chemin vers la pièce justificative si disponible',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_guichetier_id` (`guichetier_id`),
  KEY `idx_superviseur_id` (`superviseur_id`),
  KEY `idx_statut` (`statut`),
  KEY `idx_date_demande` (`date_demande`),
  KEY `idx_priorite` (`priorite`),
  KEY `idx_categorie` (`categorie`),
  KEY `idx_demandes_composite` (`guichetier_id`,`statut`,`date_demande`),
  FULLTEXT KEY `idx_demandes_search` (`motif`,`description`,`categorie`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Table des demandes de décaissement des guichetiers pour validation par les superviseurs';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tbl_demandes`
--

LOCK TABLES `tbl_demandes` WRITE;
/*!40000 ALTER TABLE `tbl_demandes` DISABLE KEYS */;
INSERT INTO `tbl_demandes` VALUES (1,'Achat fournitures bureau','Papeterie, cartouches d\'encre et autres fournitures de bureau nécessaires pour le bon fonctionnement du service',15000.00,'en_attente','2025-08-14 15:47:40',NULL,12,NULL,NULL,'normale','Fournitures',NULL,'2025-08-14 14:47:40','2025-08-14 16:32:25'),(2,'Maintenance équipement','Réparation de l\'imprimante et maintenance préventive des ordinateurs',25000.00,'en_attente','2025-08-14 15:47:40',NULL,12,NULL,NULL,'haute','Maintenance',NULL,'2025-08-14 14:47:40','2025-08-14 16:32:25'),(3,'Frais de transport','Remboursement des frais de transport pour les courses professionnelles effectuées',8000.00,'en_attente','2025-08-14 15:47:40',NULL,11,NULL,NULL,'normale','Transport',NULL,'2025-08-14 14:47:40','2025-08-14 16:32:25'),(4,'Achat matériel sécurité','Équipements de sécurité et accessoires pour le personnel',35000.00,'en_attente','2025-08-14 15:47:40',NULL,12,NULL,NULL,'urgente','Sécurité',NULL,'2025-08-14 14:47:40','2025-08-14 16:32:25'),(5,'Manque de stylo et papier','il y a une rupture de stock au niveau de la reception',25000.00,'en_attente','2025-08-14 17:02:51',NULL,12,NULL,NULL,'urgente','Fournitures',NULL,'2025-08-14 17:02:51','2025-08-14 17:02:51'),(6,'test motif','test description',100000.00,'en_attente','2025-08-14 17:04:52',NULL,12,NULL,NULL,'urgente','Fourniture',NULL,'2025-08-14 17:04:52','2025-08-14 17:04:52');
/*!40000 ALTER TABLE `tbl_demandes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tbl_demandes_affectation`
--

DROP TABLE IF EXISTS `tbl_demandes_affectation`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tbl_demandes_affectation` (
  `id` int NOT NULL AUTO_INCREMENT,
  `demandeur_id` int NOT NULL,
  `statut` enum('en_attente','approuvee','rejetee','annulee') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'en_attente',
  `commentaire` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_demandes_affectation_demandeur` (`demandeur_id`),
  KEY `idx_demandes_affectation_statut` (`statut`),
  CONSTRAINT `fk_da_demandeur` FOREIGN KEY (`demandeur_id`) REFERENCES `tbl_utilisateurs` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tbl_demandes_affectation`
--

LOCK TABLES `tbl_demandes_affectation` WRITE;
/*!40000 ALTER TABLE `tbl_demandes_affectation` DISABLE KEYS */;
INSERT INTO `tbl_demandes_affectation` VALUES (1,2,'approuvee','','2025-08-19 13:48:19','2025-08-19 14:04:11'),(2,2,'approuvee','','2025-08-19 15:34:25','2025-08-19 15:34:56'),(3,2,'approuvee','','2025-08-19 16:47:27','2025-08-19 16:47:34'),(4,2,'approuvee','bio test','2025-08-19 17:47:56','2025-08-19 17:48:38'),(5,2,'approuvee','','2025-08-19 20:22:19','2025-08-19 20:22:27'),(6,2,'approuvee','','2025-08-19 20:50:26','2025-08-19 20:50:40'),(7,2,'approuvee','','2025-08-19 20:52:24','2025-08-19 20:52:32'),(8,2,'approuvee','','2025-08-19 21:14:27','2025-08-19 21:15:05'),(9,2,'approuvee','','2025-08-20 12:55:40','2025-08-20 12:58:09'),(10,2,'approuvee','','2025-08-20 13:00:36','2025-08-20 13:01:22'),(11,5,'approuvee','','2025-08-21 13:50:20','2025-08-21 14:25:57'),(12,2,'approuvee','','2025-08-23 16:38:15','2025-08-23 16:39:28'),(13,2,'approuvee','','2025-08-23 16:44:06','2025-08-23 16:44:20');
/*!40000 ALTER TABLE `tbl_demandes_affectation` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tbl_demandes_affectation_lignes`
--

DROP TABLE IF EXISTS `tbl_demandes_affectation_lignes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tbl_demandes_affectation_lignes` (
  `id` int NOT NULL AUTO_INCREMENT,
  `demande_affectation_id` int NOT NULL,
  `inventaire_id` int NOT NULL,
  `chambre_id` int DEFAULT NULL,
  `quantite_demandee` int NOT NULL DEFAULT '1',
  `quantite_approvee` int NOT NULL DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_demandes_affectation_lignes_demande` (`demande_affectation_id`),
  KEY `idx_demandes_affectation_lignes_inventaire` (`inventaire_id`),
  KEY `idx_demandes_affectation_lignes_chambre` (`chambre_id`),
  CONSTRAINT `fk_dal_chambre` FOREIGN KEY (`chambre_id`) REFERENCES `tbl_chambres` (`id`),
  CONSTRAINT `fk_dal_demande` FOREIGN KEY (`demande_affectation_id`) REFERENCES `tbl_demandes_affectation` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_dal_inventaire` FOREIGN KEY (`inventaire_id`) REFERENCES `tbl_inventaire` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=21 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tbl_demandes_affectation_lignes`
--

LOCK TABLES `tbl_demandes_affectation_lignes` WRITE;
/*!40000 ALTER TABLE `tbl_demandes_affectation_lignes` DISABLE KEYS */;
INSERT INTO `tbl_demandes_affectation_lignes` VALUES (1,1,1,6,4,4,'2025-08-19 13:48:19','2025-08-19 14:04:11'),(2,1,1,8,3,2,'2025-08-19 13:48:19','2025-08-19 14:04:11'),(3,2,1,10,3,3,'2025-08-19 15:34:25','2025-08-19 15:34:56'),(4,3,1,12,5,3,'2025-08-19 16:47:27','2025-08-19 16:47:54'),(5,3,2,12,6,5,'2025-08-19 16:47:27','2025-08-19 16:47:54'),(6,4,4,20,2,2,'2025-08-19 17:47:56','2025-08-19 17:48:38'),(7,5,4,20,3,3,'2025-08-19 20:22:19','2025-08-19 20:22:27'),(8,6,1,6,4,3,'2025-08-19 20:50:26','2025-08-19 20:50:40'),(9,7,2,6,3,2,'2025-08-19 20:52:24','2025-08-19 20:52:32'),(10,8,2,20,2,2,'2025-08-19 21:14:27','2025-08-19 21:15:05'),(11,8,3,20,3,2,'2025-08-19 21:14:27','2025-08-19 21:15:05'),(12,8,4,20,2,1,'2025-08-19 21:14:27','2025-08-19 21:15:05'),(13,9,1,28,7,5,'2025-08-20 12:55:40','2025-08-20 12:58:09'),(14,9,1,17,6,4,'2025-08-20 12:55:40','2025-08-20 12:58:09'),(15,10,1,10,2,2,'2025-08-20 13:00:36','2025-08-20 13:01:22'),(16,11,1,6,2,1,'2025-08-21 13:50:20','2025-08-21 14:25:57'),(17,11,2,6,3,2,'2025-08-21 13:50:20','2025-08-21 14:25:57'),(18,12,1,10,6,4,'2025-08-23 16:38:15','2025-08-23 16:39:28'),(19,13,4,10,5,2,'2025-08-23 16:44:06','2025-08-23 16:44:20'),(20,13,2,10,3,1,'2025-08-23 16:44:06','2025-08-23 16:44:20');
/*!40000 ALTER TABLE `tbl_demandes_affectation_lignes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tbl_demandes_fonds`
--

DROP TABLE IF EXISTS `tbl_demandes_fonds`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tbl_demandes_fonds` (
  `id` int NOT NULL AUTO_INCREMENT,
  `type` enum('demande_fonds','bon_achat') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'demande_fonds' COMMENT 'Type de demande',
  `statut` enum('en_attente','approuvee','rejetee','annulee') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'en_attente' COMMENT 'Statut de la demande',
  `montant_total` decimal(10,2) NOT NULL COMMENT 'Montant total de la demande',
  `devise` enum('EUR','USD','FC') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'EUR' COMMENT 'Devise de la demande',
  `motif` text COLLATE utf8mb4_unicode_ci COMMENT 'Motif de la demande (pour demande de fonds)',
  `commentaire` text COLLATE utf8mb4_unicode_ci COMMENT 'Commentaire additionnel',
  `date_validation` datetime DEFAULT NULL COMMENT 'Date de validation/rejet par le superviseur',
  `commentaire_superviseur` text COLLATE utf8mb4_unicode_ci COMMENT 'Commentaire du superviseur sur sa décision',
  `demandeur_id` int NOT NULL COMMENT 'ID de l''utilisateur demandeur',
  `superviseur_id` int DEFAULT NULL COMMENT 'ID de l''utilisateur superviseur qui valide/rejette',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Date de création',
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Date de mise à jour',
  PRIMARY KEY (`id`),
  KEY `idx_type` (`type`),
  KEY `idx_statut` (`statut`),
  KEY `idx_demandeur_id` (`demandeur_id`),
  KEY `idx_superviseur_id` (`superviseur_id`),
  KEY `idx_created_at` (`created_at`),
  KEY `idx_devise` (`devise`),
  CONSTRAINT `fk_demandes_fonds_demandeur` FOREIGN KEY (`demandeur_id`) REFERENCES `tbl_utilisateurs` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_demandes_fonds_superviseur` FOREIGN KEY (`superviseur_id`) REFERENCES `tbl_utilisateurs` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Table des demandes de fonds et bons d''achat';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tbl_demandes_fonds`
--

LOCK TABLES `tbl_demandes_fonds` WRITE;
/*!40000 ALTER TABLE `tbl_demandes_fonds` DISABLE KEYS */;
INSERT INTO `tbl_demandes_fonds` VALUES (3,'demande_fonds','approuvee',1000.00,'USD','Paiement Fonds  pour la prmotion de la culturelle','','2025-08-21 15:21:49','',4,5,'2025-08-21 11:53:49','2025-08-21 15:21:49'),(4,'bon_achat','approuvee',450.00,'USD','','','2025-08-21 12:27:03','Test middleware',4,4,'2025-08-21 11:54:31','2025-08-21 12:27:03'),(5,'bon_achat','approuvee',700.00,'USD','','','2025-08-21 12:32:28','',4,5,'2025-08-21 12:30:18','2025-08-21 12:32:28'),(6,'demande_fonds','approuvee',10000.00,'FC','Paiement transport du fournisseur PAPY 413, pour la reparation climatiseur chambre 105','','2025-08-21 12:35:55','',5,4,'2025-08-21 12:35:37','2025-08-21 12:35:55'),(7,'bon_achat','approuvee',200.00,'USD','','','2025-08-21 13:47:41','',4,5,'2025-08-21 13:46:54','2025-08-21 13:47:41'),(8,'demande_fonds','approuvee',57000.00,'FC','Paiements divers','','2025-08-21 15:14:00','',4,5,'2025-08-21 15:12:42','2025-08-21 15:14:00'),(9,'bon_achat','en_attente',15.00,'USD','','',NULL,NULL,5,NULL,'2025-08-21 15:28:09','2025-08-21 15:28:09'),(10,'bon_achat','approuvee',95.00,'USD','','','2025-08-23 13:17:49','',4,4,'2025-08-23 13:15:36','2025-08-23 13:17:49'),(11,'bon_achat','approuvee',5.00,'USD','','','2025-08-23 16:53:51','',4,4,'2025-08-23 16:52:55','2025-08-23 16:53:51'),(12,'demande_fonds','approuvee',10.00,'USD','paiement agents exterieurs','','2025-08-23 16:57:17','',4,4,'2025-08-23 16:57:12','2025-08-23 16:57:17'),(13,'demande_fonds','approuvee',10000.00,'FC','paiement transport ','','2025-08-23 16:58:16','',4,4,'2025-08-23 16:57:57','2025-08-23 16:58:16'),(14,'bon_achat','en_attente',245.00,'USD','','',NULL,NULL,10,NULL,'2025-09-12 14:38:31','2025-09-12 14:38:31');
/*!40000 ALTER TABLE `tbl_demandes_fonds` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tbl_departements`
--

DROP TABLE IF EXISTS `tbl_departements`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tbl_departements` (
  `id` int NOT NULL AUTO_INCREMENT COMMENT 'Identifiant unique du département',
  `nom` varchar(100) NOT NULL COMMENT 'Nom du département',
  `code` varchar(10) NOT NULL COMMENT 'Code unique du département',
  `description` text COMMENT 'Description du département',
  `responsable_id` int DEFAULT NULL COMMENT 'ID du responsable du département (référence tbl_utilisateurs)',
  `budget_annuel` decimal(15,2) DEFAULT NULL COMMENT 'Budget annuel du département en euros',
  `statut` enum('Actif','Inactif','En restructuration') NOT NULL DEFAULT 'Actif' COMMENT 'Statut du département',
  `date_creation` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Date de création du département',
  `couleur` varchar(7) DEFAULT NULL COMMENT 'Couleur du département (format hexadécimal #RRGGBB)',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Date de création de l''enregistrement',
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Date de mise à jour de l''enregistrement',
  PRIMARY KEY (`id`),
  UNIQUE KEY `code` (`code`),
  KEY `idx_departements_code` (`code`),
  KEY `idx_departements_statut` (`statut`),
  KEY `idx_departements_responsable_id` (`responsable_id`),
  CONSTRAINT `fk_departements_responsable` FOREIGN KEY (`responsable_id`) REFERENCES `tbl_utilisateurs` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Table des départements de l''hôtel';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tbl_departements`
--

LOCK TABLES `tbl_departements` WRITE;
/*!40000 ALTER TABLE `tbl_departements` DISABLE KEYS */;
INSERT INTO `tbl_departements` VALUES (7,'FB/cuisine','RECEPTION','Service de réception et accueil des clients',NULL,NULL,'Actif','2025-08-17 12:16:40','#3B82F6','2025-08-17 12:16:40','2025-08-17 12:26:06'),(8,'Securité','SEC','Service de nettoyage et entretien des chambres',NULL,NULL,'Actif','2025-08-17 12:16:40','#10B981','2025-08-17 12:16:40','2025-08-17 12:26:06'),(9,'FB/Restaurant','RESTAURANT','Service de restauration et bar',NULL,NULL,'Actif','2025-08-17 12:16:40','#F59E0B','2025-08-17 12:16:40','2025-08-17 12:26:06'),(10,'Finances','FIN','Service technique et maintenance',NULL,NULL,'Actif','2025-08-17 12:16:40','#EF4444','2025-08-17 12:16:40','2025-08-17 12:23:11'),(11,'Administration','ADMIN','Service administratif et gestion',4,NULL,'Actif','2025-08-17 12:16:40','#5ff799','2025-08-17 12:16:40','2025-08-17 11:52:02'),(12,'Hebergements','HEBERG','Service de sécurité et surveillance',NULL,NULL,'Actif','2025-08-17 12:16:40','#6B7280','2025-08-17 12:16:40','2025-08-17 12:24:39'),(13,'Sous dep. Audit Interne','AUDIT','Sous Departement | Finances - Audit interne & Contrôle',11,10000.00,'Actif','2025-08-17 11:34:15','#3B82F6','2025-08-17 11:34:15','2025-08-17 12:47:37');
/*!40000 ALTER TABLE `tbl_departements` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tbl_depenses`
--

DROP TABLE IF EXISTS `tbl_depenses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tbl_depenses` (
  `id` int NOT NULL AUTO_INCREMENT,
  `titre` varchar(255) NOT NULL,
  `description` text,
  `montant` decimal(10,2) NOT NULL,
  `devise` varchar(3) NOT NULL DEFAULT 'EUR',
  `categorie` enum('Maintenance','Nettoyage','Équipement','Services','Marketing','Administration','Autre') NOT NULL DEFAULT 'Autre',
  `statut` enum('En attente','Approuvée','Payée','Rejetée') NOT NULL DEFAULT 'En attente',
  `date_depense` datetime NOT NULL,
  `date_paiement` datetime DEFAULT NULL,
  `fournisseur` varchar(255) DEFAULT NULL,
  `numero_facture` varchar(100) DEFAULT NULL,
  `demandeur_id` int NOT NULL,
  `approbateur_id` int DEFAULT NULL,
  `chambre_id` int DEFAULT NULL,
  `fichiers` text,
  `notes` text,
  `tags` text,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `caisse_id` int DEFAULT NULL,
  `date_paiement_prevue` date DEFAULT NULL COMMENT 'Date prévue pour le paiement',
  `montant_paye` decimal(10,2) DEFAULT '0.00' COMMENT 'Montant déjà payé',
  `montant_restant` decimal(10,2) GENERATED ALWAYS AS ((`montant` - `montant_paye`)) STORED COMMENT 'Montant restant à payer',
  `urgence` enum('Faible','Normale','Urgente','Critique') DEFAULT 'Normale' COMMENT 'Niveau d''urgence du paiement',
  `priorite_paiement` enum('Basse','Normale','Haute','Urgente') DEFAULT 'Normale' COMMENT 'Priorité de paiement',
  `notes_paiement` text COMMENT 'Notes sur le paiement',
  `responsable_paiement_id` int DEFAULT NULL COMMENT 'ID de l''utilisateur responsable du paiement',
  `statut_paiement` enum('En attente','Partiellement payé','Payé','En retard','Annulé') DEFAULT 'En attente' COMMENT 'Statut du paiement',
  PRIMARY KEY (`id`),
  KEY `tbl_depenses_statut` (`statut`),
  KEY `tbl_depenses_categorie` (`categorie`),
  KEY `tbl_depenses_demandeur_id` (`demandeur_id`),
  KEY `tbl_depenses_approbateur_id` (`approbateur_id`),
  KEY `tbl_depenses_chambre_id` (`chambre_id`),
  KEY `tbl_depenses_date_depense` (`date_depense`),
  KEY `idx_date_paiement_prevue` (`date_paiement_prevue`),
  KEY `idx_urgence` (`urgence`),
  KEY `idx_priorite_paiement` (`priorite_paiement`),
  KEY `idx_statut_paiement` (`statut_paiement`),
  KEY `idx_montant_restant` (`montant_restant`),
  KEY `fk_depenses_responsable_paiement` (`responsable_paiement_id`),
  CONSTRAINT `fk_depenses_responsable_paiement` FOREIGN KEY (`responsable_paiement_id`) REFERENCES `tbl_utilisateurs` (`id`) ON DELETE SET NULL,
  CONSTRAINT `tbl_depenses_ibfk_151` FOREIGN KEY (`demandeur_id`) REFERENCES `tbl_utilisateurs` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `tbl_depenses_ibfk_152` FOREIGN KEY (`approbateur_id`) REFERENCES `tbl_utilisateurs` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `tbl_depenses_ibfk_153` FOREIGN KEY (`chambre_id`) REFERENCES `tbl_chambres` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tbl_depenses`
--

LOCK TABLES `tbl_depenses` WRITE;
/*!40000 ALTER TABLE `tbl_depenses` DISABLE KEYS */;
INSERT INTO `tbl_depenses` (`id`, `titre`, `description`, `montant`, `devise`, `categorie`, `statut`, `date_depense`, `date_paiement`, `fournisseur`, `numero_facture`, `demandeur_id`, `approbateur_id`, `chambre_id`, `fichiers`, `notes`, `tags`, `created_at`, `updated_at`, `caisse_id`, `date_paiement_prevue`, `montant_paye`, `urgence`, `priorite_paiement`, `notes_paiement`, `responsable_paiement_id`, `statut_paiement`) VALUES (1,'Masolo','vdfoxcui knm',1200.00,'FC','Maintenance','Payée','2025-07-31 23:43:18','2025-08-05 15:46:01','','',4,4,NULL,'[]','qwfvdijknm','[]','2025-07-31 23:43:18','2025-08-27 20:58:03',3,NULL,700.00,'Faible','Basse',NULL,NULL,'Partiellement payé'),(2,'dossier mutamba','viodfjxck',500.00,'EUR','Maintenance','Payée','2025-07-31 23:45:09','2025-08-04 10:34:54','','',4,4,NULL,'[]','','[]','2025-07-31 23:45:09','2025-08-04 10:34:54',4,NULL,0.00,'Faible','Basse',NULL,NULL,'En attente'),(3,'netoyage chambre 101','paiements des agents exterieurs ',20.00,'USD','Nettoyage','Payée','2025-08-04 10:49:10','2025-08-04 10:50:15','','fact34',4,1,NULL,'[]','pas de note sup','[]','2025-08-04 10:49:10','2025-08-04 10:50:15',1,NULL,0.00,'Faible','Basse',NULL,NULL,'En attente'),(4,'Bon d\'achat approuvé #4','Demande de fonds approuvée le 21/08/2025\nCommentaire superviseur: Test middleware\n\nDétails:\n1. Article - Qte: 10 - Prix: 5.00 USD\n2. Article - Qte: 20 - Prix: 20.00 USD\n',450.00,'USD','Autre','Approuvée','2025-08-21 12:27:03',NULL,NULL,NULL,4,5,NULL,NULL,'Générée automatiquement depuis la demande de fonds #4','[\"bon_achat\",\"auto_genere\"]','2025-08-21 12:27:03','2025-08-21 12:33:33',1,NULL,0.00,'Faible','Basse',NULL,NULL,'En attente'),(5,'Bon d\'achat approuvé #5','Demande de fonds approuvée le 21/08/2025\n\nDétails:\n1. Article - Qte: 20 - Prix: 5.00 USD\n2. Article - Qte: 30 - Prix: 20.00 USD\n',700.00,'USD','Autre','Approuvée','2025-08-21 12:32:28',NULL,NULL,NULL,4,5,NULL,NULL,'Générée automatiquement depuis la demande de fonds #5','[\"bon_achat\",\"auto_genere\"]','2025-08-21 12:32:28','2025-08-21 12:33:28',1,NULL,0.00,'Faible','Basse',NULL,NULL,'En attente'),(6,'Demande de fonds approuvée #6','Demande de fonds approuvée le 21/08/2025\nMotif: Paiement transport du fournisseur PAPY 413, pour la reparation climatiseur chambre 105\n\nDétails:\n1. Paiement transport fournisseur - Montant: 10000.00 FC\n',10000.00,'FC','Autre','Approuvée','2025-08-21 12:35:55',NULL,NULL,NULL,5,4,NULL,NULL,'Générée automatiquement depuis la demande de fonds #6','[\"demande_fonds\",\"auto_genere\"]','2025-08-21 12:35:55','2025-08-21 12:36:09',3,NULL,0.00,'Faible','Basse',NULL,NULL,'En attente'),(7,'Bon d\'achat approuvé #7','Demande de fonds approuvée le 21/08/2025\n\nDétails:\n1. Article - Qte: 10 - Prix: 5.00 USD\n2. Article - Qte: 15 - Prix: 10.00 USD\n',200.00,'USD','Autre','En attente','2025-08-21 13:47:41',NULL,NULL,NULL,4,5,NULL,NULL,'Générée automatiquement depuis la demande de fonds #7','[\"bon_achat\",\"auto_genere\"]','2025-08-21 13:47:41','2025-08-21 13:47:41',NULL,NULL,0.00,'Faible','Basse',NULL,NULL,'En attente'),(8,'Demande de fonds approuvée #8','Demande de fonds approuvée le 21/08/2025\nMotif: Paiements divers\n\nDétails:\n1. paiement transport fournisseur plombier - Montant: 12000.00 FC\n2. paiement prestation electricient - Montant: 45000.00 FC\n',57000.00,'FC','Autre','En attente','2025-08-21 15:14:00',NULL,NULL,NULL,4,5,NULL,NULL,'Générée automatiquement depuis la demande de fonds #8','[\"demande_fonds\",\"auto_genere\"]','2025-08-21 15:14:00','2025-08-21 15:14:00',NULL,NULL,0.00,'Faible','Basse',NULL,NULL,'En attente'),(9,'Demande de fonds approuvée #3','Demande de fonds approuvée le 21/08/2025\nMotif: Paiement Fonds  pour la prmotion de la culturelle\n\nDétails:\n1. Paiements redevances FPC - Montant: 1000.00 USD\n',1000.00,'USD','Autre','En attente','2025-08-21 15:21:49',NULL,NULL,NULL,4,5,NULL,NULL,'Générée automatiquement depuis la demande de fonds #3','[\"demande_fonds\",\"auto_genere\"]','2025-08-21 15:21:49','2025-08-21 15:21:49',NULL,NULL,0.00,'Faible','Basse',NULL,NULL,'En attente'),(10,'Bon d\'achat approuvé #10','Demande de fonds approuvée le 23/08/2025\n\nDétails:\n1. Article - Qte: 3 - Prix: 5.00 USD\n2. Article - Qte: 4 - Prix: 20.00 USD\n',95.00,'USD','Autre','Payée','2025-08-23 13:17:49','2025-08-23 13:20:13',NULL,NULL,4,4,NULL,NULL,'Générée automatiquement depuis la demande de fonds #10','[\"bon_achat\",\"auto_genere\"]','2025-08-23 13:17:49','2025-08-23 13:20:13',NULL,NULL,0.00,'Faible','Basse',NULL,NULL,'En attente'),(11,'Bon d\'achat approuvé #11','Demande de fonds approuvée le 23/08/2025\n\nDétails:\n1. Article - Qte: 1 - Prix: 5.00 USD\n',5.00,'USD','Autre','Payée','2025-08-23 16:53:51',NULL,NULL,NULL,4,4,NULL,NULL,'Générée automatiquement depuis la demande de fonds #11','[\"bon_achat\",\"auto_genere\"]','2025-08-23 16:53:51','2025-08-27 20:42:28',NULL,NULL,5.00,'Faible','Basse',NULL,NULL,'Payé'),(12,'Demande de fonds approuvée #12','Demande de fonds approuvée le 23/08/2025\nMotif: paiement agents exterieurs\n\nDétails:\n1. paiement transport yango - Montant: 10.00 USD\n',10.00,'USD','Autre','Payée','2025-08-23 16:57:17',NULL,NULL,NULL,4,4,NULL,NULL,'Générée automatiquement depuis la demande de fonds #12','[\"demande_fonds\",\"auto_genere\"]','2025-08-23 16:57:17','2025-08-27 20:24:28',NULL,NULL,10.00,'Faible','Basse',NULL,NULL,'Payé'),(13,'Demande de fonds approuvée #13','Demande de fonds approuvée le 23/08/2025\nMotif: paiement transport \n\nDétails:\n1. paiement transport - Montant: 10000.00 FC\n',10000.00,'FC','Autre','Approuvée','2025-08-23 16:58:16',NULL,NULL,NULL,4,4,NULL,NULL,'Générée automatiquement depuis la demande de fonds #13','[\"demande_fonds\",\"auto_genere\"]','2025-08-23 16:58:16','2025-08-27 19:48:09',NULL,NULL,0.00,'Faible','Basse',NULL,NULL,'En attente'),(14,'Test Dépense API','Dépense de test pour validation API',100.00,'EUR','Maintenance','Payée','2025-08-27 18:50:32',NULL,NULL,NULL,1,4,NULL,'[]',NULL,'[]','2025-08-27 18:50:32','2025-08-27 19:40:39',NULL,'2024-12-31',100.00,'Urgente','Haute','Test des nouveaux champs',NULL,'Payé');
/*!40000 ALTER TABLE `tbl_depenses` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tbl_elements_intervention`
--

DROP TABLE IF EXISTS `tbl_elements_intervention`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tbl_elements_intervention` (
  `id` int NOT NULL AUTO_INCREMENT,
  `fiche_execution_id` int NOT NULL COMMENT 'ID de la fiche d''exécution',
  `type` enum('materiel','outil','piece','document','formation','autre') COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Type d''élément d''intervention',
  `nom` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Nom de l''élément',
  `description` text COLLATE utf8mb4_unicode_ci COMMENT 'Description détaillée de l''élément',
  `quantite` int NOT NULL DEFAULT '1' COMMENT 'Quantité nécessaire',
  `unite` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Unité de mesure (pièces, mètres, etc.)',
  `disponible` tinyint(1) NOT NULL DEFAULT '0' COMMENT 'Si l''élément est disponible',
  `fournisseur` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Nom du fournisseur',
  `reference` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Référence du fournisseur',
  `cout_estime` decimal(10,2) DEFAULT NULL COMMENT 'Coût estimé de l''élément',
  `devise` varchar(3) COLLATE utf8mb4_unicode_ci DEFAULT 'EUR' COMMENT 'Devise du coût',
  `date_commande` datetime DEFAULT NULL COMMENT 'Date de commande',
  `date_reception` datetime DEFAULT NULL COMMENT 'Date de réception',
  `statut` enum('a_commander','commande','receptionne','utilise','retourne') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'a_commander' COMMENT 'Statut de l''élément',
  `commentaire` text COLLATE utf8mb4_unicode_ci COMMENT 'Commentaires additionnels',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_fiche_execution_id` (`fiche_execution_id`),
  KEY `idx_type` (`type`),
  KEY `idx_statut` (`statut`),
  KEY `idx_disponible` (`disponible`),
  CONSTRAINT `fk_element_intervention_fiche` FOREIGN KEY (`fiche_execution_id`) REFERENCES `tbl_fiches_execution` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Éléments d''intervention des fiches d''exécution';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tbl_elements_intervention`
--

LOCK TABLES `tbl_elements_intervention` WRITE;
/*!40000 ALTER TABLE `tbl_elements_intervention` DISABLE KEYS */;
INSERT INTO `tbl_elements_intervention` VALUES (1,1,'outil','Multimètre digital','Multimètre pour mesurer tension, courant et résistance',1,'pièce',1,'ElectroPro',NULL,45.00,'EUR',NULL,NULL,'a_commander',NULL,'2025-08-23 12:51:41','2025-08-23 12:51:41'),(2,1,'materiel','Fils électriques','Fils de remplacement pour réparations',50,'mètres',0,'ElectroPro',NULL,2.50,'EUR',NULL,NULL,'a_commander',NULL,'2025-08-23 12:51:41','2025-08-23 12:51:41'),(3,1,'piece','Interrupteurs','Interrupteurs de remplacement',5,'pièces',0,'ElectroPro',NULL,8.00,'EUR',NULL,NULL,'a_commander',NULL,'2025-08-23 12:51:41','2025-08-23 12:51:41'),(4,2,'piece','Pompe de filtration','Pompe de remplacement compatible',1,'pièce',0,'PiscinePlus',NULL,350.00,'EUR',NULL,NULL,'a_commander',NULL,'2025-08-23 12:51:41','2025-08-23 12:51:41'),(5,2,'outil','Clé à molette','Clé à molette pour démontage',1,'pièce',1,NULL,NULL,NULL,'EUR',NULL,NULL,'a_commander',NULL,'2025-08-23 12:51:41','2025-08-23 12:51:41'),(6,2,'materiel','Joint d\'étanchéité','Joint de remplacement pour la pompe',2,'pièces',0,'PiscinePlus',NULL,12.50,'EUR',NULL,NULL,'a_commander',NULL,'2025-08-23 12:51:41','2025-08-23 12:51:41'),(7,3,'outil','Tournevis test','Tournevis pour test',1,'pièce',1,NULL,NULL,15.00,'EUR',NULL,NULL,'receptionne',NULL,'2025-08-23 12:57:13','2025-08-23 12:57:13'),(8,4,'materiel','Fer à souder','',1,'pièce',1,'','',12.02,'EUR',NULL,NULL,'receptionne',NULL,'2025-08-23 15:09:36','2025-08-23 15:09:36');
/*!40000 ALTER TABLE `tbl_elements_intervention` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tbl_employes`
--

DROP TABLE IF EXISTS `tbl_employes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tbl_employes` (
  `id` int NOT NULL AUTO_INCREMENT,
  `civilite` varchar(10) NOT NULL,
  `nom_famille` varchar(100) NOT NULL,
  `nom_usage` varchar(100) DEFAULT NULL,
  `prenoms` varchar(200) NOT NULL,
  `date_naissance` date NOT NULL,
  `lieu_naissance` varchar(200) NOT NULL,
  `nationalite` varchar(100) NOT NULL,
  `numero_securite_sociale` varchar(20) DEFAULT NULL,
  `situation_famille` varchar(50) DEFAULT NULL,
  `adresse` text NOT NULL,
  `code_postal` varchar(10) NOT NULL,
  `ville` varchar(100) NOT NULL,
  `pays` varchar(100) NOT NULL,
  `telephone_personnel` varchar(20) NOT NULL,
  `telephone_domicile` varchar(20) DEFAULT NULL,
  `email_personnel` varchar(255) NOT NULL,
  `contact_urgence_nom` varchar(100) DEFAULT NULL,
  `contact_urgence_prenom` varchar(100) DEFAULT NULL,
  `contact_urgence_lien` varchar(50) DEFAULT NULL,
  `contact_urgence_telephone` varchar(20) DEFAULT NULL,
  `matricule` varchar(50) DEFAULT NULL,
  `poste` varchar(100) NOT NULL,
  `departement_id` int DEFAULT NULL,
  `sous_departement_id` int DEFAULT NULL,
  `date_embauche` date NOT NULL,
  `type_contrat` varchar(50) NOT NULL,
  `date_fin_contrat` date DEFAULT NULL,
  `temps_travail` varchar(100) NOT NULL,
  `statut` varchar(50) NOT NULL DEFAULT 'Actif',
  `niveau_classification` varchar(20) DEFAULT NULL,
  `photo_url` varchar(500) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `created_by` int DEFAULT NULL,
  `updated_by` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_nom_famille` (`nom_famille`),
  KEY `idx_prenoms` (`prenoms`),
  KEY `idx_email` (`email_personnel`),
  KEY `idx_matricule` (`matricule`),
  KEY `idx_statut` (`statut`),
  KEY `idx_date_embauche` (`date_embauche`),
  KEY `idx_employes_departement_id` (`departement_id`),
  KEY `idx_employes_sous_departement_id` (`sous_departement_id`),
  KEY `idx_employes_departement_sous_departement` (`departement_id`,`sous_departement_id`),
  CONSTRAINT `fk_employes_departement` FOREIGN KEY (`departement_id`) REFERENCES `tbl_departements` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_employes_sous_departement` FOREIGN KEY (`sous_departement_id`) REFERENCES `tbl_sous_departements` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tbl_employes`
--

LOCK TABLES `tbl_employes` WRITE;
/*!40000 ALTER TABLE `tbl_employes` DISABLE KEYS */;
INSERT INTO `tbl_employes` VALUES (1,'M.','Dupont',NULL,'Jean Pierre','1985-03-15','Paris, France','Française',NULL,NULL,'123 Rue de la Paix','75001','Paris','France','0123456789',NULL,'jean.dupont@hotel-beatrice.com',NULL,NULL,NULL,NULL,NULL,'Réceptionniste',NULL,NULL,'2023-01-15','CDI',NULL,'Temps plein','Actif',NULL,NULL,'2025-09-08 12:58:14','2025-09-08 12:58:14',NULL,NULL),(2,'Mme','Martin',NULL,'Marie Claire','1982-07-22','Lyon, France','Française',NULL,NULL,'456 Avenue des Champs','69000','Lyon','France','0987654321',NULL,'marie.martin@hotel-beatrice.com',NULL,NULL,NULL,NULL,NULL,'Chef de cuisine',NULL,NULL,'2022-06-01','CDI',NULL,'Temps plein','Actif',NULL,NULL,'2025-09-08 12:58:14','2025-09-08 12:58:14',NULL,NULL),(3,'M.','Bernard',NULL,'Pierre','1990-11-08','Marseille, France','Française',NULL,NULL,'789 Boulevard de la République','13000','Marseille','France','0147258369',NULL,'pierre.bernard@hotel-beatrice.com',NULL,NULL,NULL,NULL,NULL,'Agent d\'entretien',11,13,'2023-03-10','CDI',NULL,'Temps plein','Actif',NULL,'https://res.cloudinary.com/df5isxcdl/image/upload/v1757340648/hotel-beatrice/employees/employee_3_1757340646540.png','2025-09-08 12:58:14','2025-09-08 14:10:49',NULL,22),(4,'M.','Test',NULL,'Andy','1990-01-01','Paris','Française',NULL,NULL,'123 Rue Test','75001','Paris','France','0123456789',NULL,'jean.test@example.com',NULL,NULL,NULL,NULL,NULL,'Directeur Général',11,13,'2025-01-01','CDI',NULL,'Temps plein','Actif',NULL,'https://res.cloudinary.com/df5isxcdl/image/upload/v1757341279/hotel-beatrice/employees/employee_4_1757341278588.jpg','2025-09-08 13:38:53','2025-09-08 14:22:21',22,22),(5,'Mme','Dupont',NULL,'Marie','1985-05-15','Lyon','Française',NULL,NULL,'456 Avenue Test','69000','Lyon','France','0987654321',NULL,'marie.dupont@example.com',NULL,NULL,NULL,NULL,NULL,'Comptable',11,13,'2025-01-15','CDI',NULL,'Temps plein','Actif',NULL,NULL,'2025-09-08 13:39:14','2025-09-08 13:39:14',22,NULL),(6,'M.','Frontend',NULL,'Test','1990-01-01','Paris','Française',NULL,NULL,'123 Rue Frontend','75001','Paris','France','0123456789',NULL,'frontend.test@example.com',NULL,NULL,NULL,NULL,NULL,'Développeur',11,NULL,'2025-01-01','CDI',NULL,'Temps plein','Actif',NULL,NULL,'2025-09-08 13:46:47','2025-09-08 13:46:47',22,NULL),(7,'M.','FormData',NULL,'Test','1990-01-01','Paris','Française',NULL,NULL,'123 Rue FormData','75001','Paris','France','0123456789',NULL,'formdata.test@example.com',NULL,NULL,NULL,NULL,NULL,'Testeur',11,NULL,'2025-01-01','CDI',NULL,'Temps plein','Actif',NULL,NULL,'2025-09-08 13:47:00','2025-09-08 13:47:00',22,NULL),(8,'M.','kikadilu','palkos','palcha','1988-06-08','Kinshasa','Congolaise',NULL,'Marié(e)','6, avenue la Fleur','1022','Kinshasa','RDC','0816371059',NULL,'kiksodigital@gmail.com','mwiza','solange','Conjoint','0812374999',NULL,'Agent technicien IT',11,13,'2023-06-08','CDI',NULL,'Temps plein','Actif','A1','https://res.cloudinary.com/df5isxcdl/image/upload/v1757340582/hotel-beatrice/employees/employee_8_1757340582078.png','2025-09-08 13:49:29','2025-09-08 14:09:43',22,22),(9,'M.','TestPhoto',NULL,'Photo','1990-01-01','Paris','Française',NULL,NULL,'123 Rue Test Photo','75001','Paris','France','0123456789',NULL,'photo.test@example.com',NULL,NULL,NULL,NULL,NULL,'Testeur Photo',11,NULL,'2025-01-01','CDI',NULL,'Temps plein','Actif',NULL,NULL,'2025-09-08 13:59:32','2025-09-08 13:59:32',22,NULL),(10,'M.','TestPhoto2',NULL,'Photo2','1990-01-01','Paris','Française',NULL,NULL,'123 Rue Test Photo 2','75001','Paris','France','0123456789',NULL,'photo2.test@example.com',NULL,NULL,NULL,NULL,NULL,'Testeur Photo 2',11,NULL,'2025-01-01','CDI',NULL,'Temps plein','Actif',NULL,NULL,'2025-09-08 14:00:59','2025-09-08 14:00:59',22,NULL),(11,'M.','TestPhoto3',NULL,'Photo3','1990-01-01','Paris','Française',NULL,NULL,'123 Rue Test Photo 3','75001','Paris','France','0123456789',NULL,'photo3.test@example.com',NULL,NULL,NULL,NULL,NULL,'Testeur Photo 3',11,NULL,'2025-01-01','CDI',NULL,'Temps plein','Actif',NULL,'https://res.cloudinary.com/df5isxcdl/image/upload/v1757340121/hotel-beatrice/employees/employee_11_1757340120329.png','2025-09-08 14:02:00','2025-09-08 14:02:02',22,NULL);
/*!40000 ALTER TABLE `tbl_employes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tbl_entrepots`
--

DROP TABLE IF EXISTS `tbl_entrepots`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tbl_entrepots` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nom` varchar(255) NOT NULL,
  `type` enum('entrepôt','dépôt','magasin','zone_stockage') NOT NULL DEFAULT 'entrepôt',
  `description` text,
  `adresse` text,
  `ville` varchar(100) DEFAULT NULL,
  `code_postal` varchar(10) DEFAULT NULL,
  `pays` varchar(100) DEFAULT 'France',
  `capacite` decimal(10,2) DEFAULT NULL COMMENT 'Capacité en m³',
  `utilisation` decimal(5,2) DEFAULT NULL COMMENT 'Pourcentage d''utilisation (0-100)',
  `statut` enum('actif','inactif','maintenance','construction') NOT NULL DEFAULT 'actif',
  `responsable` varchar(255) DEFAULT NULL,
  `telephone` varchar(20) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `notes` text,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `chambre_id` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `tbl_entrepots_nom` (`nom`),
  KEY `tbl_entrepots_type` (`type`),
  KEY `tbl_entrepots_statut` (`statut`),
  KEY `tbl_entrepots_ville` (`ville`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tbl_entrepots`
--

LOCK TABLES `tbl_entrepots` WRITE;
/*!40000 ALTER TABLE `tbl_entrepots` DISABLE KEYS */;
INSERT INTO `tbl_entrepots` VALUES (1,'Entrepôt Principal','entrepôt','Entrepôt principal de l\'hôtel','123 Rue de l\'Hôtel','Paris','75001','France',1000.00,25.50,'actif','Admin Test','01 23 45 67 89','entrepot@beatrice.com','Entrepôt de test créé automatiquement','2025-08-10 17:16:13','2025-08-10 17:16:13',NULL),(2,'Economat','zone_stockage','test','6, venue la fleur','Kinshasa','1022','RDC',3000.00,100.00,'actif','Bruno Matadi','0816538484','bruno@gmail.com','test','2025-08-15 14:51:02','2025-08-15 14:51:02',NULL),(3,'Chambre froide negative','zone_stockage','test','6, onatra','Kinshasa','1200','RDC',100.00,40.00,'actif','Gauthier','0816538484','javakikso@gmail.com','','2025-09-12 14:14:48','2025-09-12 14:14:48',NULL);
/*!40000 ALTER TABLE `tbl_entrepots` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tbl_fiches_execution`
--

DROP TABLE IF EXISTS `tbl_fiches_execution`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tbl_fiches_execution` (
  `id` int NOT NULL AUTO_INCREMENT,
  `numero` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Numéro unique de la fiche d''exécution',
  `tache_id` int NOT NULL COMMENT 'ID de la tâche à exécuter',
  `titre` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Titre de la fiche d''exécution',
  `description` text COLLATE utf8mb4_unicode_ci COMMENT 'Description détaillée de l''exécution',
  `statut` enum('en_preparation','en_cours','terminee','annulee') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'en_preparation' COMMENT 'Statut de la fiche d''exécution',
  `priorite` enum('basse','normale','haute','urgente') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'normale' COMMENT 'Priorité de l''exécution',
  `date_debut_prevue` datetime DEFAULT NULL COMMENT 'Date de début prévue',
  `date_fin_prevue` datetime DEFAULT NULL COMMENT 'Date de fin prévue',
  `date_debut_reelle` datetime DEFAULT NULL COMMENT 'Date de début réelle',
  `date_fin_reelle` datetime DEFAULT NULL COMMENT 'Date de fin réelle',
  `duree_prevue` int DEFAULT NULL COMMENT 'Durée prévue en minutes',
  `duree_reelle` int DEFAULT NULL COMMENT 'Durée réelle en minutes',
  `responsable_id` int NOT NULL COMMENT 'ID de l''utilisateur responsable de l''exécution',
  `superviseur_id` int DEFAULT NULL COMMENT 'ID du superviseur',
  `commentaire` text COLLATE utf8mb4_unicode_ci COMMENT 'Commentaires additionnels',
  `resultat` text COLLATE utf8mb4_unicode_ci COMMENT 'Résultat de l''exécution',
  `satisfaction` enum('insuffisante','satisfaisante','excellente') COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Niveau de satisfaction',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `numero` (`numero`),
  KEY `idx_tache_id` (`tache_id`),
  KEY `idx_statut` (`statut`),
  KEY `idx_responsable_id` (`responsable_id`),
  KEY `idx_date_debut_prevue` (`date_debut_prevue`),
  KEY `idx_priorite` (`priorite`),
  KEY `fk_fiche_execution_superviseur` (`superviseur_id`),
  CONSTRAINT `fk_fiche_execution_responsable` FOREIGN KEY (`responsable_id`) REFERENCES `tbl_utilisateurs` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_fiche_execution_superviseur` FOREIGN KEY (`superviseur_id`) REFERENCES `tbl_utilisateurs` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_fiche_execution_tache` FOREIGN KEY (`tache_id`) REFERENCES `tbl_taches` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Fiches d''exécution des tâches';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tbl_fiches_execution`
--

LOCK TABLES `tbl_fiches_execution` WRITE;
/*!40000 ALTER TABLE `tbl_fiches_execution` DISABLE KEYS */;
INSERT INTO `tbl_fiches_execution` VALUES (1,'FE-20250821-001',1,'Maintenance système électrique','Maintenance préventive du système électrique de l\'hôtel','en_preparation','normale',NULL,NULL,NULL,NULL,NULL,NULL,4,NULL,'Vérification annuelle obligatoire',NULL,NULL,'2025-08-23 12:51:41','2025-08-23 12:51:41'),(2,'FE-20250821-002',2,'Remplacement pompe de piscine','Remplacement de la pompe de filtration de la piscine','en_preparation','haute',NULL,NULL,NULL,NULL,NULL,NULL,4,NULL,'Pompe en panne depuis hier',NULL,NULL,'2025-08-23 12:51:41','2025-08-23 12:51:41'),(3,'FE-20250823-003',1,'Test API - Maintenance test MODIFIÉE','Description modifiée via API','terminee','haute',NULL,NULL,'2025-08-23 12:57:13','2025-08-23 15:41:48',NULL,165,4,NULL,'Test de création via API',NULL,NULL,'2025-08-23 12:57:13','2025-08-23 15:41:48'),(4,'FE-20250823-004',2,'Résoudre : ampoule cassée','Tâche automatiquement créée pour résoudre la problématique : Ampoule cassée chambre  101','terminee','normale','2025-08-20 00:00:00','2025-08-31 00:00:00','2025-08-23 15:10:11','2025-08-23 15:10:23',NULL,0,16,5,'test',NULL,NULL,'2025-08-23 15:09:36','2025-08-23 15:10:23');
/*!40000 ALTER TABLE `tbl_fiches_execution` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tbl_fournisseurs`
--

DROP TABLE IF EXISTS `tbl_fournisseurs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tbl_fournisseurs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nom` varchar(255) NOT NULL,
  `email` varchar(255) DEFAULT NULL,
  `telephone` varchar(20) DEFAULT NULL,
  `adresse` text,
  `ville` varchar(100) DEFAULT NULL,
  `code_postal` varchar(10) DEFAULT NULL,
  `pays` varchar(100) DEFAULT 'France',
  `siret` varchar(14) DEFAULT NULL,
  `tva_intracom` varchar(20) DEFAULT NULL,
  `contact_principal` varchar(255) DEFAULT NULL,
  `telephone_contact` varchar(20) DEFAULT NULL,
  `email_contact` varchar(255) DEFAULT NULL,
  `conditions_paiement` varchar(100) DEFAULT '30 jours',
  `statut` enum('Actif','Inactif','En attente') DEFAULT 'Actif',
  `notes` text,
  `categorie_principale` enum('Mobilier','Équipement','Linge','Produits','Électronique','Décoration','Services','Autre') DEFAULT NULL,
  `evaluation` int DEFAULT NULL,
  `date_creation` datetime DEFAULT CURRENT_TIMESTAMP,
  `date_modification` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `siret` (`siret`),
  KEY `idx_nom` (`nom`),
  KEY `idx_email` (`email`),
  KEY `idx_statut` (`statut`),
  KEY `idx_categorie` (`categorie_principale`),
  KEY `idx_siret` (`siret`),
  CONSTRAINT `tbl_fournisseurs_chk_1` CHECK (((`evaluation` >= 1) and (`evaluation` <= 5)))
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tbl_fournisseurs`
--

LOCK TABLES `tbl_fournisseurs` WRITE;
/*!40000 ALTER TABLE `tbl_fournisseurs` DISABLE KEYS */;
INSERT INTO `tbl_fournisseurs` VALUES (1,'Mobilier Pro','contact@mobilierpro.fr','0145863254','12 Rue des Artisans','Paris','75012','France','12345678901234','FR00123456789','Jean Dupont','0612345678','j.dupont@mobilierpro.fr','30 jours','Actif','Fournisseur fiable avec livraison rapide','Mobilier',4,'2025-07-30 21:59:52','2025-07-30 21:59:52'),(2,'Linge Hotelier','ventes@lingehotelier.com','0230456789','45 Avenue des Textiles','Lyon','69003','France','23456789012345','FR00234567890','Marie Lambert','0645678912','m.lambert@lingehotelier.com','45 jours','Actif','Grand choix de linge de qualité','Linge',5,'2025-07-30 21:59:52','2025-07-30 21:59:52'),(3,'EquipResto','info@equipresto.fr','0387654321','8 Boulevard des Chefs','Lille','59000','France','34567890123456','FR00345678901','Pierre Garnier','0678912345','p.garnier@equipresto.fr','30 jours','Actif','Spécialiste équipement cuisine professionnelle','Équipement',4,'2025-07-30 21:59:52','2025-07-30 21:59:52'),(4,'Deco Pro','deco@decopro-paris.fr','0145987632','32 Rue des Créateurs','Paris','75004','France','45678901234567','FR00456789012','Sophie Marchand','0698765432','s.marchand@decopro.fr','60 jours','Actif','Décoration haut de gamme pour hôtels','Décoration',3,'2025-07-30 21:59:52','2025-07-30 21:59:52'),(5,'ElectroHotel','service-client@electrohotel.com','0498765432','5 Allée des Technologies','Nice','06000','France','56789012345678','FR00567890123','Thomas Leroy','0687654321','t.leroy@electrohotel.com','30 jours','Actif','Équipements électroniques pour chambres','Électronique',5,'2025-07-30 21:59:52','2025-07-30 21:59:52'),(6,'Produits Net','contact@produitsnet.fr','0255432167','17 Rue de l\'Hygiène','Nantes','44000','France','67890123456789','FR00678901234','Laura Bertrand','0654321876','l.bertrand@produitsnet.fr','30 jours','Actif','Produits d\'entretien professionnels','Produits',4,'2025-07-30 21:59:52','2025-07-30 21:59:52'),(7,'Service Proprete','direction@serviceproprete.com','0132654987','9 Impasse des Services','Marseille','13001','France','78901234567890','FR00789012345','Marc Vidal','0699887766','m.vidal@serviceproprete.com','45 jours','Actif','Services de nettoyage professionnel','Services',3,'2025-07-30 21:59:52','2025-07-30 21:59:52'),(8,'Luminaires Elegance','lumieres@elegance.fr','0144876598','22 Rue de la Lumière','Toulouse','31000','France','89012345678901','FR00890123456','Élodie Clair','0633445566','e.clair@elegance.fr','30 jours','Inactif','Ancien fournisseur - à recontacter','Décoration',2,'2025-07-30 21:59:52','2025-07-30 21:59:52'),(9,'Textiles Horizon','info@textileshorizon.com','0388996655','76 Avenue des Tissus','Strasbourg','67000','France','90123456789012','FR00901234567','Nathalie Roux','0677889955','n.roux@textileshorizon.com','30 jours','En attente','Nouveau fournisseur en évaluation','Linge',NULL,'2025-07-30 21:59:52','2025-07-30 21:59:52'),(10,'Mobilier Discount','contact@mobilierdiscount.fr','0599663377','3 Rue des Affaires','Bordeaux','33000','France','01234567890123','FR00012345678','Paul Economie','0644556677','p.economie@mobilierdiscount.fr','Paiement comptant','Actif','Mobilier économique pour petits budgets','Mobilier',3,'2025-07-30 21:59:52','2025-07-30 21:59:52');
/*!40000 ALTER TABLE `tbl_fournisseurs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tbl_inventaire`
--

DROP TABLE IF EXISTS `tbl_inventaire`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tbl_inventaire` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nom` varchar(255) NOT NULL,
  `description` text,
  `categorie` enum('Mobilier','Équipement','Linge','Produits','Électronique','Décoration','Autre') NOT NULL DEFAULT 'Autre',
  `quantite` int NOT NULL DEFAULT '0',
  `quantite_min` int NOT NULL DEFAULT '0',
  `unite` varchar(20) NOT NULL DEFAULT 'pièce',
  `prix_unitaire` decimal(10,2) DEFAULT NULL,
  `fournisseur` varchar(255) DEFAULT NULL,
  `numero_reference` varchar(100) DEFAULT NULL,
  `emplacement` varchar(255) DEFAULT NULL,
  `statut` enum('Disponible','En rupture','En commande','Hors service') NOT NULL DEFAULT 'Disponible',
  `date_achat` datetime DEFAULT NULL,
  `date_expiration` datetime DEFAULT NULL,
  `responsable_id` int DEFAULT NULL,
  `chambre_id` int DEFAULT NULL,
  `notes` text,
  `tags` text,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `code_produit` varchar(255) DEFAULT NULL,
  `qr_code_article` varchar(255) DEFAULT NULL,
  `nature` varchar(255) DEFAULT NULL,
  `emplacement_id` int DEFAULT NULL,
  `sous_categorie` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `tbl_inventaire_categorie` (`categorie`),
  KEY `tbl_inventaire_statut` (`statut`),
  KEY `tbl_inventaire_responsable_id` (`responsable_id`),
  KEY `tbl_inventaire_chambre_id` (`chambre_id`),
  KEY `tbl_inventaire_nom` (`nom`),
  KEY `tbl_inventaire_code_produit` (`code_produit`),
  KEY `tbl_inventaire_qr_code_article` (`qr_code_article`),
  KEY `tbl_inventaire_emplacement_id` (`emplacement_id`),
  KEY `tbl_inventaire_nature` (`nature`),
  KEY `tbl_inventaire_sous_categorie` (`sous_categorie`),
  CONSTRAINT `tbl_inventaire_ibfk_59` FOREIGN KEY (`responsable_id`) REFERENCES `tbl_utilisateurs` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `tbl_inventaire_ibfk_60` FOREIGN KEY (`chambre_id`) REFERENCES `tbl_chambres` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tbl_inventaire`
--

LOCK TABLES `tbl_inventaire` WRITE;
/*!40000 ALTER TABLE `tbl_inventaire` DISABLE KEYS */;
INSERT INTO `tbl_inventaire` VALUES (1,'ampoule led phillips','ampoule led','Électronique',85,5,'pièce',5.00,'luminous','ref/139','on site','En commande',NULL,NULL,NULL,NULL,'test',NULL,'2025-07-30 18:58:27','2025-08-23 16:39:28','COD-001-001',NULL,NULL,NULL,NULL),(2,'Drap Louis vuitton','Drap de luxe','Linge',73,5,'pièce',10.00,'luminous','','','Disponible',NULL,NULL,NULL,NULL,'',NULL,'2025-07-31 17:19:29','2025-08-26 22:58:37','COD-002-053',NULL,NULL,NULL,NULL),(3,'ampoules appolo','Ampoule Appolo Beltexco','Électronique',98,5,'pièce',4.00,'','ref/1345','on site','Disponible',NULL,NULL,NULL,NULL,'bio',NULL,'2025-08-10 17:35:21','2025-08-19 21:15:05','PROD-1754847280772-893','QR-1754847281720-352','Durable',1,'Éclairage'),(4,'chaise','chaise de luxe','Mobilier',62,5,'pièce',20.00,'','ref/34567','on site','Disponible',NULL,NULL,NULL,NULL,'bio',NULL,'2025-08-10 18:19:32','2025-08-23 16:44:20','PROD-1754849923180-857','QR-1754849924462-352','Mobilier',1,'Chaises'),(5,'coussins','tests','Équipement',100,5,'pièce',10.00,'luminous','Ref wayne 12','fdbdfxbvedfbv','Disponible',NULL,NULL,NULL,NULL,'test',NULL,'2025-09-01 17:37:04','2025-09-01 17:37:04','PROD-1756748194705-749','QR-1756748195488-820','Équipement',1,'Équipement de nettoyage');
/*!40000 ALTER TABLE `tbl_inventaire` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tbl_lignes_achat`
--

DROP TABLE IF EXISTS `tbl_lignes_achat`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tbl_lignes_achat` (
  `id` int NOT NULL AUTO_INCREMENT,
  `achat_id` int NOT NULL,
  `inventaire_id` int DEFAULT NULL,
  `description` varchar(500) NOT NULL,
  `quantite` int NOT NULL,
  `quantite_recue` int DEFAULT '0',
  `prix_unitaire` decimal(10,2) NOT NULL,
  `taux_tva` decimal(5,2) DEFAULT '20.00',
  `montant_ht` decimal(10,2) DEFAULT '0.00',
  `montant_tva` decimal(10,2) DEFAULT '0.00',
  `montant_ttc` decimal(10,2) DEFAULT '0.00',
  `unite` varchar(20) DEFAULT 'pièce',
  `reference_fournisseur` varchar(100) DEFAULT NULL,
  `notes` text,
  `date_livraison_souhaitee` date DEFAULT NULL,
  `statut` enum('En attente','Commandée','Partiellement livrée','Livrée','Annulée') DEFAULT 'En attente',
  PRIMARY KEY (`id`),
  KEY `idx_achat` (`achat_id`),
  KEY `idx_inventaire` (`inventaire_id`),
  KEY `idx_statut` (`statut`),
  CONSTRAINT `tbl_lignes_achat_ibfk_1` FOREIGN KEY (`achat_id`) REFERENCES `tbl_achats` (`id`) ON DELETE CASCADE,
  CONSTRAINT `tbl_lignes_achat_ibfk_2` FOREIGN KEY (`inventaire_id`) REFERENCES `tbl_inventaire` (`id`) ON DELETE SET NULL,
  CONSTRAINT `tbl_lignes_achat_chk_1` CHECK ((`quantite` > 0)),
  CONSTRAINT `tbl_lignes_achat_chk_2` CHECK ((`prix_unitaire` >= 0))
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tbl_lignes_achat`
--

LOCK TABLES `tbl_lignes_achat` WRITE;
/*!40000 ALTER TABLE `tbl_lignes_achat` DISABLE KEYS */;
INSERT INTO `tbl_lignes_achat` VALUES (1,2,1,'Produit 1',10,0,5.00,20.00,50.00,10.00,60.00,'pièce',NULL,NULL,NULL,'En attente'),(2,2,2,'Produit 2',20,0,10.00,20.00,200.00,40.00,240.00,'pièce',NULL,NULL,NULL,'En attente'),(3,3,2,'bioo',10,0,10.00,20.00,100.00,20.00,120.00,'pièce',NULL,NULL,NULL,'En attente'),(4,4,1,'minda',100,0,5.00,20.00,500.00,100.00,600.00,'pièce',NULL,NULL,NULL,'En attente'),(5,5,4,'Produit 4',50,0,20.00,20.00,1000.00,200.00,1200.00,'pièce',NULL,NULL,NULL,'En attente');
/*!40000 ALTER TABLE `tbl_lignes_achat` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tbl_lignes_demandes_fonds`
--

DROP TABLE IF EXISTS `tbl_lignes_demandes_fonds`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tbl_lignes_demandes_fonds` (
  `id` int NOT NULL AUTO_INCREMENT,
  `demande_fonds_id` int NOT NULL COMMENT 'ID de la demande de fonds',
  `type_ligne` enum('libelle','article') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'libelle' COMMENT 'Type de ligne',
  `libelle` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Libellé de la dépense (pour demande de fonds)',
  `montant` decimal(10,2) NOT NULL COMMENT 'Montant de la ligne',
  `devise` enum('EUR','USD','FC') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'EUR' COMMENT 'Devise de la ligne',
  `inventaire_id` int DEFAULT NULL COMMENT 'ID de l''article (pour bon d''achat)',
  `quantite` int DEFAULT '1' COMMENT 'Quantité (pour bon d''achat)',
  `prix_unitaire` decimal(10,2) DEFAULT NULL COMMENT 'Prix unitaire (pour bon d''achat)',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Date de création',
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Date de mise à jour',
  PRIMARY KEY (`id`),
  KEY `idx_demande_fonds_id` (`demande_fonds_id`),
  KEY `idx_type_ligne` (`type_ligne`),
  KEY `idx_inventaire_id` (`inventaire_id`),
  KEY `idx_devise` (`devise`),
  CONSTRAINT `fk_lignes_demandes_fonds_demande` FOREIGN KEY (`demande_fonds_id`) REFERENCES `tbl_demandes_fonds` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_lignes_demandes_fonds_inventaire` FOREIGN KEY (`inventaire_id`) REFERENCES `tbl_inventaire` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=24 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Table des lignes de demandes de fonds et bons d''achat';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tbl_lignes_demandes_fonds`
--

LOCK TABLES `tbl_lignes_demandes_fonds` WRITE;
/*!40000 ALTER TABLE `tbl_lignes_demandes_fonds` DISABLE KEYS */;
INSERT INTO `tbl_lignes_demandes_fonds` VALUES (5,3,'libelle','Paiements redevances FPC',1000.00,'USD',NULL,1,NULL,'2025-08-21 11:53:49','2025-08-21 11:53:49'),(6,4,'article',NULL,50.00,'USD',1,10,5.00,'2025-08-21 11:54:31','2025-08-21 11:54:31'),(7,4,'article',NULL,400.00,'USD',4,20,20.00,'2025-08-21 11:54:31','2025-08-21 11:54:31'),(8,5,'article',NULL,100.00,'USD',1,20,5.00,'2025-08-21 12:30:18','2025-08-21 12:30:18'),(9,5,'article',NULL,600.00,'USD',4,30,20.00,'2025-08-21 12:30:18','2025-08-21 12:30:18'),(10,6,'libelle','Paiement transport fournisseur',10000.00,'FC',NULL,1,NULL,'2025-08-21 12:35:37','2025-08-21 12:35:37'),(11,7,'article',NULL,50.00,'USD',1,10,5.00,'2025-08-21 13:46:54','2025-08-21 13:46:54'),(12,7,'article',NULL,150.00,'USD',2,15,10.00,'2025-08-21 13:46:54','2025-08-21 13:46:54'),(13,8,'libelle','paiement transport fournisseur plombier',12000.00,'FC',NULL,1,NULL,'2025-08-21 15:12:42','2025-08-21 15:12:42'),(14,8,'libelle','paiement prestation electricient',45000.00,'FC',NULL,1,NULL,'2025-08-21 15:12:42','2025-08-21 15:12:42'),(15,9,'article',NULL,5.00,'USD',1,1,5.00,'2025-08-21 15:28:09','2025-08-21 15:28:09'),(16,9,'article',NULL,10.00,'USD',2,1,10.00,'2025-08-21 15:28:09','2025-08-21 15:28:09'),(17,10,'article',NULL,15.00,'USD',1,3,5.00,'2025-08-23 13:15:36','2025-08-23 13:15:36'),(18,10,'article',NULL,80.00,'USD',4,4,20.00,'2025-08-23 13:15:36','2025-08-23 13:15:36'),(19,11,'article',NULL,5.00,'USD',1,1,5.00,'2025-08-23 16:52:55','2025-08-23 16:52:55'),(20,12,'libelle','paiement transport yango',10.00,'USD',NULL,1,NULL,'2025-08-23 16:57:12','2025-08-23 16:57:12'),(21,13,'libelle','paiement transport',10000.00,'FC',NULL,1,NULL,'2025-08-23 16:57:57','2025-08-23 16:57:57'),(22,14,'article',NULL,5.00,'USD',1,1,5.00,'2025-09-12 14:38:31','2025-09-12 14:38:31'),(23,14,'article',NULL,240.00,'USD',4,12,20.00,'2025-09-12 14:38:31','2025-09-12 14:38:31');
/*!40000 ALTER TABLE `tbl_lignes_demandes_fonds` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tbl_maintenance_articles`
--

DROP TABLE IF EXISTS `tbl_maintenance_articles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tbl_maintenance_articles` (
  `id` int NOT NULL AUTO_INCREMENT,
  `cycle_vie_id` int NOT NULL,
  `type_maintenance` enum('Preventive','Corrective','Predictive','Conditionnelle') NOT NULL,
  `description` text NOT NULL,
  `technicien_id` int DEFAULT NULL,
  `date_debut_maintenance` datetime DEFAULT NULL,
  `date_fin_maintenance` datetime DEFAULT NULL,
  `cout_maintenance` decimal(12,2) DEFAULT NULL,
  `pieces_remplacees` text,
  `resultat` enum('Reussi','Partiel','Echec') DEFAULT 'Reussi',
  `prochaine_maintenance` date DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_cycle_vie_id` (`cycle_vie_id`),
  KEY `idx_type_maintenance` (`type_maintenance`),
  KEY `idx_date_debut` (`date_debut_maintenance`),
  CONSTRAINT `tbl_maintenance_articles_ibfk_1` FOREIGN KEY (`cycle_vie_id`) REFERENCES `tbl_cycle_vie_articles` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tbl_maintenance_articles`
--

LOCK TABLES `tbl_maintenance_articles` WRITE;
/*!40000 ALTER TABLE `tbl_maintenance_articles` DISABLE KEYS */;
INSERT INTO `tbl_maintenance_articles` VALUES (1,6,'Preventive','Maintenance préventive trimestrielle - Vérification et nettoyage',5,'2025-01-15 09:00:00','2025-01-15 11:00:00',5000.00,'Filtres, joints','Reussi','2025-04-15');
/*!40000 ALTER TABLE `tbl_maintenance_articles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tbl_mouvements_stock`
--

DROP TABLE IF EXISTS `tbl_mouvements_stock`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tbl_mouvements_stock` (
  `id` int NOT NULL AUTO_INCREMENT,
  `inventaire_id` int NOT NULL,
  `type_mouvement` enum('Entrée','Sortie','Ajustement','Transfert','Perte','Retour') NOT NULL,
  `quantite` int NOT NULL,
  `quantite_avant` int NOT NULL DEFAULT '0',
  `quantite_apres` int NOT NULL DEFAULT '0',
  `prix_unitaire` decimal(10,2) DEFAULT NULL,
  `montant_total` decimal(10,2) DEFAULT NULL,
  `motif` varchar(255) DEFAULT NULL,
  `reference_document` varchar(100) DEFAULT NULL,
  `numero_document` varchar(50) DEFAULT NULL,
  `achat_id` int DEFAULT NULL,
  `utilisateur_id` int NOT NULL,
  `chambre_id` int DEFAULT NULL,
  `emplacement_source` varchar(100) DEFAULT NULL,
  `emplacement_destination` varchar(100) DEFAULT NULL,
  `date_mouvement` datetime DEFAULT CURRENT_TIMESTAMP,
  `notes` text,
  `etat_linge` enum('Propre','Sale','En cours','Perdu','Endommagé') DEFAULT 'Propre',
  `priorite` enum('Urgente','Normale','Basse') DEFAULT 'Normale',
  `date_retour_prevue` date DEFAULT NULL,
  `responsable_id` int DEFAULT NULL,
  `categorie` varchar(50) DEFAULT 'general',
  `statut` enum('En attente','Validé','Annulé') DEFAULT 'Validé',
  `date_creation` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `chambre_id` (`chambre_id`),
  KEY `idx_inventaire` (`inventaire_id`),
  KEY `idx_type_mouvement` (`type_mouvement`),
  KEY `idx_date_mouvement` (`date_mouvement`),
  KEY `idx_utilisateur` (`utilisateur_id`),
  KEY `idx_achat` (`achat_id`),
  KEY `idx_statut` (`statut`),
  KEY `idx_categorie` (`categorie`),
  KEY `idx_etat_linge` (`etat_linge`),
  KEY `idx_priorite` (`priorite`),
  KEY `idx_date_retour_prevue` (`date_retour_prevue`),
  CONSTRAINT `tbl_mouvements_stock_ibfk_1` FOREIGN KEY (`inventaire_id`) REFERENCES `tbl_inventaire` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `tbl_mouvements_stock_ibfk_2` FOREIGN KEY (`achat_id`) REFERENCES `tbl_achats` (`id`) ON DELETE SET NULL,
  CONSTRAINT `tbl_mouvements_stock_ibfk_3` FOREIGN KEY (`utilisateur_id`) REFERENCES `tbl_utilisateurs` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `tbl_mouvements_stock_ibfk_4` FOREIGN KEY (`chambre_id`) REFERENCES `tbl_chambres` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=42 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tbl_mouvements_stock`
--

LOCK TABLES `tbl_mouvements_stock` WRITE;
/*!40000 ALTER TABLE `tbl_mouvements_stock` DISABLE KEYS */;
INSERT INTO `tbl_mouvements_stock` VALUES (1,1,'Entrée',10,50,60,5.00,50.00,'Sokoto','REFpro23','BL-23488',NULL,2,6,'Entrepôt','Chambre 101','2025-07-31 21:19:33','pro','Propre','Normale',NULL,NULL,'general','Validé','2025-07-31 21:19:33'),(2,1,'Sortie',3,60,57,5.00,15.00,'Sokoto','REFpro23','BL-23488',NULL,2,6,'Entrepôt','Chambre 101','2025-07-31 21:20:38','cfdgnhmj,mgfdsf','Propre','Normale',NULL,NULL,'general','Validé','2025-07-31 21:20:38'),(3,1,'Entrée',3,57,60,5.00,15.00,'Sokoto','REFpro23','BL-23488',NULL,2,6,'Entrepôt','Chambre 101','2025-07-31 21:22:20','iljkhguigyjklhbk','Propre','Normale',NULL,NULL,'general','Validé','2025-07-31 21:22:20'),(4,1,'Entrée',15,60,75,5.00,75.00,'Sokoto','REFpro23','BL-23488',NULL,2,6,'Entrepôt','Chambre 101','2025-07-31 21:23:08','zsgdhfjghj,gf','Propre','Normale',NULL,NULL,'general','Validé','2025-07-31 21:23:08'),(5,1,'Sortie',20,75,55,5.00,100.00,'Sokoto','REFpro23','BL-23488',NULL,2,6,'Entrepôt','Chambre 101','2025-07-31 21:25:27','fd8vcxio ucxkl','Propre','Normale',NULL,NULL,'general','Validé','2025-07-31 21:25:27'),(6,1,'Sortie',40,55,15,5.00,200.00,'qwdj','REFpro23','BL-23488',NULL,2,6,'Entrepôt','Chambre 101','2025-07-31 21:25:57','iykhbn','Propre','Normale',NULL,NULL,'general','Validé','2025-07-31 21:25:57'),(7,1,'Entrée',100,0,0,5.00,600.00,'Réception achat CMD-20250731-403','Achat','CMD-20250731-403',4,2,NULL,'Fournisseur','Entrepôt','2025-07-31 21:36:28','Entrée automatique depuis l\'achat CMD-20250731-403','Propre','Normale',NULL,NULL,'general','Validé','2025-07-31 21:36:28'),(8,1,'Sortie',5,115,110,5.00,25.00,'Sokoto','REFpro23','BL-23488',NULL,2,7,'Entrepôt','Chambre 102','2025-07-31 21:37:42','rgefnbv kj,','Propre','Normale',NULL,NULL,'general','Validé','2025-07-31 21:37:42'),(9,1,'Sortie',3,110,107,5.00,15.00,'Affectation','DemandeAffectation','2',NULL,2,10,NULL,NULL,'2025-08-19 15:34:56',NULL,'Propre','Normale',NULL,NULL,'general','Validé','2025-08-19 15:34:56'),(10,1,'Sortie',3,107,104,5.00,15.00,'Affectation','DemandeAffectation','3',NULL,2,12,NULL,NULL,'2025-08-19 16:47:54',NULL,'Propre','Normale',NULL,NULL,'general','Validé','2025-08-19 16:47:54'),(11,2,'Sortie',5,100,95,10.00,50.00,'Affectation','DemandeAffectation','3',NULL,2,12,NULL,NULL,'2025-08-19 16:47:54',NULL,'Propre','Normale',NULL,NULL,'linge','Validé','2025-08-19 16:47:54'),(13,4,'Entrée',50,0,0,20.00,1200.00,'Réception achat CMD-20250819-370','Achat','CMD-20250819-370',5,2,NULL,'Fournisseur','Entrepôt','2025-08-19 20:21:18','Entrée automatique depuis l\'achat CMD-20250819-370','Propre','Normale',NULL,NULL,'general','Validé','2025-08-19 20:21:18'),(14,4,'Sortie',3,68,65,20.00,60.00,'Affectation (corrigé)','DemandeAffectation','5',NULL,2,20,NULL,NULL,'2025-08-19 20:22:27',NULL,'Propre','Normale',NULL,NULL,'general','Validé','2025-08-19 20:22:27'),(15,1,'Sortie',3,104,101,5.00,15.00,'Affectation','DemandeAffectation','6',NULL,2,6,NULL,NULL,'2025-08-19 20:50:40',NULL,'Propre','Normale',NULL,NULL,'general','Validé','2025-08-19 20:50:40'),(16,2,'Sortie',2,95,93,10.00,20.00,'Affectation','DemandeAffectation','7',NULL,2,6,NULL,NULL,'2025-08-19 20:52:32',NULL,'Propre','Normale',NULL,NULL,'linge','Validé','2025-08-19 20:52:32'),(17,2,'Sortie',2,93,91,10.00,20.00,'Affectation','DemandeAffectation','8',NULL,2,20,NULL,NULL,'2025-08-19 21:15:05',NULL,'Propre','Normale',NULL,NULL,'linge','Validé','2025-08-19 21:15:05'),(18,3,'Sortie',2,100,98,4.00,8.00,'Affectation','DemandeAffectation','8',NULL,2,20,NULL,NULL,'2025-08-19 21:15:05',NULL,'Propre','Normale',NULL,NULL,'general','Validé','2025-08-19 21:15:05'),(19,4,'Sortie',1,65,64,20.00,20.00,'Affectation','DemandeAffectation','8',NULL,2,20,NULL,NULL,'2025-08-19 21:15:05',NULL,'Propre','Normale',NULL,NULL,'general','Validé','2025-08-19 21:15:05'),(20,1,'Sortie',5,101,96,5.00,25.00,'Affectation','DemandeAffectation','9',NULL,2,28,NULL,NULL,'2025-08-20 12:58:09',NULL,'Propre','Normale',NULL,NULL,'general','Validé','2025-08-20 12:58:09'),(21,1,'Sortie',4,96,92,5.00,20.00,'Affectation','DemandeAffectation','9',NULL,2,17,NULL,NULL,'2025-08-20 12:58:09',NULL,'Propre','Normale',NULL,NULL,'general','Validé','2025-08-20 12:58:09'),(22,1,'Sortie',2,92,90,5.00,10.00,'Affectation','DemandeAffectation','10',NULL,2,10,NULL,NULL,'2025-08-20 13:01:22',NULL,'Propre','Normale',NULL,NULL,'general','Validé','2025-08-20 13:01:22'),(23,1,'Sortie',1,90,89,5.00,5.00,'Affectation','DemandeAffectation','11',NULL,2,6,NULL,NULL,'2025-08-21 14:25:57',NULL,'Propre','Normale',NULL,NULL,'general','Validé','2025-08-21 14:25:57'),(24,2,'Sortie',2,91,89,10.00,20.00,'Affectation','DemandeAffectation','11',NULL,2,6,NULL,NULL,'2025-08-21 14:25:57',NULL,'Propre','Normale',NULL,NULL,'linge','Validé','2025-08-21 14:25:57'),(25,1,'Sortie',4,89,85,5.00,20.00,'Affectation','DemandeAffectation','12',NULL,2,10,NULL,NULL,'2025-08-23 16:39:28',NULL,'Propre','Normale',NULL,NULL,'general','Validé','2025-08-23 16:39:28'),(26,4,'Sortie',2,64,62,20.00,40.00,'Affectation','DemandeAffectation','13',NULL,2,10,NULL,NULL,'2025-08-23 16:44:20',NULL,'Propre','Normale',NULL,NULL,'general','Validé','2025-08-23 16:44:20'),(27,2,'Sortie',1,89,88,10.00,10.00,'Affectation','DemandeAffectation','13',NULL,2,10,NULL,NULL,'2025-08-23 16:44:20',NULL,'Propre','Normale',NULL,NULL,'linge','Validé','2025-08-23 16:44:20');
/*!40000 ALTER TABLE `tbl_mouvements_stock` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tbl_notifications`
--

DROP TABLE IF EXISTS `tbl_notifications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tbl_notifications` (
  `id` int NOT NULL AUTO_INCREMENT,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `message` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` enum('info','success','warning','error','urgent') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'info',
  `link` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `target_roles` text COLLATE utf8mb4_unicode_ci,
  `created_by` int DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_type` (`type`),
  KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tbl_notifications`
--

LOCK TABLES `tbl_notifications` WRITE;
/*!40000 ALTER TABLE `tbl_notifications` DISABLE KEYS */;
/*!40000 ALTER TABLE `tbl_notifications` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tbl_organigramme`
--

DROP TABLE IF EXISTS `tbl_organigramme`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tbl_organigramme` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nom` varchar(255) NOT NULL,
  `description` text,
  `niveau` int NOT NULL DEFAULT '1',
  `parent_id` int DEFAULT NULL,
  `employe_id` int DEFAULT NULL,
  `ordre` int DEFAULT '0',
  `couleur` varchar(7) DEFAULT '#3B82F6',
  `statut` enum('Actif','Inactif') DEFAULT 'Actif',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `created_by` int DEFAULT NULL,
  `updated_by` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `created_by` (`created_by`),
  KEY `updated_by` (`updated_by`),
  KEY `idx_parent_id` (`parent_id`),
  KEY `idx_employe_id` (`employe_id`),
  KEY `idx_niveau` (`niveau`),
  KEY `idx_ordre` (`ordre`),
  KEY `idx_statut` (`statut`),
  CONSTRAINT `tbl_organigramme_ibfk_1` FOREIGN KEY (`parent_id`) REFERENCES `tbl_organigramme` (`id`) ON DELETE CASCADE,
  CONSTRAINT `tbl_organigramme_ibfk_2` FOREIGN KEY (`employe_id`) REFERENCES `tbl_employes` (`id`) ON DELETE SET NULL,
  CONSTRAINT `tbl_organigramme_ibfk_3` FOREIGN KEY (`created_by`) REFERENCES `tbl_utilisateurs` (`id`) ON DELETE SET NULL,
  CONSTRAINT `tbl_organigramme_ibfk_4` FOREIGN KEY (`updated_by`) REFERENCES `tbl_utilisateurs` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tbl_organigramme`
--

LOCK TABLES `tbl_organigramme` WRITE;
/*!40000 ALTER TABLE `tbl_organigramme` DISABLE KEYS */;
INSERT INTO `tbl_organigramme` VALUES (1,'Patron','Direction Générale',1,NULL,NULL,1,'#1E40AF','Actif','2025-09-08 14:29:34','2025-09-10 12:52:20',NULL,22),(2,'Directeur Général','Direction Générale',1,1,8,2,'#1E40AF','Actif','2025-09-08 14:29:34','2025-09-08 15:49:36',NULL,22),(3,'Superviseur RH','Supervision des Ressources Humaines',2,2,2,1,'#3B82F6','Actif','2025-09-08 14:29:34','2025-09-09 14:33:12',NULL,22),(4,'Superviseur Finance','Supervision des Finances',2,2,5,2,'#3B82F6','Actif','2025-09-08 14:29:34','2025-09-09 11:09:07',NULL,22),(5,'Superviseur Stock','Supervision du Stock',2,2,NULL,3,'#3B82F6','Actif','2025-09-08 14:29:34','2025-09-08 14:29:34',NULL,NULL),(6,'Superviseur Opérations','Supervision des Opérations',2,2,NULL,4,'#3B82F6','Actif','2025-09-08 14:29:34','2025-09-08 14:29:34',NULL,NULL),(7,'Responsable RH','Responsable des Ressources Humaines',3,3,10,1,'#6B7280','Actif','2025-09-08 14:29:34','2025-09-10 12:51:56',NULL,22),(8,'Responsable Finances','Responsable des Finances',3,4,NULL,1,'#6B7280','Actif','2025-09-08 14:29:34','2025-09-08 15:48:52',NULL,22),(9,'Responsable Stock','Responsable du Stock',3,5,NULL,1,'#6B7280','Actif','2025-09-08 14:29:34','2025-09-08 14:29:34',NULL,NULL),(10,'Responsable Opérations','Responsable des Opérations',3,6,NULL,1,'#6B7280','Actif','2025-09-08 14:29:34','2025-09-08 14:29:34',NULL,NULL),(11,'Agent RH','Agent des Ressources Humaines',4,7,NULL,1,'#9CA3AF','Actif','2025-09-08 14:29:34','2025-09-08 14:29:34',NULL,NULL),(12,'Assistant RH','Assistant des Ressources Humaines',4,7,NULL,2,'#9CA3AF','Actif','2025-09-08 14:29:34','2025-09-08 14:29:34',NULL,NULL),(13,'Comptable','Comptable',4,8,NULL,1,'#9CA3AF','Actif','2025-09-08 14:29:34','2025-09-08 14:29:34',NULL,NULL),(14,'Guichetier','Guichetier',4,8,NULL,2,'#9CA3AF','Actif','2025-09-08 14:29:34','2025-09-08 14:29:34',NULL,NULL),(15,'Agent Stock','Agent du Stock',4,9,NULL,1,'#9CA3AF','Actif','2025-09-08 14:29:34','2025-09-08 14:29:34',NULL,NULL),(16,'Agent Opérations','Agent des Opérations',4,10,NULL,1,'#9CA3AF','Actif','2025-09-08 14:29:34','2025-09-08 14:29:34',NULL,NULL);
/*!40000 ALTER TABLE `tbl_organigramme` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tbl_paiements`
--

DROP TABLE IF EXISTS `tbl_paiements`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tbl_paiements` (
  `id` int NOT NULL AUTO_INCREMENT,
  `reference` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Référence unique du paiement',
  `montant` decimal(10,2) NOT NULL COMMENT 'Montant du paiement',
  `devise` varchar(3) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'EUR' COMMENT 'Devise du paiement (EUR, USD, etc.)',
  `type_paiement` enum('Espèces','Carte bancaire','Chèque','Virement','Autre') COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Type de paiement',
  `statut` enum('En attente','Validé','Rejeté','Annulé') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'En attente' COMMENT 'Statut du paiement',
  `date_paiement` datetime NOT NULL COMMENT 'Date et heure du paiement',
  `description` text COLLATE utf8mb4_unicode_ci COMMENT 'Description détaillée du paiement',
  `beneficiaire` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Nom du bénéficiaire',
  `utilisateur_id` int NOT NULL COMMENT 'ID de l''utilisateur qui effectue le paiement',
  `caisse_id` int DEFAULT NULL COMMENT 'ID de la caisse associée (optionnel)',
  `chambre_id` int DEFAULT NULL COMMENT 'ID de la chambre associée (optionnel)',
  `depense_id` int DEFAULT NULL COMMENT 'ID de la dépense associée (optionnel)',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Date de création',
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Date de modification',
  `numero_cheque` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_guichet_id` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_reference` (`reference`),
  KEY `idx_utilisateur_id` (`utilisateur_id`),
  KEY `idx_caisse_id` (`caisse_id`),
  KEY `idx_chambre_id` (`chambre_id`),
  KEY `idx_depense_id` (`depense_id`),
  KEY `idx_statut` (`statut`),
  KEY `idx_type_paiement` (`type_paiement`),
  KEY `idx_date_paiement` (`date_paiement`),
  KEY `idx_created_at` (`created_at`),
  KEY `idx_paiements_composite` (`utilisateur_id`,`statut`,`date_paiement`),
  CONSTRAINT `fk_paiements_caisse` FOREIGN KEY (`caisse_id`) REFERENCES `tbl_caisses` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_paiements_chambre` FOREIGN KEY (`chambre_id`) REFERENCES `tbl_chambres` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_paiements_depense` FOREIGN KEY (`depense_id`) REFERENCES `tbl_depenses` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_paiements_utilisateur` FOREIGN KEY (`utilisateur_id`) REFERENCES `tbl_utilisateurs` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Table des paiements du système';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tbl_paiements`
--

LOCK TABLES `tbl_paiements` WRITE;
/*!40000 ALTER TABLE `tbl_paiements` DISABLE KEYS */;
INSERT INTO `tbl_paiements` VALUES (1,'PAY-2024-001',150.00,'USD','Espèces','Validé','2025-08-10 10:30:00','Paiement de la chambre 101','Hôtel Béatrice',1,1,NULL,NULL,'2025-08-10 22:36:32','2025-08-14 14:54:36',NULL,12),(2,'PAY-2024-002',750.50,'USD','Espèces','Validé','2025-08-01 14:15:00','Paiement du restaurant','Restaurant Hôtel',1,1,NULL,NULL,'2025-08-10 22:36:32','2025-08-14 14:54:48',NULL,11),(3,'PAY-2024-003',2000.00,'USD','Espèces','Validé','2025-07-17 09:00:00','Réservation de groupe','Service Réservation',1,1,NULL,NULL,'2025-08-10 22:36:32','2025-08-14 14:54:48',NULL,12),(5,'TEST-002',150000.00,'FC','Espèces','Validé','2025-08-14 00:00:00','Test après correction','Test User',12,3,NULL,NULL,'2025-08-14 20:11:18','2025-08-15 00:00:48',NULL,12),(6,'TEST-005',300000.00,'FC','Espèces','Validé','2025-08-14 00:00:00','Test après correction','Test User',12,3,NULL,NULL,'2025-08-14 20:28:08','2025-08-14 23:32:26',NULL,12),(7,'tesoier2499',30000.00,'FC','Espèces','En attente','2025-08-14 00:00:00','tetsttthhh','Restaurant',12,3,NULL,NULL,'2025-08-14 21:06:18','2025-08-14 23:32:26','',12),(8,'ref34009',500.00,'EUR','Espèces','Validé','2025-08-14 00:00:00','hebergement suite','Hotel beatrice',12,4,NULL,NULL,'2025-08-14 21:24:34','2025-08-15 00:19:18','',12),(9,'REF-PRO',1000.00,'USD','Espèces','Validé','2025-08-25 00:00:00','bio','',12,1,NULL,NULL,'2025-08-25 00:10:50','2025-08-25 00:11:06','',12),(10,'refpro23409',3500.00,'USD','Espèces','Validé','2025-08-27 00:00:00','test','Restaurant',12,1,NULL,NULL,'2025-08-27 19:58:37','2025-08-27 19:58:37','',12);
/*!40000 ALTER TABLE `tbl_paiements` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tbl_paiements_partiels`
--

DROP TABLE IF EXISTS `tbl_paiements_partiels`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tbl_paiements_partiels` (
  `id` int NOT NULL AUTO_INCREMENT,
  `depense_id` int NOT NULL,
  `montant` decimal(10,2) NOT NULL COMMENT 'Montant du paiement partiel',
  `date_paiement` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `mode_paiement` enum('Espèces','Chèque','Virement','Carte bancaire','Mobile Money') NOT NULL,
  `reference_paiement` varchar(100) DEFAULT NULL COMMENT 'Référence du paiement (numéro de chèque, etc.)',
  `notes` text COMMENT 'Notes sur le paiement',
  `utilisateur_id` int NOT NULL COMMENT 'Utilisateur qui a effectué le paiement',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `caisse_id` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_depense_id` (`depense_id`),
  KEY `idx_date_paiement` (`date_paiement`),
  KEY `idx_utilisateur_id` (`utilisateur_id`),
  KEY `idx_paiements_partiels_caisse` (`caisse_id`),
  CONSTRAINT `fk_paiements_partiels_caisse` FOREIGN KEY (`caisse_id`) REFERENCES `tbl_caisses` (`id`),
  CONSTRAINT `tbl_paiements_partiels_ibfk_1` FOREIGN KEY (`depense_id`) REFERENCES `tbl_depenses` (`id`) ON DELETE CASCADE,
  CONSTRAINT `tbl_paiements_partiels_ibfk_2` FOREIGN KEY (`utilisateur_id`) REFERENCES `tbl_utilisateurs` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tbl_paiements_partiels`
--

LOCK TABLES `tbl_paiements_partiels` WRITE;
/*!40000 ALTER TABLE `tbl_paiements_partiels` DISABLE KEYS */;
INSERT INTO `tbl_paiements_partiels` VALUES (1,1,50.00,'2025-08-27 19:34:42','Espèces','TEST-001','Test',4,'2025-08-27 19:34:42','2025-08-27 19:34:42',NULL),(2,14,100.00,'2025-08-27 19:40:39','Espèces','Ref pro 1234','test',4,'2025-08-27 19:40:39','2025-08-27 19:40:39',NULL),(3,1,100.00,'2025-08-27 19:59:22','Espèces','IMM-TEST-001','Test paiement immédiat avec caisse',4,'2025-08-27 19:59:22','2025-08-27 19:59:22',NULL),(4,1,200.00,'2025-08-27 19:59:22','Virement','DIFF-TEST-001','Test décaissement différé',4,'2025-08-27 19:59:22','2025-08-27 19:59:22',NULL),(5,1,50.00,'2025-08-27 20:09:57','Espèces','SOLDE-TEST-001','Test pour vérifier les soldes',4,'2025-08-27 20:09:57','2025-08-27 20:09:57',1),(6,12,5.00,'2025-08-27 20:21:35','Espèces','Ref pro 1234','tesst',4,'2025-08-27 20:21:35','2025-08-27 20:21:35',1),(7,12,5.00,'2025-08-27 20:24:28','Espèces','fghjRef pro 1234','testt',4,'2025-08-27 20:24:28','2025-08-27 20:24:28',1),(8,1,100.00,'2025-08-27 20:35:13','Espèces','IMPACT-TEST-001','Test impact négatif sur la caisse',4,'2025-08-27 20:35:13','2025-08-27 20:35:13',1),(9,1,100.00,'2025-08-27 20:35:46','Espèces','IMPACT-TEST-001','Test impact négatif sur la caisse',4,'2025-08-27 20:35:46','2025-08-27 20:35:46',1),(10,11,2.00,'2025-08-27 20:36:58','Espèces','rfgjcvkm,3459','test',4,'2025-08-27 20:36:58','2025-08-27 20:36:58',1),(11,11,2.00,'2025-08-27 20:41:35','Espèces','sdvfghm567','dfg',4,'2025-08-27 20:41:35','2025-08-27 20:41:35',1),(12,11,1.00,'2025-08-27 20:42:28','Espèces','fdbgnhmbh45678','tryhgmb',4,'2025-08-27 20:42:28','2025-08-27 20:42:28',1),(13,1,75.00,'2025-08-27 20:49:56','Espèces','TRANSACTION-TEST-001','Test pour vérifier l\'apparition dans les transactions',4,'2025-08-27 20:49:56','2025-08-27 20:49:56',1),(14,1,25.00,'2025-08-27 20:58:03','Espèces','DEPENSE-TEST-001','Test paiement partiel comme dépense',4,'2025-08-27 20:58:03','2025-08-27 20:58:03',1);
/*!40000 ALTER TABLE `tbl_paiements_partiels` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tbl_pertes_vols_articles`
--

DROP TABLE IF EXISTS `tbl_pertes_vols_articles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tbl_pertes_vols_articles` (
  `id` int NOT NULL AUTO_INCREMENT,
  `cycle_vie_id` int NOT NULL,
  `type_incident` enum('Perte','Vol','Degradation','Incendie','Inondation') NOT NULL,
  `date_incident` datetime NOT NULL,
  `lieu_incident` varchar(100) DEFAULT NULL,
  `description_incident` text,
  `responsable_incident_id` int DEFAULT NULL,
  `declaration_police` tinyint(1) DEFAULT '0',
  `numero_declaration` varchar(50) DEFAULT NULL,
  `montant_assurance` decimal(12,2) DEFAULT NULL,
  `statut_reclamation` enum('En cours','Acceptee','Rejetee','En attente') DEFAULT 'En cours',
  `observations` text,
  PRIMARY KEY (`id`),
  KEY `idx_cycle_vie_id` (`cycle_vie_id`),
  KEY `idx_type_incident` (`type_incident`),
  KEY `idx_date_incident` (`date_incident`),
  CONSTRAINT `tbl_pertes_vols_articles_ibfk_1` FOREIGN KEY (`cycle_vie_id`) REFERENCES `tbl_cycle_vie_articles` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tbl_pertes_vols_articles`
--

LOCK TABLES `tbl_pertes_vols_articles` WRITE;
/*!40000 ALTER TABLE `tbl_pertes_vols_articles` DISABLE KEYS */;
INSERT INTO `tbl_pertes_vols_articles` VALUES (1,5,'Perte','2025-01-12 16:00:00','Chambre 101','Article perdu lors du nettoyage de la chambre',4,0,NULL,15000.00,'En cours',NULL);
/*!40000 ALTER TABLE `tbl_pertes_vols_articles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tbl_problematiques`
--

DROP TABLE IF EXISTS `tbl_problematiques`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tbl_problematiques` (
  `id` int NOT NULL AUTO_INCREMENT,
  `titre` varchar(255) NOT NULL,
  `description` text NOT NULL,
  `type` enum('Maintenance','Nettoyage','Sécurité','Technique','Restaurant','Banquets','Reception','Autre') NOT NULL DEFAULT 'Autre',
  `priorite` enum('Basse','Normale','Haute','Urgente') NOT NULL DEFAULT 'Normale',
  `statut` enum('Ouverte','En cours','En attente','Résolue','Fermée') NOT NULL DEFAULT 'Ouverte',
  `chambre_id` int DEFAULT NULL,
  `rapporteur_id` int NOT NULL,
  `assigne_id` int DEFAULT NULL,
  `date_creation` datetime NOT NULL,
  `date_resolution` datetime DEFAULT NULL,
  `date_limite` datetime DEFAULT NULL,
  `fichiers` text,
  `nombre_images` int DEFAULT '0',
  `image_principale` varchar(255) DEFAULT NULL,
  `commentaires` text,
  `tags` text,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `departement_id` int DEFAULT NULL,
  `sous_departement_id` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `tbl_problematiques_statut` (`statut`),
  KEY `tbl_problematiques_priorite` (`priorite`),
  KEY `tbl_problematiques_type` (`type`),
  KEY `tbl_problematiques_chambre_id` (`chambre_id`),
  KEY `tbl_problematiques_rapporteur_id` (`rapporteur_id`),
  KEY `tbl_problematiques_assigne_id` (`assigne_id`),
  KEY `idx_problematiques_fichiers` (`fichiers`(100)),
  CONSTRAINT `tbl_problematiques_ibfk_166` FOREIGN KEY (`chambre_id`) REFERENCES `tbl_chambres` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `tbl_problematiques_ibfk_167` FOREIGN KEY (`rapporteur_id`) REFERENCES `tbl_utilisateurs` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `tbl_problematiques_ibfk_168` FOREIGN KEY (`assigne_id`) REFERENCES `tbl_utilisateurs` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=41 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tbl_problematiques`
--

LOCK TABLES `tbl_problematiques` WRITE;
/*!40000 ALTER TABLE `tbl_problematiques` DISABLE KEYS */;
INSERT INTO `tbl_problematiques` VALUES (1,'jhnvgjh','jkhiuhgiohjbjkjkhbnbjkb bjkbjjkn jklkn ','Nettoyage','Urgente','En attente',10,2,8,'2025-07-30 16:27:29',NULL,'2025-08-02 00:00:00',NULL,0,NULL,NULL,'hjgjhgvbhkjbjkhb ','2025-07-30 16:27:29','2025-07-30 16:27:29',NULL,NULL),(2,'lkjkllkmlmlknmlkafsln','lkmklmklmklmklmklmlk','Maintenance','Haute','En attente',9,2,6,'2025-07-30 16:35:05',NULL,'2025-08-08 00:00:00',NULL,0,NULL,NULL,'fdl vc .mlkmlkmklmkm','2025-07-30 16:35:05','2025-07-30 16:35:05',NULL,NULL),(3,'Pas d\'ampoules fonctionnelles','parce qu\'on vient de loin','Maintenance','Normale','Résolue',10,2,1,'2025-07-30 16:47:28','2025-07-30 16:47:53','2025-08-02 00:00:00',NULL,0,NULL,NULL,'test mariopole','2025-07-30 16:47:28','2025-07-30 16:47:53',NULL,NULL),(4,'reparation climatiseur','test description','Maintenance','Urgente','En cours',6,4,9,'2025-08-04 12:47:16',NULL,'2025-08-07 00:00:00',NULL,0,NULL,'climatiseur hisense',NULL,'2025-08-04 12:47:16','2025-08-15 14:04:34',NULL,NULL),(5,'Test problématique avec image PNG','Test de la fonctionnalité d\'upload d\'images PNG','Maintenance','Normale','Ouverte',NULL,4,NULL,'2025-08-17 21:55:58',NULL,NULL,NULL,0,NULL,NULL,NULL,'2025-08-17 21:55:58','2025-08-17 21:55:58',NULL,NULL),(6,'Test sans image','Test de création sans image','Maintenance','Normale','Ouverte',NULL,4,NULL,'2025-08-17 21:56:44',NULL,NULL,NULL,0,NULL,NULL,NULL,'2025-08-17 21:56:44','2025-08-17 21:56:44',NULL,NULL),(7,'Test final avec image','Test complet du système d\'images','Maintenance','Normale','Ouverte',NULL,4,NULL,'2025-08-17 22:01:20',NULL,NULL,NULL,0,NULL,NULL,NULL,'2025-08-17 22:01:20','2025-08-17 22:01:20',NULL,NULL),(8,'test','kjb dicvb kcvb kjbk','Maintenance','Urgente','Ouverte',8,2,7,'2025-08-17 22:03:44',NULL,NULL,NULL,0,NULL,'dfhckvb dcvhj bdjhcvbh','fdvhjkbk','2025-08-17 22:03:44','2025-08-17 22:03:44',NULL,NULL),(9,'Test avec logs détaillés','Test pour voir les logs du traitement d\'images','Maintenance','Normale','Ouverte',NULL,4,NULL,'2025-08-17 22:09:55',NULL,NULL,NULL,0,NULL,NULL,NULL,'2025-08-17 22:09:55','2025-08-17 22:09:55',NULL,NULL),(10,'Test après correction multer','Test avec multer.memoryStorage()','Maintenance','Normale','Ouverte',NULL,4,NULL,'2025-08-17 22:10:21',NULL,NULL,NULL,0,NULL,NULL,NULL,'2025-08-17 22:10:21','2025-08-17 22:10:21',NULL,NULL),(11,'Test final après redémarrage','Test complet après correction multer','Maintenance','Normale','Ouverte',NULL,4,NULL,'2025-08-17 22:10:59',NULL,NULL,NULL,0,NULL,NULL,NULL,'2025-08-17 22:10:59','2025-08-17 22:10:59',NULL,NULL),(12,'Test avec service simplifié','Test du service d\'images simplifié','Maintenance','Normale','Ouverte',NULL,4,NULL,'2025-08-17 22:12:59',NULL,NULL,NULL,0,NULL,NULL,NULL,'2025-08-17 22:12:59','2025-08-17 22:12:59',NULL,NULL),(13,'Test final avec logs','Test pour voir les logs détaillés','Maintenance','Normale','Ouverte',NULL,4,NULL,'2025-08-17 22:16:02',NULL,NULL,NULL,0,NULL,NULL,NULL,'2025-08-17 22:16:02','2025-08-17 22:16:02',NULL,NULL),(14,'Test final corrigé','Test après correction du problematique_id','Maintenance','Normale','Ouverte',NULL,4,NULL,'2025-08-17 22:19:04',NULL,NULL,NULL,0,NULL,NULL,NULL,'2025-08-17 22:19:04','2025-08-17 22:19:04',NULL,NULL),(15,'Test depuis frontend','Test pour voir l\'erreur 400','Maintenance','Normale','Ouverte',NULL,4,NULL,'2025-08-17 22:23:12',NULL,NULL,NULL,0,NULL,NULL,NULL,'2025-08-17 22:23:12','2025-08-17 22:23:12',NULL,NULL),(16,'0000 pro','ef0doib dcnvbo dflxjo','Technique','Urgente','Ouverte',10,2,11,'2025-08-17 22:43:27',NULL,'2025-08-24 00:00:00',NULL,0,NULL,'refdoixc hjkoil','uijkhfvioclh','2025-08-17 22:43:27','2025-08-17 22:43:27',NULL,NULL),(17,'00000 1pro ','df c cfv dfcxevdf','Restaurant','Normale','Ouverte',8,2,9,'2025-08-17 22:45:57',NULL,'2025-08-19 00:00:00',NULL,0,NULL,'df vc df','erdfv d','2025-08-17 22:45:57','2025-08-17 22:45:57',NULL,NULL),(18,'0002 pro','fgucvio jkdncbfedciujk','Technique','Normale','Ouverte',7,2,11,'2025-08-17 22:50:07',NULL,'2025-08-20 00:00:00',NULL,0,NULL,'efdouixcjkln','vdkxc,n kl','2025-08-17 22:50:07','2025-08-17 22:50:07',NULL,NULL),(19,'0000 5 pro','fj9cxviuo ljdfiox lj','Sécurité','Normale','Ouverte',6,2,2,'2025-08-17 22:55:32',NULL,'2025-08-20 00:00:00',NULL,0,NULL,NULL,'oduivfjk xc ','2025-08-17 22:55:32','2025-08-17 22:55:32',NULL,NULL),(20,'000002 pro3','fduivjkhdfnvxiujkn','Nettoyage','Normale','Ouverte',26,2,7,'2025-08-17 23:38:51',NULL,NULL,NULL,0,NULL,'ufdixjc kn','sdvhdxmnvbdjkxc','2025-08-17 23:38:51','2025-08-17 23:38:51',NULL,NULL),(21,'0000 000 4459roi','fgdb.,cm fdcbdlf.m,','Nettoyage','Normale','Ouverte',28,2,3,'2025-08-17 23:45:14',NULL,'2025-08-19 00:00:00',NULL,3,NULL,'ekrgdfbdfcblk','fkdrgf','2025-08-17 23:45:14','2025-08-17 23:45:14',NULL,NULL),(22,'0000 230 pro','teddmklfgnbxclkw. wefdsoiklnds wfwsdoigelgknvdf eirgodvklxnvdf ewfodisklxfgne ewfosdixlkjvnw fweosdixklj','Sécurité','Normale','Ouverte',10,2,12,'2025-08-18 12:23:41',NULL,'2025-08-21 00:00:00',NULL,2,NULL,'test commentaires','test1, test2,test3','2025-08-18 12:23:41','2025-08-18 12:23:41',NULL,NULL),(23,'000 000 paso','fesgdfcbvkjl h,erdgfhboucvjkl herdfbcuoiv jkhnredgfbco uhikj','Maintenance','Urgente','Ouverte',27,2,7,'2025-08-18 13:21:48',NULL,'2025-08-19 00:00:00',NULL,2,NULL,'srgdhfopcvkljergdfiopljkgrdijo','testtag1,tag2','2025-08-18 13:21:48','2025-08-18 13:21:48',9,'8'),(24,'Panne de climatisation chambre 104','La climatisation ne s\'allume pas dans la chambre 104','Technique','Haute','Ouverte',9,2,NULL,'2025-08-18 14:29:10',NULL,NULL,NULL,2,NULL,NULL,NULL,'2025-08-18 14:29:10','2025-08-18 14:29:10',11,'14'),(25,'ampoule cassée','Ampoule cassée chambre  101','Technique','Normale','En cours',6,16,16,'2025-08-20 12:40:37',NULL,NULL,NULL,2,NULL,NULL,NULL,'2025-08-20 12:40:37','2025-08-20 14:21:14',12,'16'),(26,'Lit cassée chambre 105','Le client a cassé le lit','Technique','Normale','En cours',10,16,16,'2025-08-20 14:31:18',NULL,NULL,NULL,1,NULL,'Test de modification via frontend corrigé',NULL,'2025-08-20 14:31:18','2025-08-20 14:36:59',12,'16'),(27,'drap troué','les draps de la chambre 103 sont troués','Technique','Normale','En cours',8,16,9,'2025-08-20 14:44:13',NULL,'2025-08-20 00:00:00',NULL,1,NULL,'changer les draps de la chambre 103',NULL,'2025-08-20 14:44:13','2025-08-20 14:45:38',12,'16'),(28,'ampoule defectueuse chambre 105','test description','Technique','Normale','En cours',10,2,9,'2025-08-23 16:25:34',NULL,'2025-08-26 00:00:00',NULL,2,NULL,NULL,NULL,'2025-08-23 16:25:34','2025-08-23 16:29:10',12,NULL),(29,'test probleme avec api cloudinary','test','Nettoyage','Normale','Ouverte',8,4,NULL,'2025-08-28 19:27:12',NULL,NULL,'[{\"originalname\":\"Capture dâeÌcran 2025-08-27 aÌ 20.59.14.png\",\"size\":87248,\"mimetype\":\"image/png\"},{\"originalname\":\"Capture dâeÌcran 2025-08-27 aÌ 22.26.18.png\",\"size\":193660,\"mimetype\":\"image/png\"}]',0,NULL,NULL,NULL,'2025-08-28 19:27:12','2025-08-28 19:52:21',12,'16'),(30,'test cloudinary 2','test','Nettoyage','Normale','Ouverte',8,4,NULL,'2025-08-28 20:07:39',NULL,NULL,NULL,0,NULL,'test',NULL,'2025-08-28 20:07:39','2025-08-28 20:07:39',9,'7'),(31,'test cloudinary pro 12323','test','Nettoyage','Normale','Ouverte',7,4,NULL,'2025-08-28 20:26:03',NULL,NULL,NULL,0,NULL,NULL,NULL,'2025-08-28 20:26:03','2025-08-28 20:26:03',9,'8'),(32,'test cloudinary vpro24','tesrt','Nettoyage','Normale','Ouverte',9,4,NULL,'2025-08-28 20:39:47',NULL,NULL,NULL,0,NULL,NULL,NULL,'2025-08-28 20:39:47','2025-08-28 20:39:47',10,'11'),(33,'test cloudinary rpo3450','tresdfgkoj','Nettoyage','Normale','Ouverte',8,4,NULL,'2025-08-28 20:56:30',NULL,NULL,NULL,0,NULL,'feidgo',NULL,'2025-08-28 20:56:30','2025-08-28 20:56:30',7,'1'),(34,'test cloudinary tre456','ytrdtfygjh','Nettoyage','Normale','Ouverte',8,4,NULL,'2025-08-28 21:18:22',NULL,NULL,NULL,2,NULL,'tresttty',NULL,'2025-08-28 21:18:22','2025-08-28 21:18:22',7,'2'),(35,'test cloudinary tre456','ytrdtfygjh','Nettoyage','Normale','Ouverte',8,4,NULL,'2025-08-28 21:18:25',NULL,NULL,NULL,2,NULL,'tresttty',NULL,'2025-08-28 21:18:25','2025-08-28 21:18:25',7,'2'),(36,'test cloudinary tre456','ytrdtfygjh','Nettoyage','Normale','Ouverte',8,4,NULL,'2025-08-28 21:18:26',NULL,NULL,NULL,2,NULL,'tresttty',NULL,'2025-08-28 21:18:26','2025-08-28 21:18:26',7,'2'),(37,'test cloudinary tre456','ytrdtfygjh','Nettoyage','Normale','Ouverte',8,4,NULL,'2025-08-28 21:18:26',NULL,NULL,NULL,2,NULL,'tresttty',NULL,'2025-08-28 21:18:26','2025-08-28 21:18:26',7,'2'),(38,'test cloudinary tre456','ytrdtfygjh','Nettoyage','Normale','Ouverte',8,4,NULL,'2025-08-28 21:18:26',NULL,NULL,NULL,2,NULL,'tresttty',NULL,'2025-08-28 21:18:26','2025-08-28 21:18:26',7,'2'),(39,'test cloudinary tre456','ytrdtfygjh','Nettoyage','Normale','Ouverte',8,4,NULL,'2025-08-28 21:18:27',NULL,NULL,NULL,2,NULL,'tresttty',NULL,'2025-08-28 21:18:27','2025-08-28 21:18:27',7,'2'),(40,'climatiseur de la chambre 1005 deffectueux','test description ','Technique','Basse','En cours',10,16,9,'2025-09-09 12:20:41',NULL,'2025-09-13 00:00:00',NULL,0,NULL,'Reparer dans un bref delai ',NULL,'2025-09-09 12:20:41','2025-09-09 12:23:07',12,NULL);
/*!40000 ALTER TABLE `tbl_problematiques` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tbl_problematiques_images`
--

DROP TABLE IF EXISTS `tbl_problematiques_images`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tbl_problematiques_images` (
  `id` int NOT NULL AUTO_INCREMENT,
  `problematique_id` int NOT NULL,
  `nom_fichier` varchar(255) NOT NULL,
  `nom_original` varchar(255) NOT NULL,
  `chemin_fichier` varchar(500) NOT NULL,
  `type_mime` varchar(100) NOT NULL,
  `taille` bigint NOT NULL,
  `source` enum('camera','upload','existing') NOT NULL DEFAULT 'upload',
  `date_upload` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `utilisateur_id` int DEFAULT NULL,
  `statut` enum('actif','supprime') NOT NULL DEFAULT 'actif',
  `metadata` json DEFAULT NULL,
  `public_id` varchar(255) DEFAULT NULL COMMENT 'ID public Cloudinary de l''image',
  `cloudinary_data` json DEFAULT NULL COMMENT 'Données Cloudinary (URLs, thumbnails, etc.)',
  PRIMARY KEY (`id`),
  KEY `idx_problematique_id` (`problematique_id`),
  KEY `idx_utilisateur_id` (`utilisateur_id`),
  KEY `idx_date_upload` (`date_upload`),
  KEY `idx_statut` (`statut`),
  KEY `idx_problematiques_images_composite` (`problematique_id`,`statut`,`date_upload`),
  KEY `idx_problematiques_images_public_id` (`public_id`),
  CONSTRAINT `fk_problematiques_images_problematique` FOREIGN KEY (`problematique_id`) REFERENCES `tbl_problematiques` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_problematiques_images_utilisateur` FOREIGN KEY (`utilisateur_id`) REFERENCES `tbl_utilisateurs` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=39 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tbl_problematiques_images`
--

LOCK TABLES `tbl_problematiques_images` WRITE;
/*!40000 ALTER TABLE `tbl_problematiques_images` DISABLE KEYS */;
INSERT INTO `tbl_problematiques_images` VALUES (6,21,'problematique_21_1755474314042_aabe5079.png','Capture dâeÌcran 2025-08-12 aÌ 12.43.35.png','https://res.cloudinary.com/df5isxcdl/image/upload/v1/problematiques/21/problematique_21_6','image/png',21620,'upload','2025-08-17 23:45:14',2,'actif','{\"width\": null, \"format\": \"png\", \"height\": null}','problematiques/21/problematique_21_6','{\"url\": \"http://res.cloudinary.com/df5isxcdl/image/upload/v1756410500/problematiques/21/problematique_21_6.png\", \"bytes\": 21620, \"width\": 648, \"format\": \"png\", \"height\": 366, \"migrated\": true, \"public_id\": \"problematiques/21/problematique_21_6\", \"created_at\": \"2025-08-28T19:48:20Z\", \"secure_url\": \"https://res.cloudinary.com/df5isxcdl/image/upload/v1756410500/problematiques/21/problematique_21_6.png\", \"migration_date\": \"2025-08-28T19:48:21.513Z\"}'),(7,21,'problematique_21_1755474314081_af0a4371.png','Capture dâeÌcran 2025-08-12 aÌ 16.55.06.png','https://res.cloudinary.com/df5isxcdl/image/upload/v1/problematiques/21/problematique_21_7','image/png',3959,'upload','2025-08-17 23:45:14',2,'actif','{\"width\": null, \"format\": \"png\", \"height\": null}','problematiques/21/problematique_21_7','{\"url\": \"http://res.cloudinary.com/df5isxcdl/image/upload/v1756410502/problematiques/21/problematique_21_7.png\", \"bytes\": 3959, \"width\": 18, \"format\": \"png\", \"height\": 6, \"migrated\": true, \"public_id\": \"problematiques/21/problematique_21_7\", \"created_at\": \"2025-08-28T19:48:22Z\", \"secure_url\": \"https://res.cloudinary.com/df5isxcdl/image/upload/v1756410502/problematiques/21/problematique_21_7.png\", \"migration_date\": \"2025-08-28T19:48:22.544Z\"}'),(8,21,'problematique_21_1755474314088_6dec2059.png','Capture dâeÌcran 2025-08-09 aÌ 15.34.52.png','https://res.cloudinary.com/df5isxcdl/image/upload/v1/problematiques/21/problematique_21_8','image/png',182734,'upload','2025-08-17 23:45:14',2,'actif','{\"width\": null, \"format\": \"png\", \"height\": null}','problematiques/21/problematique_21_8','{\"url\": \"http://res.cloudinary.com/df5isxcdl/image/upload/v1756410503/problematiques/21/problematique_21_8.png\", \"bytes\": 182734, \"width\": 990, \"format\": \"png\", \"height\": 676, \"migrated\": true, \"public_id\": \"problematiques/21/problematique_21_8\", \"created_at\": \"2025-08-28T19:48:23Z\", \"secure_url\": \"https://res.cloudinary.com/df5isxcdl/image/upload/v1756410503/problematiques/21/problematique_21_8.png\", \"migration_date\": \"2025-08-28T19:48:24.038Z\"}'),(9,22,'problematique_22_1755519821498_e8ed5613.png','Capture dâeÌcran 2025-08-18 aÌ 01.42.17.png','https://res.cloudinary.com/df5isxcdl/image/upload/v1/problematiques/22/problematique_22_9','image/png',13351,'upload','2025-08-18 12:23:41',2,'actif','{\"width\": null, \"format\": \"png\", \"height\": null}','problematiques/22/problematique_22_9','{\"url\": \"http://res.cloudinary.com/df5isxcdl/image/upload/v1756410504/problematiques/22/problematique_22_9.png\", \"bytes\": 13351, \"width\": 590, \"format\": \"png\", \"height\": 76, \"migrated\": true, \"public_id\": \"problematiques/22/problematique_22_9\", \"created_at\": \"2025-08-28T19:48:24Z\", \"secure_url\": \"https://res.cloudinary.com/df5isxcdl/image/upload/v1756410504/problematiques/22/problematique_22_9.png\", \"migration_date\": \"2025-08-28T19:48:25.055Z\"}'),(10,22,'problematique_22_1755519821519_45d84efb.png','Capture dâeÌcran 2025-08-18 aÌ 01.42.25.png','https://res.cloudinary.com/df5isxcdl/image/upload/v1/problematiques/22/problematique_22_10','image/png',34196,'upload','2025-08-18 12:23:41',2,'actif','{\"width\": null, \"format\": \"png\", \"height\": null}','problematiques/22/problematique_22_10','{\"url\": \"http://res.cloudinary.com/df5isxcdl/image/upload/v1756410505/problematiques/22/problematique_22_10.png\", \"bytes\": 34196, \"width\": 2188, \"format\": \"png\", \"height\": 102, \"migrated\": true, \"public_id\": \"problematiques/22/problematique_22_10\", \"created_at\": \"2025-08-28T19:48:25Z\", \"secure_url\": \"https://res.cloudinary.com/df5isxcdl/image/upload/v1756410505/problematiques/22/problematique_22_10.png\", \"migration_date\": \"2025-08-28T19:48:26.025Z\"}'),(11,23,'problematique_23_1755523308990_58d5704d.png','Capture dâeÌcran 2025-08-18 aÌ 01.42.25.png','https://res.cloudinary.com/df5isxcdl/image/upload/v1/problematiques/23/problematique_23_11','image/png',34196,'upload','2025-08-18 13:21:48',2,'actif','{\"width\": null, \"format\": \"png\", \"height\": null}','problematiques/23/problematique_23_11','{\"url\": \"http://res.cloudinary.com/df5isxcdl/image/upload/v1756410506/problematiques/23/problematique_23_11.png\", \"bytes\": 34196, \"width\": 2188, \"format\": \"png\", \"height\": 102, \"migrated\": true, \"public_id\": \"problematiques/23/problematique_23_11\", \"created_at\": \"2025-08-28T19:48:26Z\", \"secure_url\": \"https://res.cloudinary.com/df5isxcdl/image/upload/v1756410506/problematiques/23/problematique_23_11.png\", \"migration_date\": \"2025-08-28T19:48:27.317Z\"}'),(12,23,'problematique_23_1755523309000_3931b6fa.png','Capture dâeÌcran 2025-08-18 aÌ 00.48.45.png','https://res.cloudinary.com/df5isxcdl/image/upload/v1/problematiques/23/problematique_23_12','image/png',61274,'upload','2025-08-18 13:21:49',2,'actif','{\"width\": null, \"format\": \"png\", \"height\": null}','problematiques/23/problematique_23_12','{\"url\": \"http://res.cloudinary.com/df5isxcdl/image/upload/v1756410507/problematiques/23/problematique_23_12.png\", \"bytes\": 61274, \"width\": 504, \"format\": \"png\", \"height\": 586, \"migrated\": true, \"public_id\": \"problematiques/23/problematique_23_12\", \"created_at\": \"2025-08-28T19:48:27Z\", \"secure_url\": \"https://res.cloudinary.com/df5isxcdl/image/upload/v1756410507/problematiques/23/problematique_23_12.png\", \"migration_date\": \"2025-08-28T19:48:28.400Z\"}'),(13,24,'problematique_24_1755527350137_5163174d.png','Capture dâeÌcran 2025-08-18 aÌ 01.42.25.png','https://res.cloudinary.com/df5isxcdl/image/upload/v1/problematiques/24/problematique_24_13','image/png',34196,'upload','2025-08-18 14:29:10',2,'actif','{\"width\": null, \"format\": \"png\", \"height\": null}','problematiques/24/problematique_24_13','{\"url\": \"http://res.cloudinary.com/df5isxcdl/image/upload/v1756410509/problematiques/24/problematique_24_13.png\", \"bytes\": 34196, \"width\": 2188, \"format\": \"png\", \"height\": 102, \"migrated\": true, \"public_id\": \"problematiques/24/problematique_24_13\", \"created_at\": \"2025-08-28T19:48:29Z\", \"secure_url\": \"https://res.cloudinary.com/df5isxcdl/image/upload/v1756410509/problematiques/24/problematique_24_13.png\", \"migration_date\": \"2025-08-28T19:48:29.486Z\"}'),(14,24,'problematique_24_1755527350152_ecaf5b6b.png','Capture dâeÌcran 2025-08-18 aÌ 00.48.45.png','https://res.cloudinary.com/df5isxcdl/image/upload/v1/problematiques/24/problematique_24_14','image/png',61274,'upload','2025-08-18 14:29:10',2,'actif','{\"width\": null, \"format\": \"png\", \"height\": null}','problematiques/24/problematique_24_14','{\"url\": \"http://res.cloudinary.com/df5isxcdl/image/upload/v1756410510/problematiques/24/problematique_24_14.png\", \"bytes\": 61274, \"width\": 504, \"format\": \"png\", \"height\": 586, \"migrated\": true, \"public_id\": \"problematiques/24/problematique_24_14\", \"created_at\": \"2025-08-28T19:48:30Z\", \"secure_url\": \"https://res.cloudinary.com/df5isxcdl/image/upload/v1756410510/problematiques/24/problematique_24_14.png\", \"migration_date\": \"2025-08-28T19:48:30.573Z\"}'),(15,25,'problematique_25_1755693637345_ac979996.png','Capture dâeÌcran 2025-08-19 aÌ 18.21.04.png','https://res.cloudinary.com/df5isxcdl/image/upload/v1/problematiques/25/problematique_25_15','image/png',16300,'upload','2025-08-20 12:40:37',16,'actif','{\"width\": null, \"format\": \"png\", \"height\": null}','problematiques/25/problematique_25_15','{\"url\": \"http://res.cloudinary.com/df5isxcdl/image/upload/v1756410511/problematiques/25/problematique_25_15.png\", \"bytes\": 16300, \"width\": 1378, \"format\": \"png\", \"height\": 130, \"migrated\": true, \"public_id\": \"problematiques/25/problematique_25_15\", \"created_at\": \"2025-08-28T19:48:31Z\", \"secure_url\": \"https://res.cloudinary.com/df5isxcdl/image/upload/v1756410511/problematiques/25/problematique_25_15.png\", \"migration_date\": \"2025-08-28T19:48:31.619Z\"}'),(16,25,'problematique_25_1755693637394_7015889b.png','Capture dâeÌcran 2025-08-19 aÌ 20.55.43.png','https://res.cloudinary.com/df5isxcdl/image/upload/v1/problematiques/25/problematique_25_16','image/png',163836,'upload','2025-08-20 12:40:37',16,'actif','{\"width\": null, \"format\": \"png\", \"height\": null}','problematiques/25/problematique_25_16','{\"url\": \"http://res.cloudinary.com/df5isxcdl/image/upload/v1756410512/problematiques/25/problematique_25_16.png\", \"bytes\": 163836, \"width\": 2152, \"format\": \"png\", \"height\": 638, \"migrated\": true, \"public_id\": \"problematiques/25/problematique_25_16\", \"created_at\": \"2025-08-28T19:48:32Z\", \"secure_url\": \"https://res.cloudinary.com/df5isxcdl/image/upload/v1756410512/problematiques/25/problematique_25_16.png\", \"migration_date\": \"2025-08-28T19:48:32.757Z\"}'),(17,26,'problematique_26_1755700278967_f6ab1084.png','Capture dâeÌcran 2025-08-20 aÌ 00.03.04.png','https://res.cloudinary.com/df5isxcdl/image/upload/v1/problematiques/26/problematique_26_17','image/png',131229,'upload','2025-08-20 14:31:18',16,'actif','{\"width\": null, \"format\": \"png\", \"height\": null}','problematiques/26/problematique_26_17','{\"url\": \"http://res.cloudinary.com/df5isxcdl/image/upload/v1756410513/problematiques/26/problematique_26_17.png\", \"bytes\": 131229, \"width\": 2094, \"format\": \"png\", \"height\": 776, \"migrated\": true, \"public_id\": \"problematiques/26/problematique_26_17\", \"created_at\": \"2025-08-28T19:48:33Z\", \"secure_url\": \"https://res.cloudinary.com/df5isxcdl/image/upload/v1756410513/problematiques/26/problematique_26_17.png\", \"migration_date\": \"2025-08-28T19:48:33.785Z\"}'),(18,27,'problematique_27_1755701053741_023ef293.png','Capture dâeÌcran 2025-08-19 aÌ 21.11.38.png','https://res.cloudinary.com/df5isxcdl/image/upload/v1/problematiques/27/problematique_27_18','image/png',109634,'upload','2025-08-20 14:44:13',16,'actif','{\"width\": null, \"format\": \"png\", \"height\": null}','problematiques/27/problematique_27_18','{\"url\": \"http://res.cloudinary.com/df5isxcdl/image/upload/v1756410514/problematiques/27/problematique_27_18.png\", \"bytes\": 109634, \"width\": 1586, \"format\": \"png\", \"height\": 548, \"migrated\": true, \"public_id\": \"problematiques/27/problematique_27_18\", \"created_at\": \"2025-08-28T19:48:34Z\", \"secure_url\": \"https://res.cloudinary.com/df5isxcdl/image/upload/v1756410514/problematiques/27/problematique_27_18.png\", \"migration_date\": \"2025-08-28T19:48:34.886Z\"}'),(19,28,'problematique_28_1755966334875_fbf65731.png','Capture dâeÌcran 2025-08-23 aÌ 16.56.45.png','https://res.cloudinary.com/df5isxcdl/image/upload/v1/problematiques/28/problematique_28_19','image/png',11364,'upload','2025-08-23 16:25:34',2,'actif','{\"width\": null, \"format\": \"png\", \"height\": null}','problematiques/28/problematique_28_19','{\"url\": \"http://res.cloudinary.com/df5isxcdl/image/upload/v1756410515/problematiques/28/problematique_28_19.png\", \"bytes\": 11364, \"width\": 440, \"format\": \"png\", \"height\": 104, \"migrated\": true, \"public_id\": \"problematiques/28/problematique_28_19\", \"created_at\": \"2025-08-28T19:48:35Z\", \"secure_url\": \"https://res.cloudinary.com/df5isxcdl/image/upload/v1756410515/problematiques/28/problematique_28_19.png\", \"migration_date\": \"2025-08-28T19:48:35.876Z\"}'),(20,28,'problematique_28_1755966334949_e33d461d.png','Capture dâeÌcran 2025-08-23 aÌ 15.46.00.png','https://res.cloudinary.com/df5isxcdl/image/upload/v1/problematiques/28/problematique_28_20','image/png',830635,'upload','2025-08-23 16:25:34',2,'actif','{\"width\": null, \"format\": \"png\", \"height\": null}','problematiques/28/problematique_28_20','{\"url\": \"http://res.cloudinary.com/df5isxcdl/image/upload/v1756410516/problematiques/28/problematique_28_20.png\", \"bytes\": 830635, \"width\": 1360, \"format\": \"png\", \"height\": 904, \"migrated\": true, \"public_id\": \"problematiques/28/problematique_28_20\", \"created_at\": \"2025-08-28T19:48:36Z\", \"secure_url\": \"https://res.cloudinary.com/df5isxcdl/image/upload/v1756410516/problematiques/28/problematique_28_20.png\", \"migration_date\": \"2025-08-28T19:48:37.448Z\"}'),(27,34,'problematique_34_1756415902351_dfeb3e28.png','Capture dâeÌcran 2025-08-23 aÌ 16.56.45.png','https://res.cloudinary.com/df5isxcdl/image/upload/v1756415903/problematiques/34/problematique_34_1756415902351_dfeb3e28.png','image/png',11364,'upload','2025-08-28 21:18:26',4,'actif','{\"bytes\": 4028, \"width\": 440, \"format\": \"png\", \"height\": 104}','problematiques/34/problematique_34_1756415902351_dfeb3e28','{\"url\": \"http://res.cloudinary.com/df5isxcdl/image/upload/v1756415903/problematiques/34/problematique_34_1756415902351_dfeb3e28.png\", \"bytes\": 4028, \"width\": 440, \"format\": \"png\", \"height\": 104, \"public_id\": \"problematiques/34/problematique_34_1756415902351_dfeb3e28\", \"created_at\": \"2025-08-28T21:18:23Z\", \"secure_url\": \"https://res.cloudinary.com/df5isxcdl/image/upload/v1756415903/problematiques/34/problematique_34_1756415902351_dfeb3e28.png\"}'),(28,35,'problematique_35_1756415905888_325d6bc5.png','Capture dâeÌcran 2025-08-23 aÌ 16.56.45.png','https://res.cloudinary.com/df5isxcdl/image/upload/v1756415906/problematiques/35/problematique_35_1756415905888_325d6bc5.png','image/png',11364,'upload','2025-08-28 21:18:29',4,'actif','{\"bytes\": 4028, \"width\": 440, \"format\": \"png\", \"height\": 104}','problematiques/35/problematique_35_1756415905888_325d6bc5','{\"url\": \"http://res.cloudinary.com/df5isxcdl/image/upload/v1756415906/problematiques/35/problematique_35_1756415905888_325d6bc5.png\", \"bytes\": 4028, \"width\": 440, \"format\": \"png\", \"height\": 104, \"public_id\": \"problematiques/35/problematique_35_1756415905888_325d6bc5\", \"created_at\": \"2025-08-28T21:18:26Z\", \"secure_url\": \"https://res.cloudinary.com/df5isxcdl/image/upload/v1756415906/problematiques/35/problematique_35_1756415905888_325d6bc5.png\"}'),(29,36,'problematique_36_1756415906641_82595291.png','Capture dâeÌcran 2025-08-23 aÌ 16.56.45.png','https://res.cloudinary.com/df5isxcdl/image/upload/v1756415907/problematiques/36/problematique_36_1756415906641_82595291.png','image/png',11364,'upload','2025-08-28 21:18:29',4,'actif','{\"bytes\": 4028, \"width\": 440, \"format\": \"png\", \"height\": 104}','problematiques/36/problematique_36_1756415906641_82595291','{\"url\": \"http://res.cloudinary.com/df5isxcdl/image/upload/v1756415907/problematiques/36/problematique_36_1756415906641_82595291.png\", \"bytes\": 4028, \"width\": 440, \"format\": \"png\", \"height\": 104, \"public_id\": \"problematiques/36/problematique_36_1756415906641_82595291\", \"created_at\": \"2025-08-28T21:18:27Z\", \"secure_url\": \"https://res.cloudinary.com/df5isxcdl/image/upload/v1756415907/problematiques/36/problematique_36_1756415906641_82595291.png\"}'),(30,37,'problematique_37_1756415906674_41e1f885.png','Capture dâeÌcran 2025-08-23 aÌ 16.56.45.png','https://res.cloudinary.com/df5isxcdl/image/upload/v1756415907/problematiques/37/problematique_37_1756415906674_41e1f885.png','image/png',11364,'upload','2025-08-28 21:18:30',4,'actif','{\"bytes\": 4028, \"width\": 440, \"format\": \"png\", \"height\": 104}','problematiques/37/problematique_37_1756415906674_41e1f885','{\"url\": \"http://res.cloudinary.com/df5isxcdl/image/upload/v1756415907/problematiques/37/problematique_37_1756415906674_41e1f885.png\", \"bytes\": 4028, \"width\": 440, \"format\": \"png\", \"height\": 104, \"public_id\": \"problematiques/37/problematique_37_1756415906674_41e1f885\", \"created_at\": \"2025-08-28T21:18:27Z\", \"secure_url\": \"https://res.cloudinary.com/df5isxcdl/image/upload/v1756415907/problematiques/37/problematique_37_1756415906674_41e1f885.png\"}'),(31,38,'problematique_38_1756415906805_ea3d10a2.png','Capture dâeÌcran 2025-08-23 aÌ 16.56.45.png','https://res.cloudinary.com/df5isxcdl/image/upload/v1756415907/problematiques/38/problematique_38_1756415906805_ea3d10a2.png','image/png',11364,'upload','2025-08-28 21:18:30',4,'actif','{\"bytes\": 4028, \"width\": 440, \"format\": \"png\", \"height\": 104}','problematiques/38/problematique_38_1756415906805_ea3d10a2','{\"url\": \"http://res.cloudinary.com/df5isxcdl/image/upload/v1756415907/problematiques/38/problematique_38_1756415906805_ea3d10a2.png\", \"bytes\": 4028, \"width\": 440, \"format\": \"png\", \"height\": 104, \"public_id\": \"problematiques/38/problematique_38_1756415906805_ea3d10a2\", \"created_at\": \"2025-08-28T21:18:27Z\", \"secure_url\": \"https://res.cloudinary.com/df5isxcdl/image/upload/v1756415907/problematiques/38/problematique_38_1756415906805_ea3d10a2.png\"}'),(32,39,'problematique_39_1756415907005_56071cca.png','Capture dâeÌcran 2025-08-23 aÌ 16.56.45.png','https://res.cloudinary.com/df5isxcdl/image/upload/v1756415908/problematiques/39/problematique_39_1756415907005_56071cca.png','image/png',11364,'upload','2025-08-28 21:18:30',4,'actif','{\"bytes\": 4028, \"width\": 440, \"format\": \"png\", \"height\": 104}','problematiques/39/problematique_39_1756415907005_56071cca','{\"url\": \"http://res.cloudinary.com/df5isxcdl/image/upload/v1756415908/problematiques/39/problematique_39_1756415907005_56071cca.png\", \"bytes\": 4028, \"width\": 440, \"format\": \"png\", \"height\": 104, \"public_id\": \"problematiques/39/problematique_39_1756415907005_56071cca\", \"created_at\": \"2025-08-28T21:18:28Z\", \"secure_url\": \"https://res.cloudinary.com/df5isxcdl/image/upload/v1756415908/problematiques/39/problematique_39_1756415907005_56071cca.png\"}'),(33,34,'problematique_34_1756415906649_80beb4f7.png','Capture dâeÌcran 2025-08-09 aÌ 15.34.52.png','https://res.cloudinary.com/df5isxcdl/image/upload/v1756415908/problematiques/34/problematique_34_1756415906649_80beb4f7.png','image/png',182734,'upload','2025-08-28 21:18:31',4,'actif','{\"bytes\": 202721, \"width\": 990, \"format\": \"png\", \"height\": 676}','problematiques/34/problematique_34_1756415906649_80beb4f7','{\"url\": \"http://res.cloudinary.com/df5isxcdl/image/upload/v1756415908/problematiques/34/problematique_34_1756415906649_80beb4f7.png\", \"bytes\": 202721, \"width\": 990, \"format\": \"png\", \"height\": 676, \"public_id\": \"problematiques/34/problematique_34_1756415906649_80beb4f7\", \"created_at\": \"2025-08-28T21:18:28Z\", \"secure_url\": \"https://res.cloudinary.com/df5isxcdl/image/upload/v1756415908/problematiques/34/problematique_34_1756415906649_80beb4f7.png\"}'),(34,35,'problematique_35_1756415909580_ce2051d7.png','Capture dâeÌcran 2025-08-09 aÌ 15.34.52.png','https://res.cloudinary.com/df5isxcdl/image/upload/v1756415910/problematiques/35/problematique_35_1756415909580_ce2051d7.png','image/png',182734,'upload','2025-08-28 21:18:33',4,'actif','{\"bytes\": 202721, \"width\": 990, \"format\": \"png\", \"height\": 676}','problematiques/35/problematique_35_1756415909580_ce2051d7','{\"url\": \"http://res.cloudinary.com/df5isxcdl/image/upload/v1756415910/problematiques/35/problematique_35_1756415909580_ce2051d7.png\", \"bytes\": 202721, \"width\": 990, \"format\": \"png\", \"height\": 676, \"public_id\": \"problematiques/35/problematique_35_1756415909580_ce2051d7\", \"created_at\": \"2025-08-28T21:18:30Z\", \"secure_url\": \"https://res.cloudinary.com/df5isxcdl/image/upload/v1756415910/problematiques/35/problematique_35_1756415909580_ce2051d7.png\"}'),(35,36,'problematique_36_1756415909778_fb1350b6.png','Capture dâeÌcran 2025-08-09 aÌ 15.34.52.png','https://res.cloudinary.com/df5isxcdl/image/upload/v1756415910/problematiques/36/problematique_36_1756415909778_fb1350b6.png','image/png',182734,'upload','2025-08-28 21:18:33',4,'actif','{\"bytes\": 202721, \"width\": 990, \"format\": \"png\", \"height\": 676}','problematiques/36/problematique_36_1756415909778_fb1350b6','{\"url\": \"http://res.cloudinary.com/df5isxcdl/image/upload/v1756415910/problematiques/36/problematique_36_1756415909778_fb1350b6.png\", \"bytes\": 202721, \"width\": 990, \"format\": \"png\", \"height\": 676, \"public_id\": \"problematiques/36/problematique_36_1756415909778_fb1350b6\", \"created_at\": \"2025-08-28T21:18:30Z\", \"secure_url\": \"https://res.cloudinary.com/df5isxcdl/image/upload/v1756415910/problematiques/36/problematique_36_1756415909778_fb1350b6.png\"}'),(36,37,'problematique_37_1756415910462_2252589a.png','Capture dâeÌcran 2025-08-09 aÌ 15.34.52.png','https://res.cloudinary.com/df5isxcdl/image/upload/v1756415911/problematiques/37/problematique_37_1756415910462_2252589a.png','image/png',182734,'upload','2025-08-28 21:18:34',4,'actif','{\"bytes\": 202721, \"width\": 990, \"format\": \"png\", \"height\": 676}','problematiques/37/problematique_37_1756415910462_2252589a','{\"url\": \"http://res.cloudinary.com/df5isxcdl/image/upload/v1756415911/problematiques/37/problematique_37_1756415910462_2252589a.png\", \"bytes\": 202721, \"width\": 990, \"format\": \"png\", \"height\": 676, \"public_id\": \"problematiques/37/problematique_37_1756415910462_2252589a\", \"created_at\": \"2025-08-28T21:18:31Z\", \"secure_url\": \"https://res.cloudinary.com/df5isxcdl/image/upload/v1756415911/problematiques/37/problematique_37_1756415910462_2252589a.png\"}'),(37,38,'problematique_38_1756415910601_3e187856.png','Capture dâeÌcran 2025-08-09 aÌ 15.34.52.png','https://res.cloudinary.com/df5isxcdl/image/upload/v1756415911/problematiques/38/problematique_38_1756415910601_3e187856.png','image/png',182734,'upload','2025-08-28 21:18:34',4,'actif','{\"bytes\": 202721, \"width\": 990, \"format\": \"png\", \"height\": 676}','problematiques/38/problematique_38_1756415910601_3e187856','{\"url\": \"http://res.cloudinary.com/df5isxcdl/image/upload/v1756415911/problematiques/38/problematique_38_1756415910601_3e187856.png\", \"bytes\": 202721, \"width\": 990, \"format\": \"png\", \"height\": 676, \"public_id\": \"problematiques/38/problematique_38_1756415910601_3e187856\", \"created_at\": \"2025-08-28T21:18:31Z\", \"secure_url\": \"https://res.cloudinary.com/df5isxcdl/image/upload/v1756415911/problematiques/38/problematique_38_1756415910601_3e187856.png\"}'),(38,39,'problematique_39_1756415910756_9293932b.png','Capture dâeÌcran 2025-08-09 aÌ 15.34.52.png','https://res.cloudinary.com/df5isxcdl/image/upload/v1756415911/problematiques/39/problematique_39_1756415910756_9293932b.png','image/png',182734,'upload','2025-08-28 21:18:37',4,'actif','{\"bytes\": 202721, \"width\": 990, \"format\": \"png\", \"height\": 676}','problematiques/39/problematique_39_1756415910756_9293932b','{\"url\": \"http://res.cloudinary.com/df5isxcdl/image/upload/v1756415911/problematiques/39/problematique_39_1756415910756_9293932b.png\", \"bytes\": 202721, \"width\": 990, \"format\": \"png\", \"height\": 676, \"public_id\": \"problematiques/39/problematique_39_1756415910756_9293932b\", \"created_at\": \"2025-08-28T21:18:31Z\", \"secure_url\": \"https://res.cloudinary.com/df5isxcdl/image/upload/v1756415911/problematiques/39/problematique_39_1756415910756_9293932b.png\"}');
/*!40000 ALTER TABLE `tbl_problematiques_images` ENABLE KEYS */;
UNLOCK TABLES;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50003 TRIGGER `tr_problematiques_images_after_insert` AFTER INSERT ON `tbl_problematiques_images` FOR EACH ROW BEGIN
  UPDATE `tbl_problematiques` 
  SET `nombre_images` = (
    SELECT COUNT(*) 
    FROM `tbl_problematiques_images` 
    WHERE `problematique_id` = NEW.problematique_id AND `statut` = 'actif'
  )
  WHERE `id` = NEW.problematique_id;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50003 TRIGGER `tr_problematiques_images_after_update` AFTER UPDATE ON `tbl_problematiques_images` FOR EACH ROW BEGIN
  IF NEW.statut != OLD.statut THEN
    UPDATE `tbl_problematiques` 
    SET `nombre_images` = (
      SELECT COUNT(*) 
      FROM `tbl_problematiques_images` 
      WHERE `problematique_id` = NEW.problematique_id AND `statut` = 'actif'
    )
    WHERE `id` = NEW.problematique_id;
  END IF;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50003 TRIGGER `tr_problematiques_images_after_delete` AFTER DELETE ON `tbl_problematiques_images` FOR EACH ROW BEGIN
  UPDATE `tbl_problematiques` 
  SET `nombre_images` = (
    SELECT COUNT(*) 
    FROM `tbl_problematiques_images` 
    WHERE `problematique_id` = OLD.problematique_id AND `statut` = 'actif'
  )
  WHERE `id` = OLD.problematique_id;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;

--
-- Table structure for table `tbl_rappels_paiement`
--

DROP TABLE IF EXISTS `tbl_rappels_paiement`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tbl_rappels_paiement` (
  `id` int NOT NULL AUTO_INCREMENT,
  `depense_id` int NOT NULL,
  `date_rappel` date NOT NULL COMMENT 'Date du rappel',
  `type_rappel` enum('Email','SMS','Notification interne','Rappel manuel') NOT NULL,
  `statut` enum('Programmé','Envoyé','Lu','Traité') DEFAULT 'Programmé',
  `message` text COMMENT 'Message du rappel',
  `utilisateur_id` int DEFAULT NULL COMMENT 'Utilisateur qui a programmé le rappel',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `utilisateur_id` (`utilisateur_id`),
  KEY `idx_depense_id` (`depense_id`),
  KEY `idx_date_rappel` (`date_rappel`),
  KEY `idx_statut` (`statut`),
  CONSTRAINT `tbl_rappels_paiement_ibfk_1` FOREIGN KEY (`depense_id`) REFERENCES `tbl_depenses` (`id`) ON DELETE CASCADE,
  CONSTRAINT `tbl_rappels_paiement_ibfk_2` FOREIGN KEY (`utilisateur_id`) REFERENCES `tbl_utilisateurs` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tbl_rappels_paiement`
--

LOCK TABLES `tbl_rappels_paiement` WRITE;
/*!40000 ALTER TABLE `tbl_rappels_paiement` DISABLE KEYS */;
INSERT INTO `tbl_rappels_paiement` VALUES (1,1,'2025-12-31','Email','Programmé','Rappel: Paiement de la facture en attente',NULL,'2025-08-27 19:37:32','2025-08-27 19:37:32'),(2,1,'2025-12-31','Email','Envoyé','Rappel: Paiement de la facture en attente',NULL,'2025-08-27 19:39:20','2025-08-27 19:39:20');
/*!40000 ALTER TABLE `tbl_rappels_paiement` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tbl_sous_departements`
--

DROP TABLE IF EXISTS `tbl_sous_departements`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tbl_sous_departements` (
  `id` int NOT NULL AUTO_INCREMENT COMMENT 'Identifiant unique du sous-département',
  `nom` varchar(100) NOT NULL COMMENT 'Nom du sous-département',
  `code` varchar(15) NOT NULL COMMENT 'Code unique du sous-département',
  `description` text COMMENT 'Description du sous-département',
  `departement_id` int NOT NULL COMMENT 'ID du département parent (référence tbl_departements)',
  `responsable_id` int DEFAULT NULL COMMENT 'ID du responsable du sous-département (référence tbl_utilisateurs)',
  `budget_annuel` decimal(15,2) DEFAULT NULL COMMENT 'Budget annuel du sous-département en euros',
  `statut` enum('Actif','Inactif','En développement') NOT NULL DEFAULT 'Actif' COMMENT 'Statut du sous-département',
  `niveau_hierarchie` int NOT NULL DEFAULT '1' COMMENT 'Niveau hiérarchique (1-5)',
  `date_creation` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Date de création du sous-département',
  `couleur` varchar(7) DEFAULT NULL COMMENT 'Couleur du sous-département (format hexadécimal #RRGGBB)',
  `capacite_equipe` int DEFAULT NULL COMMENT 'Capacité de l''équipe en nombre de personnes',
  `localisation` varchar(100) DEFAULT NULL COMMENT 'Localisation physique du sous-département',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Date de création de l''enregistrement',
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Date de mise à jour de l''enregistrement',
  PRIMARY KEY (`id`),
  UNIQUE KEY `code` (`code`),
  KEY `idx_sous_departements_code` (`code`),
  KEY `idx_sous_departements_statut` (`statut`),
  KEY `idx_sous_departements_departement_id` (`departement_id`),
  KEY `idx_sous_departements_responsable_id` (`responsable_id`),
  KEY `idx_sous_departements_niveau_hierarchie` (`niveau_hierarchie`),
  CONSTRAINT `fk_sous_departements_departement` FOREIGN KEY (`departement_id`) REFERENCES `tbl_departements` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_sous_departements_responsable` FOREIGN KEY (`responsable_id`) REFERENCES `tbl_utilisateurs` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=18 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Table des sous-départements de l''hôtel';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tbl_sous_departements`
--

LOCK TABLES `tbl_sous_departements` WRITE;
/*!40000 ALTER TABLE `tbl_sous_departements` DISABLE KEYS */;
INSERT INTO `tbl_sous_departements` VALUES (1,'Accueil client','REC-ACCUEIL','Service d\'accueil et d\'orientation des clients',7,NULL,NULL,'Actif',1,'2025-08-17 12:57:36','#3B82F6',3,'Hall principal','2025-08-17 12:57:36','2025-08-17 12:57:36'),(2,'Réservations','REC-RESERV','Gestion des réservations et planning',7,NULL,NULL,'Actif',1,'2025-08-17 12:57:36','#60A5FA',2,'Bureau réception','2025-08-17 12:57:36','2025-08-17 12:57:36'),(3,'Conciergerie','REC-CONCIER','Service de conciergerie et assistance client',7,NULL,NULL,'Actif',2,'2025-08-17 12:57:36','#93C5FD',2,'Hall principal','2025-08-17 12:57:36','2025-08-17 12:57:36'),(4,'Nettoyage chambres','MEN-CHAMBRES','Nettoyage et entretien des chambres',8,NULL,NULL,'Actif',1,'2025-08-17 12:57:36','#10B981',8,'Étage 1-3','2025-08-17 12:57:36','2025-08-17 12:57:36'),(5,'Nettoyage communs','MEN-COMMUNS','Nettoyage des espaces communs',8,NULL,NULL,'Actif',1,'2025-08-17 12:57:36','#34D399',4,'Hall et couloirs','2025-08-17 12:57:36','2025-08-17 12:57:36'),(6,'Linge','MEN-LINGE','Gestion du linge et blanchisserie',8,NULL,NULL,'Actif',2,'2025-08-17 12:57:36','#6EE7B7',3,'Sous-sol','2025-08-17 12:57:36','2025-08-17 12:57:36'),(7,'Cuisine','REST-CUISINE','Préparation des repas',9,NULL,NULL,'Actif',1,'2025-08-17 12:57:36','#F59E0B',6,'Cuisine principale','2025-08-17 12:57:36','2025-08-17 12:57:36'),(8,'Service salle','REST-SALLE','Service en salle et bar',9,NULL,NULL,'Actif',1,'2025-08-17 12:57:36','#FBBF24',4,'Salle de restaurant','2025-08-17 12:57:36','2025-08-17 12:57:36'),(9,'Pâtisserie','REST-PATISS','Préparation des desserts et pâtisseries',9,NULL,NULL,'Actif',2,'2025-08-17 12:57:36','#FCD34D',2,'Laboratoire pâtisserie','2025-08-17 12:57:36','2025-08-17 12:57:36'),(10,'Électricité','MAINT-ELEC','Maintenance électrique et éclairage',10,NULL,NULL,'Actif',1,'2025-08-17 12:57:36','#EF4444',3,'Local technique','2025-08-17 12:57:36','2025-08-17 12:57:36'),(11,'Plomberie','MAINT-PLOMB','Maintenance plomberie et sanitaires',10,NULL,NULL,'Actif',1,'2025-08-17 12:57:36','#F87171',2,'Local technique','2025-08-17 12:57:36','2025-08-17 12:57:36'),(12,'Climatisation','MAINT-CLIM','Maintenance climatisation et ventilation',10,NULL,NULL,'Actif',2,'2025-08-17 12:57:36','#FCA5A5',2,'Local technique','2025-08-17 12:57:36','2025-08-17 12:57:36'),(13,'Comptabilité','ADMIN-COMPTA','Gestion comptable et financière',11,7,NULL,'Actif',1,'2025-08-17 12:57:36','#8B5CF6',2,'Bureau administratif','2025-08-17 12:57:36','2025-08-17 12:06:21'),(14,'Ressources humaines','ADMIN-RH','Gestion du personnel et recrutement',11,5,NULL,'Actif',1,'2025-08-17 12:57:36','#b8b551',2,'Bureau administratif','2025-08-17 12:57:36','2025-08-17 12:07:38'),(15,'Marketing','ADMIN-MARKET','Communication et promotion',11,NULL,NULL,'Actif',2,'2025-08-17 12:57:36','#C4B5FD',1,'Bureau administratif','2025-08-17 12:57:36','2025-08-17 12:57:36'),(16,'Surveillance','SEC-SURVEIL','Surveillance générale et contrôle d\'accès',12,NULL,NULL,'Actif',1,'2025-08-17 12:57:36','#6B7280',4,'Poste de sécurité','2025-08-17 12:57:36','2025-08-17 12:57:36'),(17,'Sécurité incendie','SEC-INCEND','Prévention et sécurité incendie',12,NULL,NULL,'Actif',2,'2025-08-17 12:57:36','#9CA3AF',2,'Poste de sécurité','2025-08-17 12:57:36','2025-08-17 12:57:36');
/*!40000 ALTER TABLE `tbl_sous_departements` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tbl_taches`
--

DROP TABLE IF EXISTS `tbl_taches`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tbl_taches` (
  `id` int NOT NULL AUTO_INCREMENT,
  `titre` varchar(255) NOT NULL,
  `description` text,
  `type` enum('Nettoyage','Maintenance','Réception','Administrative','Autre') NOT NULL DEFAULT 'Autre',
  `priorite` enum('Basse','Normale','Haute','Urgente') NOT NULL DEFAULT 'Normale',
  `statut` enum('À faire','En cours','En attente','Terminée','Annulée') NOT NULL DEFAULT 'À faire',
  `assigne_id` int DEFAULT NULL,
  `createur_id` int NOT NULL,
  `chambre_id` int DEFAULT NULL,
  `date_creation` datetime NOT NULL,
  `date_debut` datetime DEFAULT NULL,
  `date_fin` datetime DEFAULT NULL,
  `date_limite` datetime DEFAULT NULL,
  `duree_estimee` int DEFAULT NULL,
  `duree_reelle` int DEFAULT NULL,
  `notes` text,
  `tags` text,
  `fichiers` text,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `problematique_id` varchar(100) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `tbl_taches_statut` (`statut`),
  KEY `tbl_taches_priorite` (`priorite`),
  KEY `tbl_taches_type` (`type`),
  KEY `tbl_taches_assigne_id` (`assigne_id`),
  KEY `tbl_taches_createur_id` (`createur_id`),
  KEY `tbl_taches_chambre_id` (`chambre_id`),
  CONSTRAINT `tbl_taches_ibfk_103` FOREIGN KEY (`assigne_id`) REFERENCES `tbl_utilisateurs` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `tbl_taches_ibfk_104` FOREIGN KEY (`createur_id`) REFERENCES `tbl_utilisateurs` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `tbl_taches_ibfk_105` FOREIGN KEY (`chambre_id`) REFERENCES `tbl_chambres` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tbl_taches`
--

LOCK TABLES `tbl_taches` WRITE;
/*!40000 ALTER TABLE `tbl_taches` DISABLE KEYS */;
INSERT INTO `tbl_taches` VALUES (1,'traité la problematique de la chambre','testnfvdfv[xck','Maintenance','Urgente','Terminée',16,7,6,'2025-07-30 17:16:20',NULL,NULL,'2025-07-30 00:00:00',3000,NULL,'bfgklnv mcxv p;m','bio,gaz,douleur',NULL,'2025-07-30 17:16:20','2025-07-30 18:45:50','3'),(2,'Résoudre : ampoule cassée','Tâche automatiquement créée pour résoudre la problématique : Ampoule cassée chambre  101','Maintenance','Normale','En cours',16,16,6,'2025-08-20 14:21:14','2025-08-20 14:22:28',NULL,NULL,NULL,NULL,'Créée automatiquement lors du passage au statut \"En cours\" de la problématique #25',NULL,NULL,'2025-08-20 14:21:14','2025-08-20 14:22:28','25'),(3,'Résoudre : Lit cassée chambre 105','Tâche automatiquement créée pour résoudre la problématique : Le client a cassé le lit','Maintenance','Normale','À faire',16,16,10,'2025-08-20 14:36:59',NULL,NULL,NULL,NULL,NULL,'Créée automatiquement lors du passage au statut \"En cours\" de la problématique #26',NULL,NULL,'2025-08-20 14:36:59','2025-08-20 14:36:59','26'),(4,'Résoudre : drap troué','Tâche automatiquement créée pour résoudre la problématique : les draps de la chambre 103 sont troués','Maintenance','Normale','Terminée',9,16,8,'2025-08-20 14:45:38','2025-08-20 15:04:19','2025-08-20 15:05:26','2025-08-20 00:00:00',NULL,1,'Créée automatiquement lors du passage au statut \"En cours\" de la problématique #27',NULL,NULL,'2025-08-20 14:45:38','2025-08-20 15:05:26','27'),(5,'Résoudre : ampoule defectueuse chambre 105','Tâche automatiquement créée pour résoudre la problématique : test description','Maintenance','Normale','En cours',9,2,10,'2025-08-23 16:29:10','2025-08-23 16:30:11',NULL,'2025-08-26 00:00:00',NULL,NULL,'Créée automatiquement lors du passage au statut \"En cours\" de la problématique #28',NULL,NULL,'2025-08-23 16:29:10','2025-08-23 16:30:11','28'),(6,'Résoudre : climatiseur de la chambre 1005 deffectueux','Tâche automatiquement créée pour résoudre la problématique : test description ','Maintenance','Basse','À faire',9,16,10,'2025-09-09 12:23:07',NULL,NULL,'2025-09-13 00:00:00',NULL,NULL,'Créée automatiquement lors du passage au statut \"En cours\" de la problématique #40',NULL,NULL,'2025-09-09 12:23:07','2025-09-09 12:23:07','40');
/*!40000 ALTER TABLE `tbl_taches` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tbl_transferts_articles`
--

DROP TABLE IF EXISTS `tbl_transferts_articles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tbl_transferts_articles` (
  `id` int NOT NULL AUTO_INCREMENT,
  `cycle_vie_id` int NOT NULL,
  `entrepot_origine_id` int NOT NULL,
  `entrepot_destination_id` int NOT NULL,
  `moyen_transport` varchar(100) DEFAULT NULL,
  `numero_transport` varchar(50) DEFAULT NULL,
  `date_expedition` datetime DEFAULT NULL,
  `date_reception` datetime DEFAULT NULL,
  `responsable_expedition_id` int DEFAULT NULL,
  `responsable_reception_id` int DEFAULT NULL,
  `etat_reception` enum('Bon','Endommage','Incomplet','Perdu') DEFAULT 'Bon',
  `observations_reception` text,
  PRIMARY KEY (`id`),
  KEY `idx_cycle_vie_id` (`cycle_vie_id`),
  KEY `idx_entrepot_origine` (`entrepot_origine_id`),
  KEY `idx_entrepot_destination` (`entrepot_destination_id`),
  CONSTRAINT `tbl_transferts_articles_ibfk_1` FOREIGN KEY (`cycle_vie_id`) REFERENCES `tbl_cycle_vie_articles` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tbl_transferts_articles`
--

LOCK TABLES `tbl_transferts_articles` WRITE;
/*!40000 ALTER TABLE `tbl_transferts_articles` DISABLE KEYS */;
INSERT INTO `tbl_transferts_articles` VALUES (1,4,1,2,'Camion de livraison','TR-001','2025-01-10 08:00:00','2025-01-10 14:00:00',3,6,'Bon','Réception en bon état');
/*!40000 ALTER TABLE `tbl_transferts_articles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tbl_utilisateurs`
--

DROP TABLE IF EXISTS `tbl_utilisateurs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tbl_utilisateurs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nom` varchar(100) NOT NULL,
  `prenom` varchar(100) NOT NULL,
  `email` varchar(255) NOT NULL,
  `mot_de_passe` varchar(255) NOT NULL,
  `role` enum('Agent Chambre','Superviseur Resto','Superviseur Buanderie','Superviseur Housing','Superviseur RH','Superviseur Comptable','Web Master','Superviseur Finance','Agent','Superviseur','Administrateur','Patron','Guichetier','Superviseur Stock') CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT 'Agent',
  `telephone` varchar(20) DEFAULT NULL,
  `departement_id` int DEFAULT NULL,
  `sous_departement_id` int DEFAULT NULL,
  `actif` tinyint(1) DEFAULT '1',
  `derniere_connexion` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  UNIQUE KEY `email_2` (`email`),
  KEY `idx_utilisateurs_departement_id` (`departement_id`),
  KEY `idx_utilisateurs_sous_departement_id` (`sous_departement_id`),
  KEY `idx_utilisateurs_departement_sous_departement` (`departement_id`,`sous_departement_id`),
  CONSTRAINT `fk_utilisateurs_departement` FOREIGN KEY (`departement_id`) REFERENCES `tbl_departements` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_utilisateurs_sous_departement` FOREIGN KEY (`sous_departement_id`) REFERENCES `tbl_sous_departements` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=27 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tbl_utilisateurs`
--

LOCK TABLES `tbl_utilisateurs` WRITE;
/*!40000 ALTER TABLE `tbl_utilisateurs` DISABLE KEYS */;
INSERT INTO `tbl_utilisateurs` VALUES (1,'Kadima','Andy','patron@beatrice.com','$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi','Patron','+33 1 42 86 12 34',10,NULL,1,'2025-09-08 20:11:03','2025-07-29 23:08:34','2025-09-08 20:11:03'),(2,'Mpaka','Alim','admin@beatrice.com','$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi','Administrateur','+33 1 42 86 12 35',7,1,1,'2025-09-17 22:57:28','2025-07-29 23:08:34','2025-09-17 22:57:28'),(3,'Bernard','Sophie','sophie.bernard@beatrice.com','$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi','Administrateur','+33 1 42 86 12 36',11,14,1,NULL,'2025-07-29 23:08:34','2025-08-17 14:06:16'),(4,'Muswaswa','Bruce','superviseur@beatrice.com','$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi','Superviseur','+243987654321',11,NULL,1,'2025-09-09 12:21:55','2025-07-29 23:08:34','2025-09-09 12:21:55'),(5,'Moreau','Isabelle','isabelle.moreau@beatrice.com','$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi','Superviseur Finance','+33 1 42 86 12 38',NULL,NULL,1,'2025-09-09 11:04:52','2025-07-29 23:08:34','2025-09-09 11:04:52'),(6,'Petit','Michel','michel.petit@beatrice.com','$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi','Superviseur Stock','+33 1 42 86 12 39',NULL,NULL,1,'2025-09-12 14:33:24','2025-07-29 23:08:34','2025-09-12 14:33:24'),(7,'Dubois','Anne','anne.dubois@beatrice.com','$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi','Agent','+33 1 42 86 12 40',NULL,NULL,1,NULL,'2025-07-29 23:08:34','2025-07-29 23:08:34'),(8,'Rousseau','Thomas','thomas.rousseau@beatrice.com','$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi','Agent','+33 1 42 86 12 41',NULL,NULL,0,NULL,'2025-07-29 23:08:34','2025-07-30 14:21:37'),(9,'Blanc','Catherine','catherine.blanc@beatrice.com','$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi','Agent','+33 1 42 86 12 42',7,1,1,NULL,'2025-07-29 23:08:34','2025-08-17 14:10:49'),(10,'test superviseur','Mpaka','testsuper@beatrice.com','$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi','Superviseur','+33 1 42 86 12 43',11,13,1,'2025-09-12 14:37:19','2025-07-29 23:08:34','2025-09-12 14:37:19'),(11,'Elysée','Ngoya','elysee.ngoya@beatrice.com','$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi','Guichetier','+33 1 42 86 12 44',NULL,NULL,1,NULL,'2025-07-29 23:08:34','2025-07-29 23:08:34'),(12,'Jael','Kikadilu','jael.kikadilu@beatrice.com','$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi','Guichetier','+33 1 42 86 12 45',NULL,NULL,1,'2025-08-27 19:57:23','2025-07-29 23:08:34','2025-08-27 19:57:23'),(13,'kikso','palkos','kiksopalkos@beatrice.com','$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi','Web Master','+33 1 42 86 12 46',NULL,NULL,1,'2025-08-28 22:10:57','2025-07-29 23:08:34','2025-08-28 22:10:57'),(14,'Roux','David','david.roux@beatrice.com','$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi','Superviseur Housing','+33 1 42 86 12 47',NULL,NULL,1,'2025-09-17 22:47:24','2025-07-29 23:08:34','2025-09-17 22:47:24'),(15,'Chef ','Resto','cuisto@beatrice.com','$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi','Superviseur Resto','+33 1 42 86 12 48',NULL,NULL,1,'2025-09-09 12:05:07','2025-07-29 23:08:34','2025-09-09 12:05:07'),(16,'Bonkanya','eli','eli@gmail.com','$2a$12$pR0JpysqwTFu7FbqNhpeTeWuaflV810R33msi4mdUIEMecxq.rHs6','Agent','08163712348',NULL,NULL,1,'2025-09-09 12:23:34','2025-07-30 14:40:11','2025-09-09 12:23:34'),(17,'Test','Admin','test@admin.com','$2a$12$BmBpgtiAegUiHKznL.spWeLiSe2ITZ4SZ.e2BY6mWcCXcclZRzpyu','Administrateur','0816371059',10,NULL,1,'2025-08-10 17:16:17','2025-08-10 17:15:42','2025-08-10 17:16:17'),(21,'Test','User','test.user@beatrice.com','$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi','Superviseur Comptable','+33123456789',10,11,1,NULL,'2025-08-17 13:31:02','2025-08-17 13:31:02'),(22,'Thierry','Musampa','test.user2@beatrice.com','$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi','Superviseur RH','+33123456789',10,11,1,'2025-09-17 20:30:43','2025-08-17 13:34:44','2025-09-17 20:30:43'),(23,'Test','User3','test.user3@beatrice.com','$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi','Agent','+33123456789',10,11,1,NULL,'2025-08-17 13:35:43','2025-08-17 13:35:43'),(24,'test zepekeion','didier','zepeck@beatrice.com','$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi','Agent','09872737888',11,13,1,NULL,'2025-08-17 13:48:59','2025-08-17 13:48:59'),(25,'lass','papyto','papytolas@beatrice.com','$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi','Agent','0816371059',11,14,1,NULL,'2025-08-24 21:56:44','2025-08-24 21:56:44'),(26,'tumsifu','rachel','rachdas@beatrice.com','$2a$12$oN3nEB25iy5LLOf51lSPU.vkgf8cXpUG/6RKiUVfRpJeE9RVr5FOa','Agent Chambre','0816371059',12,16,1,'2025-09-17 23:30:01','2025-09-17 22:30:48','2025-09-17 23:30:01');
/*!40000 ALTER TABLE `tbl_utilisateurs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tbl_ventes_dons_articles`
--

DROP TABLE IF EXISTS `tbl_ventes_dons_articles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tbl_ventes_dons_articles` (
  `id` int NOT NULL AUTO_INCREMENT,
  `cycle_vie_id` int NOT NULL,
  `type_operation` enum('Vente','Don','Echange','Location') NOT NULL,
  `beneficiaire` varchar(100) DEFAULT NULL,
  `document_justificatif` varchar(100) DEFAULT NULL,
  `montant_vente` decimal(12,2) DEFAULT NULL,
  `devise` varchar(3) DEFAULT 'FC',
  `date_operation` datetime NOT NULL,
  `responsable_operation_id` int DEFAULT NULL,
  `observations` text,
  PRIMARY KEY (`id`),
  KEY `idx_cycle_vie_id` (`cycle_vie_id`),
  KEY `idx_type_operation` (`type_operation`),
  KEY `idx_date_operation` (`date_operation`),
  CONSTRAINT `tbl_ventes_dons_articles_ibfk_1` FOREIGN KEY (`cycle_vie_id`) REFERENCES `tbl_cycle_vie_articles` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tbl_ventes_dons_articles`
--

LOCK TABLES `tbl_ventes_dons_articles` WRITE;
/*!40000 ALTER TABLE `tbl_ventes_dons_articles` DISABLE KEYS */;
INSERT INTO `tbl_ventes_dons_articles` VALUES (1,3,'Vente','Client XYZ','Facture de vente FV-001',20000.00,'FC','2025-01-08 10:00:00',1,'Vente d\'article en bon état');
/*!40000 ALTER TABLE `tbl_ventes_dons_articles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Temporary view structure for view `v_buanderie_mouvements`
--

DROP TABLE IF EXISTS `v_buanderie_mouvements`;
/*!50001 DROP VIEW IF EXISTS `v_buanderie_mouvements`*/;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `v_buanderie_mouvements` AS SELECT 
 1 AS `id`,
 1 AS `inventaire_id`,
 1 AS `nom_article`,
 1 AS `reference_article`,
 1 AS `chambre_id`,
 1 AS `numero_chambre`,
 1 AS `type_chambre`,
 1 AS `type_mouvement`,
 1 AS `quantite`,
 1 AS `prix_unitaire`,
 1 AS `montant_total`,
 1 AS `date_mouvement`,
 1 AS `notes`,
 1 AS `etat_linge`,
 1 AS `priorite`,
 1 AS `date_retour_prevue`,
 1 AS `responsable_id`,
 1 AS `nom_responsable`,
 1 AS `categorie`,
 1 AS `date_creation`*/;
SET character_set_client = @saved_cs_client;

--
-- Temporary view structure for view `v_buanderie_operations_cours`
--

DROP TABLE IF EXISTS `v_buanderie_operations_cours`;
/*!50001 DROP VIEW IF EXISTS `v_buanderie_operations_cours`*/;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `v_buanderie_operations_cours` AS SELECT 
 1 AS `id`,
 1 AS `type_operation`,
 1 AS `quantite`,
 1 AS `etat_linge`,
 1 AS `priorite`,
 1 AS `date_operation`,
 1 AS `date_retour_prevue`,
 1 AS `motif`,
 1 AS `statut`,
 1 AS `nom_article`,
 1 AS `categorie_article`,
 1 AS `numero_chambre`,
 1 AS `type_chambre`,
 1 AS `nom_utilisateur`,
 1 AS `prenom_utilisateur`,
 1 AS `nom_responsable`,
 1 AS `prenom_responsable`*/;
SET character_set_client = @saved_cs_client;

--
-- Temporary view structure for view `v_buanderie_statistiques`
--

DROP TABLE IF EXISTS `v_buanderie_statistiques`;
/*!50001 DROP VIEW IF EXISTS `v_buanderie_statistiques`*/;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `v_buanderie_statistiques` AS SELECT 
 1 AS `total_operations`,
 1 AS `total_envois`,
 1 AS `total_retours`,
 1 AS `total_transferts`,
 1 AS `total_pertes`,
 1 AS `total_endommagements`,
 1 AS `total_propre`,
 1 AS `total_sale`,
 1 AS `total_en_cours`,
 1 AS `total_perdu`,
 1 AS `total_endommage`,
 1 AS `total_urgente`,
 1 AS `total_normale`,
 1 AS `total_basse`,
 1 AS `total_en_cours_statut`,
 1 AS `total_termine`,
 1 AS `total_annule`,
 1 AS `total_quantite_linge`,
 1 AS `cout_moyen_operation`*/;
SET character_set_client = @saved_cs_client;

--
-- Temporary view structure for view `v_cout_article_cycle_vie`
--

DROP TABLE IF EXISTS `v_cout_article_cycle_vie`;
/*!50001 DROP VIEW IF EXISTS `v_cout_article_cycle_vie`*/;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `v_cout_article_cycle_vie` AS SELECT 
 1 AS `article_id`,
 1 AS `nom_article`,
 1 AS `reference_article`,
 1 AS `cout_acquisition`,
 1 AS `cout_maintenance`,
 1 AS `cout_perte`,
 1 AS `revenus_vente`,
 1 AS `nombre_operations`,
 1 AS `derniere_operation`*/;
SET character_set_client = @saved_cs_client;

--
-- Temporary view structure for view `v_cycle_vie_complet`
--

DROP TABLE IF EXISTS `v_cycle_vie_complet`;
/*!50001 DROP VIEW IF EXISTS `v_cycle_vie_complet`*/;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `v_cycle_vie_complet` AS SELECT 
 1 AS `id`,
 1 AS `article_id`,
 1 AS `nom_article`,
 1 AS `reference_article`,
 1 AS `type_operation`,
 1 AS `date_operation`,
 1 AS `quantite`,
 1 AS `unite`,
 1 AS `lieu_origine`,
 1 AS `lieu_destination`,
 1 AS `reference_document`,
 1 AS `cout_unitaire`,
 1 AS `cout_total`,
 1 AS `statut`,
 1 AS `observations`,
 1 AS `utilisateur_operation`,
 1 AS `role_utilisateur`*/;
SET character_set_client = @saved_cs_client;

--
-- Temporary view structure for view `v_stats_bons_menage_espace`
--

DROP TABLE IF EXISTS `v_stats_bons_menage_espace`;
/*!50001 DROP VIEW IF EXISTS `v_stats_bons_menage_espace`*/;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `v_stats_bons_menage_espace` AS SELECT 
 1 AS `numero_chambre_espace`,
 1 AS `total_bons`,
 1 AS `etat_propre`,
 1 AS `etat_sale`,
 1 AS `etat_tres_sale`,
 1 AS `etat_desordre`,
 1 AS `etat_rien_signal`,
 1 AS `duree_moyenne_minutes`*/;
SET character_set_client = @saved_cs_client;

--
-- Temporary view structure for view `v_stats_bons_menage_shift`
--

DROP TABLE IF EXISTS `v_stats_bons_menage_shift`;
/*!50001 DROP VIEW IF EXISTS `v_stats_bons_menage_shift`*/;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `v_stats_bons_menage_shift` AS SELECT 
 1 AS `shift`,
 1 AS `total_bons`,
 1 AS `bons_parfaits`,
 1 AS `bons_bons`,
 1 AS `bons_moyens`,
 1 AS `bons_problemes`,
 1 AS `duree_moyenne_minutes`*/;
SET character_set_client = @saved_cs_client;

--
-- Temporary view structure for view `v_stats_bons_menage_utilisateur`
--

DROP TABLE IF EXISTS `v_stats_bons_menage_utilisateur`;
/*!50001 DROP VIEW IF EXISTS `v_stats_bons_menage_utilisateur`*/;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `v_stats_bons_menage_utilisateur` AS SELECT 
 1 AS `utilisateur_id`,
 1 AS `nom_utilisateur`,
 1 AS `total_bons`,
 1 AS `bons_parfaits`,
 1 AS `bons_bons`,
 1 AS `bons_moyens`,
 1 AS `bons_problemes`,
 1 AS `pourcentage_parfait`*/;
SET character_set_client = @saved_cs_client;

--
-- Temporary view structure for view `vw_problematiques_avec_images`
--

DROP TABLE IF EXISTS `vw_problematiques_avec_images`;
/*!50001 DROP VIEW IF EXISTS `vw_problematiques_avec_images`*/;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `vw_problematiques_avec_images` AS SELECT 
 1 AS `id`,
 1 AS `titre`,
 1 AS `description`,
 1 AS `type`,
 1 AS `priorite`,
 1 AS `statut`,
 1 AS `chambre_id`,
 1 AS `rapporteur_id`,
 1 AS `assigne_id`,
 1 AS `date_creation`,
 1 AS `date_resolution`,
 1 AS `date_limite`,
 1 AS `fichiers`,
 1 AS `nombre_images`,
 1 AS `image_principale`,
 1 AS `commentaires`,
 1 AS `tags`,
 1 AS `created_at`,
 1 AS `updated_at`,
 1 AS `nombre_images_actives`,
 1 AS `images_json`*/;
SET character_set_client = @saved_cs_client;

--
-- Final view structure for view `v_buanderie_mouvements`
--

/*!50001 DROP VIEW IF EXISTS `v_buanderie_mouvements`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_0900_ai_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 SQL SECURITY DEFINER */
/*!50001 VIEW `v_buanderie_mouvements` AS select `ms`.`id` AS `id`,`ms`.`inventaire_id` AS `inventaire_id`,`i`.`nom` AS `nom_article`,`i`.`numero_reference` AS `reference_article`,`ms`.`chambre_id` AS `chambre_id`,`c`.`numero` AS `numero_chambre`,`c`.`type` AS `type_chambre`,`ms`.`type_mouvement` AS `type_mouvement`,`ms`.`quantite` AS `quantite`,`ms`.`prix_unitaire` AS `prix_unitaire`,`ms`.`montant_total` AS `montant_total`,`ms`.`date_mouvement` AS `date_mouvement`,`ms`.`notes` AS `notes`,`ms`.`etat_linge` AS `etat_linge`,`ms`.`priorite` AS `priorite`,`ms`.`date_retour_prevue` AS `date_retour_prevue`,`ms`.`responsable_id` AS `responsable_id`,concat(`u`.`nom`,' ',`u`.`prenom`) AS `nom_responsable`,`ms`.`categorie` AS `categorie`,`ms`.`date_creation` AS `date_creation` from (((`tbl_mouvements_stock` `ms` join `tbl_inventaire` `i` on((`ms`.`inventaire_id` = `i`.`id`))) join `tbl_chambres` `c` on((`ms`.`chambre_id` = `c`.`id`))) left join `tbl_utilisateurs` `u` on((`ms`.`responsable_id` = `u`.`id`))) where ((`ms`.`categorie` = 'linge') or (`i`.`categorie` = 'linge')) order by `ms`.`date_mouvement` desc */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;

--
-- Final view structure for view `v_buanderie_operations_cours`
--

/*!50001 DROP VIEW IF EXISTS `v_buanderie_operations_cours`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_0900_ai_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 SQL SECURITY DEFINER */
/*!50001 VIEW `v_buanderie_operations_cours` AS select `b`.`id` AS `id`,`b`.`type_operation` AS `type_operation`,`b`.`quantite` AS `quantite`,`b`.`etat_linge` AS `etat_linge`,`b`.`priorite` AS `priorite`,`b`.`date_operation` AS `date_operation`,`b`.`date_retour_prevue` AS `date_retour_prevue`,`b`.`motif` AS `motif`,`b`.`statut` AS `statut`,`i`.`nom` AS `nom_article`,`i`.`categorie` AS `categorie_article`,`c`.`numero` AS `numero_chambre`,`c`.`type` AS `type_chambre`,`u`.`nom` AS `nom_utilisateur`,`u`.`prenom` AS `prenom_utilisateur`,`r`.`nom` AS `nom_responsable`,`r`.`prenom` AS `prenom_responsable` from ((((`tbl_buanderie` `b` join `tbl_inventaire` `i` on((`b`.`inventaire_id` = `i`.`id`))) left join `tbl_chambres` `c` on((`b`.`chambre_id` = `c`.`id`))) join `tbl_utilisateurs` `u` on((`b`.`utilisateur_id` = `u`.`id`))) left join `tbl_utilisateurs` `r` on((`b`.`responsable_id` = `r`.`id`))) where (`b`.`statut` = 'En cours') order by `b`.`priorite` desc,`b`.`date_operation` */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;

--
-- Final view structure for view `v_buanderie_statistiques`
--

/*!50001 DROP VIEW IF EXISTS `v_buanderie_statistiques`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_0900_ai_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 SQL SECURITY DEFINER */
/*!50001 VIEW `v_buanderie_statistiques` AS select count(0) AS `total_operations`,sum((case when (`tbl_buanderie`.`type_operation` = 'Envoi') then 1 else 0 end)) AS `total_envois`,sum((case when (`tbl_buanderie`.`type_operation` = 'Retour') then 1 else 0 end)) AS `total_retours`,sum((case when (`tbl_buanderie`.`type_operation` = 'Transfert') then 1 else 0 end)) AS `total_transferts`,sum((case when (`tbl_buanderie`.`type_operation` = 'Perte') then 1 else 0 end)) AS `total_pertes`,sum((case when (`tbl_buanderie`.`type_operation` = 'Endommagement') then 1 else 0 end)) AS `total_endommagements`,sum((case when (`tbl_buanderie`.`etat_linge` = 'Propre') then 1 else 0 end)) AS `total_propre`,sum((case when (`tbl_buanderie`.`etat_linge` = 'Sale') then 1 else 0 end)) AS `total_sale`,sum((case when (`tbl_buanderie`.`etat_linge` = 'En cours') then 1 else 0 end)) AS `total_en_cours`,sum((case when (`tbl_buanderie`.`etat_linge` = 'Perdu') then 1 else 0 end)) AS `total_perdu`,sum((case when (`tbl_buanderie`.`etat_linge` = 'Endommagé') then 1 else 0 end)) AS `total_endommage`,sum((case when (`tbl_buanderie`.`priorite` = 'Urgente') then 1 else 0 end)) AS `total_urgente`,sum((case when (`tbl_buanderie`.`priorite` = 'Normale') then 1 else 0 end)) AS `total_normale`,sum((case when (`tbl_buanderie`.`priorite` = 'Basse') then 1 else 0 end)) AS `total_basse`,sum((case when (`tbl_buanderie`.`statut` = 'En cours') then 1 else 0 end)) AS `total_en_cours_statut`,sum((case when (`tbl_buanderie`.`statut` = 'Terminé') then 1 else 0 end)) AS `total_termine`,sum((case when (`tbl_buanderie`.`statut` = 'Annulé') then 1 else 0 end)) AS `total_annule`,sum(`tbl_buanderie`.`quantite`) AS `total_quantite_linge`,avg(`tbl_buanderie`.`cout_operation`) AS `cout_moyen_operation` from `tbl_buanderie` */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;

--
-- Final view structure for view `v_cout_article_cycle_vie`
--

/*!50001 DROP VIEW IF EXISTS `v_cout_article_cycle_vie`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_0900_ai_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 SQL SECURITY DEFINER */
/*!50001 VIEW `v_cout_article_cycle_vie` AS select `cva`.`article_id` AS `article_id`,`i`.`nom` AS `nom_article`,`i`.`numero_reference` AS `reference_article`,sum((case when (`cva`.`type_operation` in ('Creation','Reception')) then `cva`.`cout_total` else 0 end)) AS `cout_acquisition`,sum((case when (`cva`.`type_operation` = 'Maintenance') then `cva`.`cout_total` else 0 end)) AS `cout_maintenance`,sum((case when (`cva`.`type_operation` in ('Perte','Vol','Destruction')) then `cva`.`cout_total` else 0 end)) AS `cout_perte`,sum((case when (`cva`.`type_operation` = 'Vente') then `cva`.`cout_total` else 0 end)) AS `revenus_vente`,count(0) AS `nombre_operations`,max(`cva`.`date_operation`) AS `derniere_operation` from (`tbl_cycle_vie_articles` `cva` join `tbl_inventaire` `i` on((`cva`.`article_id` = `i`.`id`))) group by `cva`.`article_id`,`i`.`nom`,`i`.`numero_reference` */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;

--
-- Final view structure for view `v_cycle_vie_complet`
--

/*!50001 DROP VIEW IF EXISTS `v_cycle_vie_complet`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_0900_ai_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 SQL SECURITY DEFINER */
/*!50001 VIEW `v_cycle_vie_complet` AS select `cva`.`id` AS `id`,`cva`.`article_id` AS `article_id`,`i`.`nom` AS `nom_article`,`i`.`numero_reference` AS `reference_article`,`cva`.`type_operation` AS `type_operation`,`cva`.`date_operation` AS `date_operation`,`cva`.`quantite` AS `quantite`,`cva`.`unite` AS `unite`,`cva`.`lieu_origine` AS `lieu_origine`,`cva`.`lieu_destination` AS `lieu_destination`,`cva`.`reference_document` AS `reference_document`,`cva`.`cout_unitaire` AS `cout_unitaire`,`cva`.`cout_total` AS `cout_total`,`cva`.`statut` AS `statut`,`cva`.`observations` AS `observations`,concat(`u`.`nom`,' ',`u`.`prenom`) AS `utilisateur_operation`,`u`.`role` AS `role_utilisateur` from ((`tbl_cycle_vie_articles` `cva` join `tbl_inventaire` `i` on((`cva`.`article_id` = `i`.`id`))) join `tbl_utilisateurs` `u` on((`cva`.`utilisateur_id` = `u`.`id`))) order by `cva`.`article_id`,`cva`.`date_operation` desc */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;

--
-- Final view structure for view `v_stats_bons_menage_espace`
--

/*!50001 DROP VIEW IF EXISTS `v_stats_bons_menage_espace`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_0900_ai_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 SQL SECURITY DEFINER */
/*!50001 VIEW `v_stats_bons_menage_espace` AS select `bons_de_menage`.`numero_chambre_espace` AS `numero_chambre_espace`,count(0) AS `total_bons`,count((case when (`bons_de_menage`.`etat_matin` = 'Propre') then 1 end)) AS `etat_propre`,count((case when (`bons_de_menage`.`etat_matin` = 'Sale') then 1 end)) AS `etat_sale`,count((case when (`bons_de_menage`.`etat_matin` = 'Très sale') then 1 end)) AS `etat_tres_sale`,count((case when (`bons_de_menage`.`etat_matin` = 'En désordre') then 1 end)) AS `etat_desordre`,count((case when (`bons_de_menage`.`etat_matin` = 'Rien à signaler') then 1 end)) AS `etat_rien_signal`,avg(timestampdiff(MINUTE,`bons_de_menage`.`heure_entree`,`bons_de_menage`.`heure_sortie`)) AS `duree_moyenne_minutes` from `bons_de_menage` group by `bons_de_menage`.`numero_chambre_espace` */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;

--
-- Final view structure for view `v_stats_bons_menage_shift`
--

/*!50001 DROP VIEW IF EXISTS `v_stats_bons_menage_shift`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_0900_ai_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 SQL SECURITY DEFINER */
/*!50001 VIEW `v_stats_bons_menage_shift` AS select `bons_de_menage`.`shift` AS `shift`,count(0) AS `total_bons`,count((case when (`bons_de_menage`.`etat_chambre_apres_entretien` = 'Parfait') then 1 end)) AS `bons_parfaits`,count((case when (`bons_de_menage`.`etat_chambre_apres_entretien` = 'Bon') then 1 end)) AS `bons_bons`,count((case when (`bons_de_menage`.`etat_chambre_apres_entretien` = 'Moyen') then 1 end)) AS `bons_moyens`,count((case when (`bons_de_menage`.`etat_chambre_apres_entretien` = 'Problème signalé') then 1 end)) AS `bons_problemes`,avg(timestampdiff(MINUTE,`bons_de_menage`.`heure_entree`,`bons_de_menage`.`heure_sortie`)) AS `duree_moyenne_minutes` from `bons_de_menage` group by `bons_de_menage`.`shift` */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;

--
-- Final view structure for view `v_stats_bons_menage_utilisateur`
--

/*!50001 DROP VIEW IF EXISTS `v_stats_bons_menage_utilisateur`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_0900_ai_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 SQL SECURITY DEFINER */
/*!50001 VIEW `v_stats_bons_menage_utilisateur` AS select `bons_de_menage`.`utilisateur_id` AS `utilisateur_id`,`bons_de_menage`.`nom_utilisateur` AS `nom_utilisateur`,count(0) AS `total_bons`,count((case when (`bons_de_menage`.`etat_chambre_apres_entretien` = 'Parfait') then 1 end)) AS `bons_parfaits`,count((case when (`bons_de_menage`.`etat_chambre_apres_entretien` = 'Bon') then 1 end)) AS `bons_bons`,count((case when (`bons_de_menage`.`etat_chambre_apres_entretien` = 'Moyen') then 1 end)) AS `bons_moyens`,count((case when (`bons_de_menage`.`etat_chambre_apres_entretien` = 'Problème signalé') then 1 end)) AS `bons_problemes`,round(((count((case when (`bons_de_menage`.`etat_chambre_apres_entretien` = 'Parfait') then 1 end)) * 100.0) / count(0)),2) AS `pourcentage_parfait` from `bons_de_menage` group by `bons_de_menage`.`utilisateur_id`,`bons_de_menage`.`nom_utilisateur` */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;

--
-- Final view structure for view `vw_problematiques_avec_images`
--

/*!50001 DROP VIEW IF EXISTS `vw_problematiques_avec_images`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_0900_ai_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 SQL SECURITY DEFINER */
/*!50001 VIEW `vw_problematiques_avec_images` AS select `p`.`id` AS `id`,`p`.`titre` AS `titre`,`p`.`description` AS `description`,`p`.`type` AS `type`,`p`.`priorite` AS `priorite`,`p`.`statut` AS `statut`,`p`.`chambre_id` AS `chambre_id`,`p`.`rapporteur_id` AS `rapporteur_id`,`p`.`assigne_id` AS `assigne_id`,`p`.`date_creation` AS `date_creation`,`p`.`date_resolution` AS `date_resolution`,`p`.`date_limite` AS `date_limite`,`p`.`fichiers` AS `fichiers`,`p`.`nombre_images` AS `nombre_images`,`p`.`image_principale` AS `image_principale`,`p`.`commentaires` AS `commentaires`,`p`.`tags` AS `tags`,`p`.`created_at` AS `created_at`,`p`.`updated_at` AS `updated_at`,count(`pi`.`id`) AS `nombre_images_actives`,group_concat(json_object('id',`pi`.`id`,'nom_fichier',`pi`.`nom_fichier`,'nom_original',`pi`.`nom_original`,'chemin_fichier',`pi`.`chemin_fichier`,'type_mime',`pi`.`type_mime`,'taille',`pi`.`taille`,'source',`pi`.`source`,'date_upload',`pi`.`date_upload`) separator '|') AS `images_json` from (`tbl_problematiques` `p` left join `tbl_problematiques_images` `pi` on(((`p`.`id` = `pi`.`problematique_id`) and (`pi`.`statut` = 'actif')))) group by `p`.`id` */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-09-18 10:24:14

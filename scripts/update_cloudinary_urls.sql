-- Script de mise à jour des URLs Cloudinary dans la base de données
-- Met à jour le champ chemin_fichier avec les URLs Cloudinary

USE hotel_beatrice;

-- Afficher l'état actuel
SELECT 
    'État actuel' as info,
    COUNT(*) as total_images,
    COUNT(CASE WHEN chemin_fichier LIKE '/uploads/%' THEN 1 END) as local_paths,
    COUNT(CASE WHEN public_id IS NOT NULL THEN 1 END) as cloudinary_images,
    COUNT(CASE WHEN chemin_fichier LIKE 'https://res.cloudinary.com/%' THEN 1 END) as cloudinary_urls
FROM tbl_problematiques_images 
WHERE statut = 'actif';

-- Mettre à jour les URLs Cloudinary
UPDATE tbl_problematiques_images 
SET chemin_fichier = CONCAT('https://res.cloudinary.com/df5isxcdl/image/upload/v1/', public_id)
WHERE public_id IS NOT NULL 
  AND chemin_fichier LIKE '/uploads/%'
  AND statut = 'actif';

-- Afficher le nombre de lignes mises à jour
SELECT ROW_COUNT() as lignes_mises_a_jour;

-- Vérifier le résultat
SELECT 
    'Après mise à jour' as info,
    COUNT(*) as total_images,
    COUNT(CASE WHEN chemin_fichier LIKE '/uploads/%' THEN 1 END) as local_paths,
    COUNT(CASE WHEN public_id IS NOT NULL THEN 1 END) as cloudinary_images,
    COUNT(CASE WHEN chemin_fichier LIKE 'https://res.cloudinary.com/%' THEN 1 END) as cloudinary_urls
FROM tbl_problematiques_images 
WHERE statut = 'actif';

-- Afficher quelques exemples d'images mises à jour
SELECT 
    id,
    nom_fichier,
    chemin_fichier,
    public_id
FROM tbl_problematiques_images 
WHERE statut = 'actif' 
  AND chemin_fichier LIKE 'https://res.cloudinary.com/%'
LIMIT 5;

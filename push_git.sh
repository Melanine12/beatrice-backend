#!/bin/bash

# Script pour contourner le problème Xcode et pousser vers GitHub
export DEVELOPER_DIR=""
export PATH="/usr/bin:/bin:/usr/sbin:/sbin"

echo "Ajout des fichiers..."
/usr/bin/git add .

echo "Commit des modifications..."
/usr/bin/git commit -m "Mise à jour des modèles et routes"

echo "Push vers GitHub..."
/usr/bin/git push origin main

echo "Terminé !"

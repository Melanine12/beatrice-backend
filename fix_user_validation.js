// Script pour corriger la validation des utilisateurs
// Problème : Erreurs 400 intermittentes lors de la création d'utilisateurs

const express = require('express');
const { body } = require('express-validator');

// Fonction de validation améliorée pour les IDs de département
const validateDepartmentId = (fieldName) => {
  return body(fieldName).optional().custom((value) => {
    // Accepter null, undefined, chaîne vide, ou un entier positif
    if (value === null || value === undefined || value === '') return true;
    if (typeof value === 'number' && Number.isInteger(value) && value >= 1) return true;
    if (typeof value === 'string') {
      const num = parseInt(value);
      if (!isNaN(num) && Number.isInteger(num) && num >= 1) return true;
    }
    throw new Error(`${fieldName} doit être un entier positif ou vide`);
  });
};

// Validation pour POST /api/users
const createUserValidation = [
  body('nom').isLength({ min: 2, max: 100 }).withMessage('Le nom doit contenir entre 2 et 100 caractères'),
  body('prenom').isLength({ min: 2, max: 100 }).withMessage('Le prénom doit contenir entre 2 et 100 caractères'),
  body('email').isEmail().normalizeEmail().withMessage('Email invalide'),
  body('mot_de_passe').isLength({ min: 6 }).withMessage('Le mot de passe doit contenir au moins 6 caractères'),
  body('role').isIn(['Agent', 'Superviseur', 'Administrateur', 'Patron']).withMessage('Rôle invalide'),
  body('telephone').optional().isLength({ max: 20 }).withMessage('Le téléphone ne peut pas dépasser 20 caractères'),
  validateDepartmentId('departement_id'),
  validateDepartmentId('sous_departement_id')
];

// Validation pour PUT /api/users/:id
const updateUserValidation = [
  body('nom').optional().isLength({ min: 2, max: 100 }).withMessage('Le nom doit contenir entre 2 et 100 caractères'),
  body('prenom').optional().isLength({ min: 2, max: 100 }).withMessage('Le prénom doit contenir entre 2 et 100 caractères'),
  body('email').optional().isEmail().normalizeEmail().withMessage('Email invalide'),
  body('mot_de_passe').optional().isLength({ min: 6 }).withMessage('Le mot de passe doit contenir au moins 6 caractères'),
  body('role').optional().isIn(['Agent', 'Superviseur', 'Administrateur', 'Patron']).withMessage('Rôle invalide'),
  body('telephone').optional().isLength({ max: 20 }).withMessage('Le téléphone ne peut pas dépasser 20 caractères'),
  validateDepartmentId('departement_id'),
  validateDepartmentId('sous_departement_id')
];

module.exports = {
  createUserValidation,
  updateUserValidation,
  validateDepartmentId
};

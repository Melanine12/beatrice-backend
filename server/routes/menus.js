const express = require('express');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// Appliquer l'authentification à toutes les routes
router.use(authenticateToken);

// Configuration des menus par rôle
const MENU_CONFIG = {
  'Patron': [
    'dashboard', 'users', 'departements', 'employees', 'chambres', 'problematiques', 
    'taches', 'inventaire', 'depenses', 'caisses', 'encaissements', 'paiements-salaires',
    'demandes', 'notifications', 'rapports', 'organigramme', 'contrats', 'documents-rh',
    'offres-emploi', 'sanctions', 'gratifications', 'nettoyage', 'pointages'
  ],
  'Administrateur': [
    'dashboard', 'users', 'departements', 'employees', 'chambres', 'problematiques', 
    'taches', 'inventaire', 'depenses', 'caisses', 'encaissements', 'paiements-salaires',
    'demandes', 'notifications', 'rapports', 'organigramme', 'contrats', 'documents-rh',
    'offres-emploi', 'sanctions', 'gratifications', 'nettoyage', 'pointages'
  ],
  'Superviseur': [
    'dashboard', 'employees', 'chambres', 'problematiques', 'taches', 'inventaire', 
    'depenses', 'caisses', 'encaissements', 'demandes', 'notifications', 'rapports',
    'nettoyage', 'pointages'
  ],
  'Superviseur Comptable': [
    'dashboard', 'depenses', 'caisses', 'encaissements', 'paiements-salaires', 
    'demandes', 'rapports'
  ],
  'Superviseur Finance': [
    'dashboard', 'depenses', 'caisses', 'encaissements', 'paiements-salaires', 
    'demandes', 'rapports'
  ],
  'Superviseur RH': [
    'dashboard', 'employees', 'contrats', 'documents-rh', 'offres-emploi', 
    'sanctions', 'gratifications', 'rapports'
  ],
  'Caissier': [
    'dashboard', 'caisses', 'encaissements', 'depenses', 'rapports'
  ],
  'Guichetier': [
    'dashboard', 'encaissements', 'caisses'
  ],
  'Agent Exterieur': [
    'chambres', 'problematiques'
  ],
  'Employe': [
    'dashboard', 'taches', 'pointages', 'notifications'
  ],
  'Receptionniste': [
    'dashboard', 'chambres', 'problematiques', 'taches', 'notifications'
  ],
  'Menage': [
    'dashboard', 'nettoyage', 'taches', 'notifications'
  ],
  'Maintenance': [
    'dashboard', 'problematiques', 'taches', 'notifications'
  ],
  'Auditeur': [
    'dashboard', 'rapports', 'depenses', 'encaissements', 'caisses', 'demandes',
    'problematiques', 'taches', 'inventaire'
  ]
};

// Mapping des menus vers leurs labels et icônes
const MENU_DETAILS = {
  'dashboard': { label: 'Tableau de bord', icon: 'dashboard', path: '/dashboard' },
  'users': { label: 'Utilisateurs', icon: 'users', path: '/users' },
  'departements': { label: 'Départements', icon: 'building', path: '/departements' },
  'employees': { label: 'Employés', icon: 'user-group', path: '/employees' },
  'chambres': { label: 'Espaces et locaux', icon: 'home', path: '/chambres' },
  'problematiques': { label: 'Problèmes', icon: 'exclamation-triangle', path: '/problematiques' },
  'taches': { label: 'Tâches', icon: 'checklist', path: '/taches' },
  'inventaire': { label: 'Inventaire', icon: 'box', path: '/inventaire' },
  'depenses': { label: 'Dépenses', icon: 'receipt', path: '/depenses' },
  'caisses': { label: 'Caisses', icon: 'cash-register', path: '/caisses' },
  'encaissements': { label: 'Encaissements', icon: 'money-bill', path: '/encaissements' },
  'paiements-salaires': { label: 'Paiements salaires', icon: 'credit-card', path: '/paiements-salaires' },
  'demandes': { label: 'Demandes', icon: 'file-text', path: '/demandes' },
  'notifications': { label: 'Notifications', icon: 'bell', path: '/notifications' },
  'rapports': { label: 'Rapports', icon: 'chart-bar', path: '/rapports' },
  'organigramme': { label: 'Organigramme', icon: 'sitemap', path: '/organigramme' },
  'contrats': { label: 'Contrats', icon: 'file-contract', path: '/contrats' },
  'documents-rh': { label: 'Documents RH', icon: 'folder', path: '/documents-rh' },
  'offres-emploi': { label: 'Offres emploi', icon: 'briefcase', path: '/offres-emploi' },
  'sanctions': { label: 'Sanctions', icon: 'exclamation-circle', path: '/sanctions' },
  'gratifications': { label: 'Gratifications', icon: 'gift', path: '/gratifications' },
  'nettoyage': { label: 'Nettoyage', icon: 'sparkles', path: '/nettoyage' },
  'pointages': { label: 'Pointages', icon: 'clock', path: '/pointages' }
};

// GET /api/menus - Récupérer les menus autorisés pour l'utilisateur connecté
router.get('/', async (req, res) => {
  try {
    const userRole = req.user.role;
    
    console.log('🔍 Récupération des menus pour le rôle:', userRole);
    
    // Récupérer les menus autorisés pour ce rôle
    const authorizedMenus = MENU_CONFIG[userRole] || [];
    
    // Construire la réponse avec les détails des menus
    const menus = authorizedMenus.map(menuKey => ({
      key: menuKey,
      ...MENU_DETAILS[menuKey]
    }));
    
    console.log('✅ Menus autorisés:', menus.length, 'pour le rôle:', userRole);
    
    res.json({
      success: true,
      role: userRole,
      menus: menus
    });
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des menus:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des menus',
      error: error.message
    });
  }
});

// GET /api/menus/config - Récupérer la configuration complète des menus (pour debug)
router.get('/config', requireRole(['Patron', 'Administrateur']), async (req, res) => {
  try {
    res.json({
      success: true,
      menuConfig: MENU_CONFIG,
      menuDetails: MENU_DETAILS
    });
  } catch (error) {
    console.error('❌ Erreur lors de la récupération de la config:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de la configuration',
      error: error.message
    });
  }
});

module.exports = router;

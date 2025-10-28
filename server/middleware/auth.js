const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware to verify JWT token
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ 
        error: 'Access token required',
        message: 'Token d\'accès requis'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get user from database
    const user = await User.findByPk(decoded.userId, {
      attributes: { exclude: ['mot_de_passe'] }
    });

    if (!user || !user.actif) {
      return res.status(401).json({ 
        error: 'Invalid or inactive user',
        message: 'Utilisateur invalide ou inactif'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        error: 'Invalid token',
        message: 'Token invalide'
      });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        error: 'Token expired',
        message: 'Token expiré'
      });
    }
    console.error('Auth middleware error:', error);
    return res.status(500).json({ 
      error: 'Authentication error',
      message: 'Erreur d\'authentification'
    });
  }
};

// Middleware to check if user has required role
const requireRole = (requiredRole) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Authentication required',
        message: 'Authentification requise'
      });
    }

    // Gérer les tableaux de rôles
    const requiredRoles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    
    // Debug logging
    console.log('🔍 requireRole check:', {
      userRole: req.user.role,
      requiredRoles: requiredRoles,
      route: req.path,
      method: req.method
    });
    
    // Vérifier si l'utilisateur a un des rôles requis
    if (!requiredRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: 'Insufficient permissions',
        message: `Permissions insuffisantes. Rôle requis: ${requiredRoles.join(', ')}`,
        requiredRole: requiredRoles,
        userRole: req.user.role
      });
    }

    next();
  };
};

// Middleware to check if user can access resource (owner or higher role)
const canAccessResource = (resourceUserIdField = 'user_id') => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Authentication required',
        message: 'Authentification requise'
      });
    }

    const resourceUserId = req.body[resourceUserIdField] || req.params[resourceUserIdField] || req.query[resourceUserIdField];
    
    // Allow if user is Patron or Administrateur
    if (req.user.role === 'Patron' || req.user.role === 'Administrateur') {
      return next();
    }

    // Allow if user owns the resource
    if (resourceUserId && parseInt(resourceUserId) === req.user.id) {
      return next();
    }

    return res.status(403).json({ 
      error: 'Access denied',
      message: 'Accès refusé'
    });
  };
};

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
  );
};

module.exports = {
  authenticateToken,
  requireRole,
  canAccessResource,
  generateToken
}; 
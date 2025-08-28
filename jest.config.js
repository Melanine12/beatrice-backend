module.exports = {
  // Environnement de test
  testEnvironment: 'node',
  
  // Répertoires de test
  testMatch: [
    '**/__tests__/**/*.js',
    '**/?(*.)+(spec|test).js'
  ],
  
  // Répertoires à ignorer
  testPathIgnorePatterns: [
    '/node_modules/',
    '/client/',
    '/uploads/',
    '/logs/'
  ],
  
  // Répertoires de couverture
  collectCoverageFrom: [
    'server/**/*.js',
    '!server/**/*.test.js',
    '!server/**/*.spec.js',
    '!server/index.js'
  ],
  
  // Configuration de la couverture
  coverageDirectory: 'coverage',
  coverageReporters: [
    'text',
    'lcov',
    'html'
  ],
  
  // Seuils de couverture
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    }
  },
  
  // Setup des tests
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  
  // Timeout des tests
  testTimeout: 10000,
  
  // Verbosité
  verbose: true,
  
  // Nettoyage automatique
  clearMocks: true,
  restoreMocks: true,
  
  // Variables d'environnement pour les tests
  setupFiles: ['<rootDir>/tests/env.js']
};

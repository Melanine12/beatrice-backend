// Setup global pour les tests
const path = require('path');

// Configuration globale des tests
global.__basedir = path.resolve(__dirname, '..');

// Mock des logs pour éviter le bruit dans les tests
global.console = {
  ...console,
  log: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Configuration des timeouts
jest.setTimeout(10000);

// Nettoyage après chaque test
afterEach(() => {
  jest.clearAllMocks();
});

// Nettoyage global après tous les tests
afterAll(async () => {
  // Nettoyer les fichiers temporaires si nécessaire
  // await cleanupTestFiles();
});

module.exports = {
  env: {
    browser: true,
    es2021: true,
    node: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:node/recommended',
  ],
  parserOptions: {
    ecmaVersion: 12,
    sourceType: 'module',
  },
  rules: {
    // Règles de base
    'indent': ['error', 2],
    'linebreak-style': ['error', 'unix'],
    'quotes': ['error', 'single'],
    'semi': ['error', 'always'],
    
    // Règles de variables
    'no-var': 'error',
    'prefer-const': 'error',
    'no-unused-vars': ['error', { 'argsIgnorePattern': '^_' }],
    
    // Règles de fonctions
    'func-style': ['error', 'expression'],
    'arrow-spacing': 'error',
    'no-confusing-arrow': 'error',
    
    // Règles d'objets
    'object-shorthand': 'error',
    'prefer-template': 'error',
    
    // Règles de sécurité
    'no-eval': 'error',
    'no-implied-eval': 'error',
    'no-new-func': 'error',
    
    // Règles de formatage
    'comma-dangle': ['error', 'always-multiline'],
    'comma-spacing': 'error',
    'key-spacing': 'error',
    'object-curly-spacing': ['error', 'always'],
    'array-bracket-spacing': ['error', 'never'],
    
    // Règles spécifiques au backend
    'no-console': 'warn',
    'no-debugger': 'error',
    
    // Règles de gestion des erreurs
    'no-throw-literal': 'error',
    'prefer-promise-reject-errors': 'error',
  },
  overrides: [
    {
      files: ['server/**/*.js'],
      env: {
        node: true,
        es6: true,
      },
      rules: {
        'no-console': 'off', // Permettre console.log dans le serveur
      },
    },
    {
      files: ['*.test.js', '*.spec.js'],
      env: {
        jest: true,
      },
      rules: {
        'no-console': 'off',
      },
    },
  ],
};

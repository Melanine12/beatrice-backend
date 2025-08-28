// Configuration de l'environnement pour les tests
process.env.NODE_ENV = 'test';
process.env.PORT = '5003';
process.env.DB_HOST = 'localhost';
process.env.DB_PORT = '3306';
process.env.DB_NAME = 'hotel_beatrice_test';
process.env.DB_USER = 'root';
process.env.DB_PASSWORD = 'test_password';
process.env.JWT_SECRET = 'test_jwt_secret_key_for_testing_only';
process.env.JWT_EXPIRES_IN = '1h';
process.env.LOG_LEVEL = 'error';
process.env.UPLOAD_PATH = './test-uploads';
process.env.MAX_FILE_SIZE = '1048576'; // 1MB pour les tests

require('dotenv').config();

function required(name, fallback) {
  const value = process.env[name] ?? fallback;
  if (value === undefined || value === '') {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT || 4000),
  databaseUrl: required('DATABASE_URL'),
  jwtSecret: required('JWT_SECRET'),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  corsOrigins: (process.env.CORS_ORIGINS || '*').split(',').map((o) => o.trim()),
  uploadDir: process.env.UPLOAD_DIR || 'uploads',
  maxUploadBytes: Number(process.env.MAX_UPLOAD_BYTES || 5 * 1024 * 1024),
  publicUrl: process.env.PUBLIC_URL || `http://localhost:${process.env.PORT || 4000}`,
  disableRateLimit: process.env.DISABLE_RATE_LIMIT === 'true',

  // Au-dela de ce delai sans nouvelle position, un camion n'est plus considere
  // comme disponible : une position figee ne vaut pas une disponibilite.
  truckPositionTtlMinutes: Number(process.env.TRUCK_POSITION_TTL_MINUTES || 1440),

  // Delai de grace apres l'heure de depart pendant lequel un trajet planifie
  // reste propose : un transporteur encore en chargement doit pouvoir etre
  // rejoint, mais un depart d'il y a trois semaines n'a plus rien a faire dans
  // la recherche.
  tripDepartureGraceHours: Number(process.env.TRIP_DEPARTURE_GRACE_HOURS || 3),

  // Reinitialisation de mot de passe. Le code est court, sa duree de vie et le
  // nombre d'essais le sont donc aussi.
  resetCodeTtlMinutes: Number(process.env.RESET_CODE_TTL_MINUTES || 30),
  resetCodeMaxAttempts: Number(process.env.RESET_CODE_MAX_ATTEMPTS || 5),

  // 'log' ecrit le message dans la sortie standard et le garde en memoire :
  // suffisant en developpement, inutilisable en production. 'smtp' passe par
  // nodemailer et SMTP_URL.
  mailDriver: process.env.MAIL_DRIVER === 'smtp' ? 'smtp' : 'log',
  smtpUrl: process.env.SMTP_URL,
  mailFrom: process.env.MAIL_FROM || 'AlloTruck <no-reply@allotruck.dz>',

  // 'local' writes to UPLOAD_DIR, 's3' targets any S3-compatible bucket.
  storageDriver: process.env.STORAGE_DRIVER === 's3' ? 's3' : 'local',
  s3Endpoint: process.env.S3_ENDPOINT,
  s3Region: process.env.S3_REGION || 'auto',
  s3Bucket: process.env.S3_BUCKET,
  s3AccessKeyId: process.env.S3_ACCESS_KEY_ID,
  s3SecretAccessKey: process.env.S3_SECRET_ACCESS_KEY,

  // Notifications push Expo. L'URL est configurable pour permettre aux tests de
  // viser un service local plutot que l'API publique.
  pushEnabled: process.env.PUSH_ENABLED !== 'false',
  expoPushUrl: process.env.EXPO_PUSH_URL || 'https://exp.host/--/api/v2/push/send',
  expoAccessToken: process.env.EXPO_ACCESS_TOKEN,
};

env.isProduction = env.nodeEnv === 'production';

module.exports = env;

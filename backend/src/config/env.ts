import dotenv from 'dotenv';
import { logger } from './logger';

// Cargar variables de entorno
dotenv.config();

// Validar variables de entorno requeridas
const requiredEnvVars = [
  'DATABASE_URL',
  'JWT_SECRET',
  'JWT_REFRESH_SECRET',
] as const;

const optionalEnvVars = [
  'PORT',
  'NODE_ENV',
  'JWT_EXPIRES_IN',
  'JWT_REFRESH_EXPIRES_IN',
  'TWILIO_ACCOUNT_SID',
  'TWILIO_AUTH_TOKEN',
  'TWILIO_WHATSAPP_NUMBER',
  'REDIS_URL',
  'SMTP_HOST',
  'SMTP_PORT',
  'SMTP_USER',
  'SMTP_PASS',
  'EMAIL_FROM',
  'RATE_LIMIT_WINDOW_MS',
  'RATE_LIMIT_MAX_REQUESTS',
  'LOG_LEVEL',
  'LOG_FILE',
] as const;

// Verificar variables requeridas
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  logger.error(`Variables de entorno requeridas faltantes: ${missingVars.join(', ')}`);
  process.exit(1);
}

// Configuración de la aplicación
export const config = {
  // Servidor
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // Base de datos
  databaseUrl: process.env.DATABASE_URL!,
  
  // JWT
  jwt: {
    secret: process.env.JWT_SECRET!,
    refreshSecret: process.env.JWT_REFRESH_SECRET!,
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },
  
  // Twilio/WhatsApp
  twilio: {
    accountSid: process.env.TWILIO_ACCOUNT_SID,
    authToken: process.env.TWILIO_AUTH_TOKEN,
    whatsappNumber: process.env.TWILIO_WHATSAPP_NUMBER,
  },
  
  // Redis
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  },
  
  // Email
  email: {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
    from: process.env.EMAIL_FROM || 'Sistema de Turnos <noreply@sistematurnos.com>',
  },
  
  // Rate Limiting
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 minutos
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  },
  
  // Logging
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    file: process.env.LOG_FILE || 'logs/app.log',
  },
  
  // Flags de características
  features: {
    whatsappEnabled: !!(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN),
    emailEnabled: !!(process.env.SMTP_USER && process.env.SMTP_PASS),
    redisEnabled: !!process.env.REDIS_URL,
  },
} as const;

// Validar configuración específica
if (config.features.whatsappEnabled && !config.twilio.whatsappNumber) {
  logger.warn('WhatsApp está habilitado pero falta TWILIO_WHATSAPP_NUMBER');
}

if (config.features.emailEnabled && (!config.email.user || !config.email.pass)) {
  logger.warn('Email está habilitado pero faltan credenciales SMTP');
}

// Log de configuración en desarrollo
if (config.nodeEnv === 'development') {
  logger.info('Configuración cargada:', {
    port: config.port,
    nodeEnv: config.nodeEnv,
    features: config.features,
  });
}

export default config;
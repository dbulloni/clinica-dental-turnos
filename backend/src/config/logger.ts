import winston from 'winston';
import path from 'path';

// Configuración de niveles de log personalizados
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Configuración de colores para cada nivel
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
};

// Agregar colores a winston
winston.addColors(colors);

// Formato personalizado para logs
const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}`
  )
);

// Formato para archivos (sin colores)
const fileFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Configuración de transports
const transports = [
  // Console transport
  new winston.transports.Console({
    format,
    level: process.env.LOG_LEVEL || 'info',
  }),
];

// Agregar file transport solo si no estamos en testing
if (process.env.NODE_ENV !== 'test') {
  // Crear directorio de logs si no existe
  const logDir = path.join(process.cwd(), 'logs');
  
  transports.push(
    // File transport para todos los logs
    new winston.transports.File({
      filename: path.join(logDir, 'app.log'),
      format: fileFormat,
      level: 'info',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    // File transport solo para errores
    new winston.transports.File({
      filename: path.join(logDir, 'error.log'),
      format: fileFormat,
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    })
  );
}

// Crear logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  levels,
  format: fileFormat,
  transports,
  exitOnError: false,
});

// Función para logging de requests HTTP
export const httpLogger = (req: any, res: any, next: any) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const message = `${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms`;
    
    if (res.statusCode >= 400) {
      logger.error(message);
    } else {
      logger.http(message);
    }
  });
  
  next();
};

// Función para logging de errores no capturados
export const setupErrorLogging = () => {
  process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception:', error);
    process.exit(1);
  });

  process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
  });
};

export { logger };
export default logger;
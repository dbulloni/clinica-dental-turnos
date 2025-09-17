import { PrismaClient } from '@prisma/client';
import { logger } from './logger';

// Configuración del cliente Prisma
const prisma = new PrismaClient({
  log: [
    {
      emit: 'event',
      level: 'query',
    },
    {
      emit: 'event',
      level: 'error',
    },
    {
      emit: 'event',
      level: 'info',
    },
    {
      emit: 'event',
      level: 'warn',
    },
  ],
});

// Configurar logging de Prisma
if (process.env.NODE_ENV === 'development') {
  prisma.$on('query', (e) => {
    logger.debug('Query: ' + e.query);
    logger.debug('Params: ' + e.params);
    logger.debug('Duration: ' + e.duration + 'ms');
  });
}

prisma.$on('error', (e) => {
  logger.error('Prisma Error:', e);
});

prisma.$on('info', (e) => {
  logger.info('Prisma Info:', e.message);
});

prisma.$on('warn', (e) => {
  logger.warn('Prisma Warning:', e.message);
});

// Función para conectar a la base de datos
export const connectDatabase = async (): Promise<void> => {
  try {
    await prisma.$connect();
    logger.info('✅ Conexión a la base de datos establecida correctamente');
  } catch (error) {
    logger.error('❌ Error al conectar con la base de datos:', error);
    process.exit(1);
  }
};

// Función para desconectar de la base de datos
export const disconnectDatabase = async (): Promise<void> => {
  try {
    await prisma.$disconnect();
    logger.info('✅ Desconexión de la base de datos exitosa');
  } catch (error) {
    logger.error('❌ Error al desconectar de la base de datos:', error);
  }
};

// Función para verificar la salud de la base de datos
export const checkDatabaseHealth = async (): Promise<boolean> => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    logger.error('❌ Health check de la base de datos falló:', error);
    return false;
  }
};

// Función para limpiar la base de datos (solo para testing)
export const cleanDatabase = async (): Promise<void> => {
  if (process.env.NODE_ENV !== 'test') {
    throw new Error('cleanDatabase solo puede ser usado en ambiente de testing');
  }

  const tablenames = await prisma.$queryRaw<
    Array<{ tablename: string }>
  >`SELECT tablename FROM pg_tables WHERE schemaname='public'`;

  const tables = tablenames
    .map(({ tablename }) => tablename)
    .filter((name) => name !== '_prisma_migrations')
    .map((name) => `"public"."${name}"`)
    .join(', ');

  try {
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${tables} CASCADE;`);
    logger.info('✅ Base de datos limpiada para testing');
  } catch (error) {
    logger.error('❌ Error al limpiar la base de datos:', error);
    throw error;
  }
};

export { prisma };
export default prisma;
import jwt from 'jsonwebtoken';
import { UserRole } from '@prisma/client';
import { logger } from './logger';

// Interfaces para JWT payload
export interface JWTPayload {
  userId: string;
  email: string;
  role: UserRole;
  firstName: string;
  lastName: string;
}

export interface RefreshTokenPayload {
  userId: string;
  tokenVersion: number;
}

// Configuración JWT
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '15m';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

if (!JWT_SECRET || !JWT_REFRESH_SECRET) {
  throw new Error('JWT_SECRET y JWT_REFRESH_SECRET deben estar definidos en las variables de entorno');
}

// Generar access token
export const generateAccessToken = (payload: JWTPayload): string => {
  try {
    return jwt.sign(payload, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
      issuer: 'sistema-turnos',
      audience: 'sistema-turnos-users',
    });
  } catch (error) {
    logger.error('Error generando access token:', error);
    throw new Error('Error generando token de acceso');
  }
};

// Generar refresh token
export const generateRefreshToken = (payload: RefreshTokenPayload): string => {
  try {
    return jwt.sign(payload, JWT_REFRESH_SECRET, {
      expiresIn: JWT_REFRESH_EXPIRES_IN,
      issuer: 'sistema-turnos',
      audience: 'sistema-turnos-refresh',
    });
  } catch (error) {
    logger.error('Error generando refresh token:', error);
    throw new Error('Error generando token de actualización');
  }
};

// Verificar access token
export const verifyAccessToken = (token: string): JWTPayload => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET, {
      issuer: 'sistema-turnos',
      audience: 'sistema-turnos-users',
    }) as JWTPayload;
    
    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Token expirado');
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('Token inválido');
    }
    logger.error('Error verificando access token:', error);
    throw new Error('Error verificando token');
  }
};

// Verificar refresh token
export const verifyRefreshToken = (token: string): RefreshTokenPayload => {
  try {
    const decoded = jwt.verify(token, JWT_REFRESH_SECRET, {
      issuer: 'sistema-turnos',
      audience: 'sistema-turnos-refresh',
    }) as RefreshTokenPayload;
    
    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Refresh token expirado');
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('Refresh token inválido');
    }
    logger.error('Error verificando refresh token:', error);
    throw new Error('Error verificando refresh token');
  }
};

// Extraer token del header Authorization
export const extractTokenFromHeader = (authHeader: string | undefined): string | null => {
  if (!authHeader) {
    return null;
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null;
  }

  return parts[1];
};

// Generar par de tokens
export const generateTokenPair = (user: JWTPayload, tokenVersion: number = 0) => {
  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken({
    userId: user.userId,
    tokenVersion,
  });

  return {
    accessToken,
    refreshToken,
    expiresIn: JWT_EXPIRES_IN,
  };
};
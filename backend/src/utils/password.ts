import bcrypt from 'bcryptjs';
import { logger } from '@/config/logger';

// Configuración de bcrypt
const SALT_ROUNDS = 12;

/**
 * Hashea una contraseña usando bcrypt
 * @param password - Contraseña en texto plano
 * @returns Promise con la contraseña hasheada
 */
export const hashPassword = async (password: string): Promise<string> => {
  try {
    const salt = await bcrypt.genSalt(SALT_ROUNDS);
    const hashedPassword = await bcrypt.hash(password, salt);
    return hashedPassword;
  } catch (error) {
    logger.error('Error hasheando contraseña:', error);
    throw new Error('Error procesando contraseña');
  }
};

/**
 * Compara una contraseña en texto plano con su hash
 * @param password - Contraseña en texto plano
 * @param hashedPassword - Contraseña hasheada
 * @returns Promise<boolean> - true si coinciden, false si no
 */
export const comparePassword = async (
  password: string,
  hashedPassword: string
): Promise<boolean> => {
  try {
    const isMatch = await bcrypt.compare(password, hashedPassword);
    return isMatch;
  } catch (error) {
    logger.error('Error comparando contraseña:', error);
    throw new Error('Error verificando contraseña');
  }
};

/**
 * Valida la fortaleza de una contraseña
 * @param password - Contraseña a validar
 * @returns objeto con resultado de validación y errores
 */
export const validatePasswordStrength = (password: string) => {
  const errors: string[] = [];
  
  // Longitud mínima
  if (password.length < 8) {
    errors.push('La contraseña debe tener al menos 8 caracteres');
  }
  
  // Al menos una mayúscula
  if (!/[A-Z]/.test(password)) {
    errors.push('La contraseña debe contener al menos una letra mayúscula');
  }
  
  // Al menos una minúscula
  if (!/[a-z]/.test(password)) {
    errors.push('La contraseña debe contener al menos una letra minúscula');
  }
  
  // Al menos un número
  if (!/\d/.test(password)) {
    errors.push('La contraseña debe contener al menos un número');
  }
  
  // Al menos un carácter especial
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('La contraseña debe contener al menos un carácter especial');
  }
  
  // No debe contener espacios
  if (/\s/.test(password)) {
    errors.push('La contraseña no debe contener espacios');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    strength: calculatePasswordStrength(password),
  };
};

/**
 * Calcula la fortaleza de una contraseña (0-100)
 * @param password - Contraseña a evaluar
 * @returns número entre 0 y 100 representando la fortaleza
 */
const calculatePasswordStrength = (password: string): number => {
  let score = 0;
  
  // Longitud
  if (password.length >= 8) score += 20;
  if (password.length >= 12) score += 10;
  if (password.length >= 16) score += 10;
  
  // Complejidad de caracteres
  if (/[a-z]/.test(password)) score += 10;
  if (/[A-Z]/.test(password)) score += 10;
  if (/\d/.test(password)) score += 10;
  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) score += 15;
  
  // Variedad de caracteres
  const uniqueChars = new Set(password).size;
  if (uniqueChars >= password.length * 0.7) score += 15;
  
  return Math.min(score, 100);
};

/**
 * Genera una contraseña temporal segura
 * @param length - Longitud de la contraseña (por defecto 12)
 * @returns contraseña temporal
 */
export const generateTemporaryPassword = (length: number = 12): string => {
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const numbers = '0123456789';
  const symbols = '!@#$%^&*';
  
  const allChars = lowercase + uppercase + numbers + symbols;
  
  let password = '';
  
  // Asegurar al menos un carácter de cada tipo
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += symbols[Math.floor(Math.random() * symbols.length)];
  
  // Completar con caracteres aleatorios
  for (let i = password.length; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }
  
  // Mezclar los caracteres
  return password
    .split('')
    .sort(() => Math.random() - 0.5)
    .join('');
};
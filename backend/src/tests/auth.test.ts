import { authService } from '@/services/authService';
import { hashPassword, comparePassword } from '@/utils/password';
import { generateAccessToken, verifyAccessToken } from '@/config/jwt';
import { UserRole } from '@prisma/client';
import { mockPrisma } from './setup';

// Mock de las dependencias
jest.mock('@/utils/password');
jest.mock('@/config/jwt');

const mockHashPassword = hashPassword as jest.MockedFunction<typeof hashPassword>;
const mockComparePassword = comparePassword as jest.MockedFunction<typeof comparePassword>;
const mockGenerateAccessToken = generateAccessToken as jest.MockedFunction<typeof generateAccessToken>;
const mockVerifyAccessToken = verifyAccessToken as jest.MockedFunction<typeof verifyAccessToken>;

describe('AuthService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('login', () => {
    const mockUser = {
      id: 'user-1',
      email: 'test@example.com',
      password: 'hashedPassword',
      firstName: 'Test',
      lastName: 'User',
      role: UserRole.SECRETARY,
      isActive: true,
    };

    it('debería autenticar usuario con credenciales válidas', async () => {
      // Arrange
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockComparePassword.mockResolvedValue(true);
      mockGenerateAccessToken.mockReturnValue('mock-access-token');

      // Act
      const result = await authService.login({
        email: 'test@example.com',
        password: 'password123',
      });

      // Assert
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
        select: {
          id: true,
          email: true,
          password: true,
          firstName: true,
          lastName: true,
          role: true,
          isActive: true,
        },
      });
      expect(mockComparePassword).toHaveBeenCalledWith('password123', 'hashedPassword');
      expect(result.user.email).toBe('test@example.com');
      expect(result.tokens.accessToken).toBe('mock-access-token');
    });

    it('debería fallar con usuario inexistente', async () => {
      // Arrange
      mockPrisma.user.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(
        authService.login({
          email: 'nonexistent@example.com',
          password: 'password123',
        })
      ).rejects.toThrow('Credenciales inválidas');
    });

    it('debería fallar con usuario inactivo', async () => {
      // Arrange
      mockPrisma.user.findUnique.mockResolvedValue({
        ...mockUser,
        isActive: false,
      });

      // Act & Assert
      await expect(
        authService.login({
          email: 'test@example.com',
          password: 'password123',
        })
      ).rejects.toThrow('Usuario inactivo');
    });

    it('debería fallar con contraseña incorrecta', async () => {
      // Arrange
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockComparePassword.mockResolvedValue(false);

      // Act & Assert
      await expect(
        authService.login({
          email: 'test@example.com',
          password: 'wrongpassword',
        })
      ).rejects.toThrow('Credenciales inválidas');
    });
  });

  describe('register', () => {
    const registerData = {
      email: 'new@example.com',
      password: 'Password123!',
      firstName: 'New',
      lastName: 'User',
      role: UserRole.SECRETARY,
    };

    it('debería registrar usuario con datos válidos', async () => {
      // Arrange
      mockPrisma.user.findUnique.mockResolvedValue(null); // Email no existe
      mockHashPassword.mockResolvedValue('hashedPassword');
      mockPrisma.user.create.mockResolvedValue({
        id: 'new-user-1',
        email: 'new@example.com',
        firstName: 'New',
        lastName: 'User',
        role: UserRole.SECRETARY,
        password: 'hashedPassword',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      mockGenerateAccessToken.mockReturnValue('mock-access-token');

      // Act
      const result = await authService.register(registerData);

      // Assert
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'new@example.com' },
      });
      expect(mockHashPassword).toHaveBeenCalledWith('Password123!');
      expect(mockPrisma.user.create).toHaveBeenCalledWith({
        data: {
          email: 'new@example.com',
          password: 'hashedPassword',
          firstName: 'New',
          lastName: 'User',
          role: UserRole.SECRETARY,
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
        },
      });
      expect(result.user.email).toBe('new@example.com');
    });

    it('debería fallar con email ya registrado', async () => {
      // Arrange
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'existing-user',
        email: 'new@example.com',
        password: 'hashedPassword',
        firstName: 'Existing',
        lastName: 'User',
        role: UserRole.SECRETARY,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Act & Assert
      await expect(authService.register(registerData)).rejects.toThrow(
        'El email ya está registrado'
      );
    });
  });

  describe('changePassword', () => {
    const mockUser = {
      id: 'user-1',
      email: 'test@example.com',
      password: 'currentHashedPassword',
    };

    it('debería cambiar contraseña con datos válidos', async () => {
      // Arrange
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockComparePassword
        .mockResolvedValueOnce(true) // Contraseña actual correcta
        .mockResolvedValueOnce(false); // Nueva contraseña es diferente
      mockHashPassword.mockResolvedValue('newHashedPassword');
      mockPrisma.user.update.mockResolvedValue({
        ...mockUser,
        password: 'newHashedPassword',
      });

      // Act
      await authService.changePassword({
        userId: 'user-1',
        currentPassword: 'currentPassword',
        newPassword: 'NewPassword123!',
      });

      // Assert
      expect(mockComparePassword).toHaveBeenCalledWith(
        'currentPassword',
        'currentHashedPassword'
      );
      expect(mockHashPassword).toHaveBeenCalledWith('NewPassword123!');
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { password: 'newHashedPassword' },
      });
    });

    it('debería fallar con contraseña actual incorrecta', async () => {
      // Arrange
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockComparePassword.mockResolvedValue(false);

      // Act & Assert
      await expect(
        authService.changePassword({
          userId: 'user-1',
          currentPassword: 'wrongPassword',
          newPassword: 'NewPassword123!',
        })
      ).rejects.toThrow('Contraseña actual incorrecta');
    });

    it('debería fallar si la nueva contraseña es igual a la actual', async () => {
      // Arrange
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockComparePassword
        .mockResolvedValueOnce(true) // Contraseña actual correcta
        .mockResolvedValueOnce(true); // Nueva contraseña es igual

      // Act & Assert
      await expect(
        authService.changePassword({
          userId: 'user-1',
          currentPassword: 'currentPassword',
          newPassword: 'currentPassword',
        })
      ).rejects.toThrow('La nueva contraseña debe ser diferente a la actual');
    });
  });

  describe('getProfile', () => {
    it('debería obtener perfil de usuario existente', async () => {
      // Arrange
      const mockProfile = {
        id: 'user-1',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        role: UserRole.SECRETARY,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockPrisma.user.findUnique.mockResolvedValue(mockProfile);

      // Act
      const result = await authService.getProfile('user-1');

      // Assert
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
        },
      });
      expect(result).toEqual(mockProfile);
    });

    it('debería fallar con usuario inexistente', async () => {
      // Arrange
      mockPrisma.user.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(authService.getProfile('nonexistent-user')).rejects.toThrow(
        'Usuario no encontrado'
      );
    });
  });

  describe('updateProfile', () => {
    const mockUser = {
      id: 'user-1',
      email: 'updated@example.com',
      firstName: 'Updated',
      lastName: 'User',
      role: UserRole.SECRETARY,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('debería actualizar perfil con datos válidos', async () => {
      // Arrange
      mockPrisma.user.findFirst.mockResolvedValue(null); // Email no está en uso
      mockPrisma.user.update.mockResolvedValue(mockUser);

      // Act
      const result = await authService.updateProfile('user-1', {
        firstName: 'Updated',
        lastName: 'User',
        email: 'updated@example.com',
      });

      // Assert
      expect(mockPrisma.user.findFirst).toHaveBeenCalledWith({
        where: {
          email: 'updated@example.com',
          NOT: { id: 'user-1' },
        },
      });
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: {
          firstName: 'Updated',
          lastName: 'User',
          email: 'updated@example.com',
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
        },
      });
      expect(result).toEqual(mockUser);
    });

    it('debería fallar si el email ya está en uso', async () => {
      // Arrange
      mockPrisma.user.findFirst.mockResolvedValue({
        id: 'other-user',
        email: 'updated@example.com',
        firstName: 'Other',
        lastName: 'User',
        role: UserRole.SECRETARY,
        password: 'hashedPassword',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Act & Assert
      await expect(
        authService.updateProfile('user-1', {
          email: 'updated@example.com',
        })
      ).rejects.toThrow('El email ya está en uso por otro usuario');
    });
  });
});
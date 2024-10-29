import { UserProfileService } from '../userprofile.js';
import { PrismaClient } from '@prisma/client';
import Joi from 'joi';

jest.mock('@prisma/client', () => {
  const mockPrismaClient = {
    user: {
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    profile: {
      create: jest.fn(),
      update: jest.fn(),
      deleteMany: jest.fn(),
    },
    bankAccount: {
      findMany: jest.fn(),
      deleteMany: jest.fn(),
    },
    transactions: {
      deleteMany: jest.fn(),
    },
    $transaction: jest.fn((callback) => callback(mockPrismaClient)),
  };
  return { PrismaClient: jest.fn(() => mockPrismaClient) };
});

const prisma = new PrismaClient();
const userProfileService = new UserProfileService();

describe('UserProfileService', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createUserWithProfile', () => {
    it('should create a user and profile successfully', async () => {
      const userData = { name: 'John Doe', email: 'john@example.com', password: 'password123' };
      const profileData = { identityType: 'ktp', identityNumber: '12345', addres: '123 Street' };

      const mockUser = { id: 1, ...userData };
      const mockProfile = { id: 1, userId: 1, ...profileData };

      prisma.user.create.mockResolvedValue(mockUser);
      prisma.profile.create.mockResolvedValue(mockProfile);

      const result = await userProfileService.createUserWithProfile(userData, profileData);

      expect(prisma.user.create).toHaveBeenCalledWith({
        data: userData,
      });
      expect(prisma.profile.create).toHaveBeenCalledWith({
        data: {
          userId: mockUser.id,
          ...profileData,
        },
      });
      expect(result).toEqual({ newUser: mockUser, newProfile: mockProfile });
    });

    it('should throw an error if email already exists', async () => {
      const userData = { name: 'John Doe', email: 'john@example.com', password: 'password123' };
      const profileData = { identityType: 'ktp', identityNumber: '12345', addres: '123 Street' };

      const error = new Error();
      error.code = 'P2002';
      prisma.user.create.mockRejectedValue(error);

      await expect(userProfileService.createUserWithProfile(userData, profileData))
        .rejects.toThrow('Duplicate entry. Email mungkin sudah terdaftar.');
    });
  });

  describe('updateUserWithProfile', () => {
    it('should update a user and profile successfully', async () => {
      const userId = 1;
      const userData = { name: 'Jane Doe', email: 'jane@example.com' };
      const profileData = { identityType: 'kk', identityNumber: '67890', addres: '456 Avenue' };

      const mockUpdatedUser = { id: userId, ...userData };
      const mockUpdatedProfile = { userId, ...profileData };

      prisma.user.update.mockResolvedValue(mockUpdatedUser);
      prisma.profile.update.mockResolvedValue(mockUpdatedProfile);

      const result = await userProfileService.updateUserWithProfile(userId, userData, profileData);

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: userData,
      });
      expect(prisma.profile.update).toHaveBeenCalledWith({
        where: { userId },
        data: profileData,
      });
      expect(result).toEqual({ user: mockUpdatedUser, profile: mockUpdatedProfile });
    });
  });

  describe('deleteUser', () => {
    it('should delete a user and related data successfully', async () => {
      const userId = 1;
      const mockAccounts = [{ id: 1 }, { id: 2 }];

      prisma.profile.deleteMany.mockResolvedValue();
      prisma.bankAccount.findMany.mockResolvedValue(mockAccounts);
      prisma.transactions.deleteMany.mockResolvedValue();
      prisma.bankAccount.deleteMany.mockResolvedValue();
      prisma.user.delete.mockResolvedValue();

      const result = await userProfileService.deleteUser(userId);

      expect(prisma.profile.deleteMany).toHaveBeenCalledWith({ where: { userId } });
      expect(prisma.bankAccount.findMany).toHaveBeenCalledWith({ where: { userId } });
      expect(prisma.transactions.deleteMany).toHaveBeenCalledTimes(mockAccounts.length);
      expect(prisma.bankAccount.deleteMany).toHaveBeenCalledWith({ where: { userId } });
      expect(prisma.user.delete).toHaveBeenCalledWith({ where: { id: userId } });
      expect(result).toEqual({ message: 'User and related data deleted successfully' });
    });

    it('should throw an error if deletion fails', async () => {
      const userId = 1;
      const error = new Error('Deletion failed');
      prisma.user.delete.mockRejectedValue(error);

      await expect(userProfileService.deleteUser(userId)).rejects.toThrow('Failed to delete user');
    });
  });
});

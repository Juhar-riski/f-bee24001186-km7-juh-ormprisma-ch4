import request from 'supertest';
import express from 'express';
import router from '../userprofile.js';
import { PrismaClient } from '@prisma/client';
import { UserProfileService } from '../../services/userprofile.js';
import hashPassword from '../../middleware/regis.js';
import authenticateToken from '../../middleware/auth.js';

jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    user: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
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
  })),
}));

jest.mock('../../services/userprofile.js');
jest.mock('../../middleware/auth.js', () => jest.fn((req, res, next) => next()));
jest.mock('../../middleware/regis.js', () => jest.fn((req, res, next) => next()));

const app = express();
app.use(express.json());
app.use(router);

const prisma = new PrismaClient();
const service = new UserProfileService();

describe('User Router', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /regis', () => {
    it('should create a user with profile successfully', async () => {
      service.createUserWithProfile.mockResolvedValue({
        newUser: { id: 1, name: 'John Doe', email: 'johndoe@example.com' },
        newProfile: { id: 1, identityType: 'ktp' },
      });

      const response = await request(app)
        .post('/regis')
        .send({
          userData: { name: 'John Doe', email: 'johndoe@example.com', password: 'password123' },
          profileData: { identityType: 'ktp', identityNumber: '123456', addres: '123 Main St' },
        });

      expect(response.status).toBe(201);
      expect(response.body).toEqual({
        message: 'User dan profile berhasil dibuat',
        data: {
          newUser: { id: 1, name: 'John Doe', email: 'johndoe@example.com' },
          newProfile: { id: 1, identityType: 'ktp' },
        },
      });
      expect(service.createUserWithProfile).toHaveBeenCalledWith(
        { name: 'John Doe', email: 'johndoe@example.com', password: 'password123' },
        { identityType: 'ktp', identityNumber: '123456', addres: '123 Main St' }
      );
    });

    it('should return 400 if profile data is invalid', async () => {
      const response = await request(app).post('/regis').send({
        userData: { name: 'John Doe', email: 'johndoe@example.com', password: 'password123' },
        profileData: null,
      });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ error: 'invalid profil data' });
    });
  });

  describe('GET /', () => {
    it('should fetch all users', async () => {
      prisma.user.findMany.mockResolvedValue([{ id: 1, name: 'John Doe', email: 'johndoe@example.com' }]);

      const response = await request(app).get('/');

      expect(response.status).toBe(200);
      expect(response.body).toEqual([{ id: 1, name: 'John Doe', email: 'johndoe@example.com' }]);
      expect(prisma.user.findMany).toHaveBeenCalled();
    });

    it('should return 500 on error', async () => {
      prisma.user.findMany.mockRejectedValue(new Error('Database error'));

      const response = await request(app).get('/');

      expect(response.status).toBe(500);
      expect(response.body).toEqual({ error: 'Failed to fetch users' });
    });
  });

  describe('GET /:userId', () => {
    it('should fetch user by ID with profile', async () => {
      prisma.user.findUnique.mockResolvedValue({ 
        id: 1, 
        name: 'John Doe', 
        email: 'johndoe@example.com', 
        profile: { id: 1, identityType: 'ktp' } 
      });

      const response = await request(app).get('/1');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ 
        id: 1, 
        name: 'John Doe', 
        email: 'johndoe@example.com', 
        profile: { id: 1, identityType: 'ktp' } 
      });
      expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { id: 1 }, include: { profile: true } });
    });

    it('should return 404 if user is not found', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      const response = await request(app).get('/999');

      expect(response.status).toBe(404);
      expect(response.body).toEqual({ error: 'User not found' });
    });
  });

  describe('PUT /:userId', () => {
    it('should update user and profile successfully', async () => {
      service.updateUserWithProfile.mockResolvedValue({ 
        user: { id: 1, name: 'Updated John Doe', email: 'updatedjohndoe@example.com' }, 
        profile: { id: 1, identityType: 'ktp' } 
      });

      const response = await request(app)
        .put('/1')
        .send({
          userData: { name: 'Updated John Doe', email: 'updatedjohndoe@example.com' },
          profileData: { identityType: 'ktp' },
        });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        user: { id: 1, name: 'Updated John Doe', email: 'updatedjohndoe@example.com' },
        profile: { id: 1, identityType: 'ktp' }
      });
      expect(service.updateUserWithProfile).toHaveBeenCalledWith("1", 
        { name: 'Updated John Doe', email: 'updatedjohndoe@example.com' }, 
        { identityType: 'ktp' }
      );
    });

    it('should return 500 on update error', async () => {
      service.updateUserWithProfile.mockRejectedValue(new Error('Update error'));

      const response = await request(app).put('/1').send({
        userData: { name: 'Updated John Doe', email: 'updatedjohndoe@example.com' },
        profileData: { identityType: 'ktp' },
      });

      expect(response.status).toBe(500);
      expect(response.body).toEqual({ error: 'Failed to update user and profile' });
    });
  });

  describe('DELETE /:userId', () => {
    it('should delete user successfully', async () => {
      service.deleteUser.mockResolvedValue({ message: 'User and related data deleted successfully' });

      const response = await request(app).delete('/1');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ message: 'User and related data deleted successfully' });
      expect(service.deleteUser).toHaveBeenCalledWith("1");
    });

    it('should return 500 on delete error', async () => {
      service.deleteUser.mockRejectedValue(new Error('Delete error'));

      const response = await request(app).delete('/1');

      expect(response.status).toBe(500);
      expect(response.body).toEqual({ error: 'Delete error' });
    });
  });
});

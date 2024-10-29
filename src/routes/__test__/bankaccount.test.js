import request from 'supertest';
import app from '../../index';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

// Membuat mock untuk PrismaClient
jest.mock('@prisma/client', () => {
  const mPrismaClient = {
    bankAccount: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
  };
  return { PrismaClient: jest.fn(() => mPrismaClient) };
});

const prisma = new PrismaClient();

// Mock authenticateToken middleware
const mockAuthToken = jwt.sign({ userId: 1 }, 'secret');
const authHeader = `Bearer ${mockAuthToken}`;

describe('Bank Account Routes', () => {
  afterEach(() => {
    jest.clearAllMocks(); // Membersihkan semua mock setelah setiap pengujian
  });

  describe('POST /api/v1/accounts', () => {
    it('should create a new account successfully', async () => {
      prisma.bankAccount.create.mockResolvedValue({
        id: 1,
        userId: 1,
        bankName: 'Test Bank',
        bankAccountNumber: '12345678',
        balance: 1000,
      });

      const res = await request(app)
        .post('/api/v1/accounts')
        .set('Authorization', authHeader)
        .send({
          userId: 1,
          bankName: 'Test Bank',
          bankAccountNumber: '12345678',
          balance: 1000,
        });

      expect(res.statusCode).toEqual(201);
      expect(res.body).toHaveProperty('id');
    });

    it('should return 400 if required fields are missing', async () => {
      const res = await request(app)
        .post('/api/v1/accounts')
        .set('Authorization', authHeader)
        .send({
          bankName: 'Test Bank',
          bankAccountNumber: '12345678',
        });

      expect(res.statusCode).toEqual(400);
      expect(res.body).toHaveProperty('error', 'userId, bankName, and bankAccountNumber are required.');
    });

    it('should return 500 on server error', async () => {
      prisma.bankAccount.create.mockRejectedValue(new Error('Server error'));

      const res = await request(app)
        .post('/api/v1/accounts')
        .set('Authorization', authHeader)
        .send({
          userId: 1,
          bankName: 'Test Bank',
          bankAccountNumber: '12345678',
          balance: 1000,
        });

      expect(res.statusCode).toEqual(500);
      expect(res.body).toHaveProperty('error', 'Failed to create account');
    });
  });

  describe('GET /api/v1/accounts', () => {
    it('should return all accounts successfully', async () => {
      prisma.bankAccount.findMany.mockResolvedValue([
        {
          id: 1,
          userId: 1,
          bankName: 'Test Bank',
          bankAccountNumber: '12345678',
          balance: 1000,
        },
      ]);

      const res = await request(app)
        .get('/api/v1/accounts')
        .set('Authorization', authHeader);

      expect(res.statusCode).toEqual(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('should return 500 on server error', async () => {
      prisma.bankAccount.findMany.mockRejectedValue(new Error('Server error'));

      const res = await request(app)
        .get('/api/v1/accounts')
        .set('Authorization', authHeader);

      expect(res.statusCode).toEqual(500);
      expect(res.body).toHaveProperty('error', 'Failed to fetch accounts');
    });
  });

  describe('GET /api/v1/accounts/:accountsId', () => {
    it('should return account details by ID', async () => {
      prisma.bankAccount.findUnique.mockResolvedValue({
        id: 1,
        userId: 1,
        bankName: 'Test Bank',
        bankAccountNumber: '12345678',
        balance: 1000,
        user: { id: 1, name: 'Test User' },
      });

      const res = await request(app)
        .get('/api/v1/accounts/1')
        .set('Authorization', authHeader);

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('id', 1);
      expect(res.body.user).toHaveProperty('name', 'Test User');
    });

    it('should return 404 if account is not found', async () => {
      prisma.bankAccount.findUnique.mockResolvedValue(null);

      const res = await request(app)
        .get('/api/v1/accounts/999')
        .set('Authorization', authHeader);

      expect(res.statusCode).toEqual(404);
      expect(res.body).toHaveProperty('error', 'Account not found');
    });

    it('should return 500 on server error', async () => {
      prisma.bankAccount.findUnique.mockRejectedValue(new Error('Server error'));

      const res = await request(app)
        .get('/api/v1/accounts/1')
        .set('Authorization', authHeader);

      expect(res.statusCode).toEqual(500);
      expect(res.body).toHaveProperty('error', 'Failed to fetch account details');
    });
  });
});

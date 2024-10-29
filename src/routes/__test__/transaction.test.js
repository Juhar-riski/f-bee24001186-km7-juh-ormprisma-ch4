// __tests__/transactionRoutes.test.js
import request from 'supertest';
import express from 'express';
import { PrismaClient } from '@prisma/client';
import transactionRouter from '../../routes/transaction.js';
import authenticateToken from '../../middleware/auth.js';
import jwt from 'jsonwebtoken'; // Import jwt untuk menghasilkan token

const app = express();
const prisma = new PrismaClient();
app.use(express.json());
app.use(authenticateToken); // middleware authentication
app.use('/transactions', transactionRouter);

// Mocking Prisma Client
jest.mock('@prisma/client', () => {
  const mPrismaClient = {
    bankAccount: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    transactions: {
      findMany: jest.fn(),
      create: jest.fn(),
      findUnique: jest.fn(),
    },
    $transaction: jest.fn(),
  };
  return { PrismaClient: jest.fn(() => mPrismaClient) };
});

describe('Transaction Routes', () => {
  const mockTransaction = { id: 1, amount: 100, sourceAccountId: 1, destinationAccountId: 2 };
  const mockAccount = { id: 1, balance: 200 };
  const mockAccountDest = { id: 2, balance: 100 };
  const secretKey = 'your-secret-key'; // Ganti dengan secret key Anda

  // Generate a valid token
  const generateToken = (userId) => {
    return jwt.sign({ id: userId }, secretKey, { expiresIn: '1h' });
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('POST /transactions - should create a transaction', async () => {
    const token = generateToken(1); // Menghasilkan token untuk user ID 1

    prisma.bankAccount.findUnique.mockResolvedValueOnce(mockAccount);
    prisma.bankAccount.findUnique.mockResolvedValueOnce(mockAccountDest);
    prisma.$transaction.mockImplementation(async (callback) => {
      await callback(prisma);
      return mockTransaction;
    });

    const response = await request(app)
      .post('/transactions')
      .set('Authorization', `Bearer ${token}`) // Mengatur header Authorization
      .send({
        sourceAccountId: 1,
        destinationAccountId: 2,
        amount: 100,
      });

    expect(response.status).toBe(201);
    expect(response.body).toEqual(mockTransaction);
  });

  it('POST /transactions - should return 400 if account IDs or amount are missing', async () => {
    const token = generateToken(1); // Menghasilkan token untuk user ID 1

    const response = await request(app)
      .post('/transactions')
      .set('Authorization', `Bearer ${token}`) // Mengatur header Authorization
      .send({});

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('sourceAccountId, destinationAccountId, and amount are required');
  });

  it('POST /transactions - should return 400 if amount is not greater than zero', async () => {
    const token = generateToken(1); // Menghasilkan token untuk user ID 1

    const response = await request(app)
      .post('/transactions')
      .set('Authorization', `Bearer ${token}`) // Mengatur header Authorization
      .send({
        sourceAccountId: 1,
        destinationAccountId: 2,
        amount: 0,
      });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Amount must be greater than zero');
  });

  it('GET /transactions - should return all transactions', async () => {
    const token = generateToken(1); // Menghasilkan token untuk user ID 1

    prisma.transactions.findMany.mockResolvedValueOnce([mockTransaction]);

    const response = await request(app)
      .get('/transactions')
      .set('Authorization', `Bearer ${token}`) // Mengatur header Authorization
      .send();

    expect(response.status).toBe(200);
    expect(response.body).toEqual([mockTransaction]);
  });

  it('GET /transactions/:transactionId - should return transaction details', async () => {
    const token = generateToken(1); // Menghasilkan token untuk user ID 1

    prisma.transactions.findUnique.mockResolvedValueOnce(mockTransaction);

    const response = await request(app)
      .get('/transactions/1')
      .set('Authorization', `Bearer ${token}`) // Mengatur header Authorization
      .send();

    expect(response.status).toBe(200);
    expect(response.body).toEqual(mockTransaction);
  });

  it('GET /transactions/:transactionId - should return 404 if transaction not found', async () => {
    const token = generateToken(1); // Menghasilkan token untuk user ID 1

    prisma.transactions.findUnique.mockResolvedValueOnce(null);

    const response = await request(app)
      .get('/transactions/999')
      .set('Authorization', `Bearer ${token}`) // Mengatur header Authorization
      .send();

    expect(response.status).toBe(404);
    expect(response.body.error).toBe('Transaction not found');
  });
});

import request from 'supertest';
import express from 'express';
import jwt from 'jsonwebtoken';
import loginRoute from '../login.js';

jest.mock('@prisma/client', () => {
  const mPrismaClient = {
    user: {
      findUnique: jest.fn(),
    },
  };
  return { PrismaClient: jest.fn(() => mPrismaClient) };
});

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const app = express();
app.use(express.json());
app.use('/api/v1/login', loginRoute);

describe('Login Route', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return a token for valid login credentials', async () => {
    const mockUser = { id: 1, email: 'test@example.com', password: 'password123' };
    prisma.user.findUnique.mockResolvedValue(mockUser);

    const res = await request(app)
      .post('/api/v1/login')
      .send({ email: 'test@example.com', password: 'password123' });

    expect(res.body).toHaveProperty('token');
    expect(jwt.verify(res.body.token, 'secret')).toHaveProperty('userId', mockUser.id);
    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { email: 'test@example.com', password: 'password123' },
    });
  });

  it('should return 404 if email or password is invalid', async () => {
    prisma.user.findUnique.mockResolvedValue(null);

    const res = await request(app)
      .post('/api/v1/login')
      .send({ email: 'wrong@example.com', password: 'wrongpassword' });

    expect(res.statusCode).toEqual(404);
    expect(res.body).toHaveProperty('error', 'Invalid email');
    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { email: 'wrong@example.com', password: 'wrongpassword' },
    });
  });

  it('should return 500 if there is a server error', async () => {
    prisma.user.findUnique.mockRejectedValue(new Error('Database connection error'));

    const res = await request(app)
      .post('/api/v1/login')
      .send({ email: 'test@example.com', password: 'password123' });

    expect(res.statusCode).toEqual(500);
    expect(res.body).toHaveProperty('error', 'Database connection error');
  });
});

import { TransactionService } from '../transaction';
import { PrismaClient } from '@prisma/client';

jest.mock('@prisma/client', () => {
    const mockPrismaClient = {
      transactions: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
      },
    };
    return { PrismaClient: jest.fn(() => mockPrismaClient) };
  });

const prisma = new PrismaClient();

describe('TransactionService', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllTransactions', () => {
    it('should return all transactions ordered by id in descending order', async () => {
      const mockTransactions = [
        { id: 2, amount: 200 },
        { id: 1, amount: 100 },
      ];
      prisma.transactions.findMany.mockResolvedValue(mockTransactions);

      const transactions = await TransactionService.getAllTransactions();

      expect(prisma.transactions.findMany).toHaveBeenCalledWith({
        orderBy: { id: 'desc' },
      });
      expect(transactions).toEqual(mockTransactions);
    });
  });

  describe('getTransactionDetail', () => {
    it('should return transaction details with source and destination accounts', async () => {
      const transactionId = 1;
      const mockTransaction = {
        id: transactionId,
        amount: 100,
        sourceAccountId: {
          id: 1,
          balance: 500,
          user: { name: 'Source User', email: 'source@example.com' },
        },
        destinationAccountId: {
          id: 2,
          balance: 300,
          user: { name: 'Destination User', email: 'destination@example.com' },
        },
      };
      prisma.transactions.findUnique.mockResolvedValue(mockTransaction);

      const transaction = await TransactionService.getTransactionDetail(transactionId);

      expect(prisma.transactions.findUnique).toHaveBeenCalledWith({
        where: { id: transactionId },
        include: {
          sourceId: {
            select: {
              id: true,
              balance: true,
              user: {
                select: { name: true, email: true },
              },
            },
          },
          destinationId: {
            select: {
              id: true,
              balance: true,
              user: {
                select: { name: true, email: true },
              },
            },
          },
        },
      });
      expect(transaction).toEqual({
        id: transactionId,
        amount: mockTransaction.amount,
        sourceAccount: mockTransaction.sourceAccountId,
        destinationAccount: mockTransaction.destinationAccountId,
      });
    });

    it('should return null if transaction does not exist', async () => {
      const transactionId = 999;
      prisma.transactions.findUnique.mockResolvedValue(null);

      const transaction = await TransactionService.getTransactionDetail(transactionId);

      expect(prisma.transactions.findUnique).toHaveBeenCalledWith({
        where: { id: transactionId },
        include: {
          sourceId: {
            select: {
              id: true,
              balance: true,
              user: {
                select: { name: true, email: true },
              },
            },
          },
          destinationId: {
            select: {
              id: true,
              balance: true,
              user: {
                select: { name: true, email: true },
              },
            },
          },
        },
      });
      expect(transaction).toBeNull();
    });
  });
});

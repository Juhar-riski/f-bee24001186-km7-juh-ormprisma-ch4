import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

class TransactionService {
  // Methode untuk mendapatkan semua transaksi
  static async getAllTransactions() {
    return await prisma.transactions.findMany({
      orderBy: {
        id: 'desc',
      },
    });
  }
  static async getTransactionDetail(transactionId) {
    // menampilkan transaksi id dengan asal akun dan tujuan akun
    const transaction = await prisma.transactions.findUnique({
      where: { id: Number(transactionId) },
      include: {
        sourceId: {
          select: {
            id: true,
            balance: true,
            user: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
        destinationId: { 
          select: {
            id: true,
            balance: true,
            user: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });
  
    if (!transaction) {
      return null;
    }
  
    return {
      id: transaction.id,
      amount: transaction.amount,
      sourceAccount: {
        id: transaction.sourceAccountId.id, 
        balance: transaction.sourceAccountId.balance,
        user: transaction.sourceAccountId.user,
      },
      destinationAccount: {
        id: transaction.destinationAccountId.id, 
        balance: transaction.destinationAccountId.balance,
        user: transaction.destinationAccountId.user,
      },
    };
    }
  
}

export { TransactionService };
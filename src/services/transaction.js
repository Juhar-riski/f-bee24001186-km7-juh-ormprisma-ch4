const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class TransactionService {
  // Method untuk mendapatkan semua transaksi
  static async getAllTransactions() {
    return await prisma.transactions.findMany({
      orderBy: {
        id: 'desc',
      },
    });
  }
//   static async getTransactionDetail(transactionId) {
//     // Cari transaksi berdasarkan ID dan sertakan informasi akun pengirim dan penerima
//     const transaction = await prisma.transactions.findUnique({
//       where: { id: Number(transactionId) },
//       include: {
//         sourceId: {
//           select: {
//             id: true,
//             balance: true,
//             user: {
//               select: {
//                 name: true,
//                 email: true,
//               },
//             },
//           },
//         },
//         destinationId: {
//           select: {
//             id: true,
//             balance: true,
//             user: {
//               select: {
//                 name: true,
//                 email: true,
//               },
//             },
//           },
//         },
//       },
//     });

//     if (!transaction) {
//       return null;
//     }

//     return {
//       id: transaction.id,
//       amount: transaction.amount,
//       sourceAccount: {
//         id: transaction.sourceAccountId.id,
//         balance: transaction.sourceAccountId.balance,
//         user: transaction.sourceAccountId.user,
//       },
//       destinationAccount: {
//         id: transaction.destinationAccountId.id,
//         balance: transaction.destinationAccountId.balance,
//         user: transaction.destinationAccountId.user,
//       },
//     };
  
  static async getTransactionDetail(transactionId) {
    // Cari transaksi berdasarkan ID dan sertakan informasi akun pengirim dan penerima
    const transaction = await prisma.transactions.findUnique({
      where: { id: Number(transactionId) },
      include: {
        sourceId: { // Pastikan nama ini sesuai dengan definisi model Prisma
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
        destinationId: { // Pastikan nama ini sesuai dengan definisi model Prisma
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
        id: transaction.sourceAccountId.id, // Akses langsung dari sourceAccount
        balance: transaction.sourceAccountId.balance,
        user: transaction.sourceAccountId.user,
      },
      destinationAccount: {
        id: transaction.destinationAccountId.id, // Akses langsung dari destinationAccount
        balance: transaction.destinationAccountId.balance,
        user: transaction.destinationAccountId.user,
      },
    };
    }
  
}

exports.TransactionService = TransactionService;

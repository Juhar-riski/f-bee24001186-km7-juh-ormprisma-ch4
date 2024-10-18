const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { TransactionService } = require('../services/transaction');


const router = express.Router();
const prisma = new PrismaClient();

// Route POST untuk mengirimkan uang dari satu akun ke akun lain
router.post('/', async (req, res) => {
  const { sourceAccountId, destinationAccountId, amount } = req.body;

  try {
    // Validasi input
    if (!sourceAccountId || !destinationAccountId || !amount) {
      return res.status(400).json({ error: 'sourceAccountId, destinationAccountId, and amount are required' });
    }

    if (amount <= 0) {
      return res.status(400).json({ error: 'Amount must be greater than zero' });
    }

    // Ambil akun sumber
    const sourceAccount = await prisma.bankAccount.findUnique({
      where: { id: sourceAccountId },
    });

    // Ambil akun tujuan
    const destinationAccount = await prisma.bankAccount.findUnique({
      where: { id: destinationAccountId },
    });

    // Cek apakah akun sumber dan tujuan ada
    if (!sourceAccount || !destinationAccount) {
      return res.status(404).json({ error: 'Source or destination account not found' });
    }

    // Cek saldo akun sumber
    if (sourceAccount.balance < amount) {
      return res.status(400).json({ error: 'Insufficient funds' });
    }

    // Lakukan transaksi
    const transaction = await prisma.$transaction(async (prisma) => {
      // Kurangi saldo dari akun sumber
      await prisma.bankAccount.update({
        where: { id: sourceAccountId },
        data: { balance: sourceAccount.balance - amount },
      });

      // Tambah saldo ke akun tujuan
      await prisma.bankAccount.update({
        where: { id: destinationAccountId },
        data: { balance: destinationAccount.balance + amount },
      });

      // Simpan transaksi
      return await prisma.transactions.create({
        data: {
          sourceAccountId,
          destinationAccountId,
          amount,
        },
      });
    });

    res.status(201).json(transaction);
  } catch (error) {
    console.error('Error processing transaction:', error);
    res.status(500).json({ error: 'Failed to process transaction' });
  }
});

router.get('/', async (req, res) => {
  try {
    const transactions = await TransactionService.getAllTransactions();
    res.status(200).json(transactions);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/:transactionId', async (req, res) => {
  const { transactionId } = req.params;
  
  try {
    const transaction = await TransactionService.getTransactionDetail(transactionId);
    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }
    res.json(transaction);
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;

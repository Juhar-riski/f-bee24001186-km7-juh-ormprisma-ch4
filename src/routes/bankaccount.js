const express = require('express');
const { PrismaClient } = require('@prisma/client');

const router = express.Router();
const prisma = new PrismaClient();

// Route POST untuk menambahkan akun baru
router.post('/', async (req, res) => {
  const { userId, bankName, bankAccountNumber, balance } = req.body;

  try {
    // Validasi input
    if (!userId || !bankName || !bankAccountNumber) {
      return res.status(400).json({ error: 'userId, bankName, and bankAccountNumber are required.' });
    }

    // Menambahkan akun baru
    const newAccount = await prisma.BankAccount.create({
      data: {
        userId: parseInt(userId),
        bankName,
        bankAccountNumber,
        balance: parseInt(balance) || 0 // Default to 0 if balance is not provided
      }
    });

    res.status(201).json(newAccount);
  } catch (error) {
    console.error('Error creating account:', error);
    res.status(500).json({ error: 'Failed to create account' });
  }
});

router.get('/', async (req, res) => {
  try {
    const accounts = await prisma.bankAccount.findMany(); // Ambil semua akun
    res.status(200).json(accounts); // Kirimkan daftar akun sebagai respons
  } catch (error) {
    console.error('Error fetching accounts:', error);
    res.status(500).json({ error: 'Failed to fetch accounts' });
  }
});

router.get('/:accountsId', async (req, res) => {
  const { accountsId } = req.params; // Mengambil accountId dari parameter URL

  try {
    // Mencari akun berdasarkan accountId
    const account = await prisma.bankAccount.findUnique({
      where: { id: parseInt(accountsId) }, // Pastikan untuk mengkonversi accountId ke integer
      include: { user: true },
    });

    if (!account) {
      return res.status(404).json({ error: 'Account not found' });
    }

    res.json(account); // Mengirimkan detail akun sebagai respons
  } catch (error) {
    console.error('Error fetching account details:', error);
    res.status(500).json({ error: 'Failed to fetch account details' });
  }
});

module.exports = router;

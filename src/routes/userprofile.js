const router = require('express').Router();
const { Prisma, PrismaClient } = require('@prisma/client');
const { UserProfileService } = require('../services/userprofile');
const { Router } = require('express');

const prisma = new PrismaClient();
const service = new UserProfileService();

router.post('/', async (req, res, next) => {
    console.log('Request body', req.body);
    const { userData, profileData } = req.body;
    
    if (!profileData || !profileData.identityType){
      return res.status(400).json({
        error: 'invalid profil data'
      });
    }
    
    try {
      const result = await service.createUserWithProfile(userData, profileData);
      return res.status(201).json({ message: 'User dan profile berhasil dibuat', data: result });
    } catch (error) {
      if (!res.headersSent){
      next(error); // Kirim error ke middleware error
      }
    }
  });

router.get('/', async (req, res) => {
  try {
    const users = await prisma.user.findMany();
    res.json(users);
  }catch(error) {
    console.error('Error fetching users:', error);
  res.status(500).json({ error: 'Failed to fetch users' });
  }
});

router.get('/:userId', async (req, res) => {
  const { userId } = req.params;

  try {
    const user = await prisma.user.findUnique({
      where: { id: parseInt(userId) },
      include: { profile: true }, 
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

router.put('/:userId', async (req, res) => {
  const { userId } = req.params;
  const { userData, profileData } = req.body;

  try {
    const updatedUser = await UserProfileService.updateUserWithProfile(userId, userData, profileData);
    res.status(200).json(updatedUser);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update user and profile' });
  }
});

router.delete('/:userId', async (req, res) => {
  const { userId } = req.params;

  try {
    const result = await UserProfileService.deleteUser(userId);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


module.exports = router;
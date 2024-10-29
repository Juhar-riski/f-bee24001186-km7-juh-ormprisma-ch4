import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { UserProfileService } from '../services/userprofile.js';
import authenticateToken from '../middleware/auth.js';
import jwt from 'jsonwebtoken';
import hashPassword from '../middleware/regis.js'

const router = Router();

const prisma = new PrismaClient();
const service = new UserProfileService();

router.post('/register',hashPassword, async (req, res, next) => {
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
    if (!res.headersSent) {
      next(error);
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



router.get('/:userId',authenticateToken, async (req, res) => {
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

router.put('/:userId',authenticateToken, async (req, res) => {
  const { userId } = req.params;
  const { userData, profileData } = req.body;

  try {
    const updatedUser = await service.updateUserWithProfile(userId, userData, profileData);
    res.status(200).json(updatedUser);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update user and profile' });
  }
});

router.delete('/:userId',authenticateToken, async (req, res) => {
  const { userId } = req.params;

  try {
    const result = await service.deleteUser(userId);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ error: 'Delete error' });
  }
});


export default router;

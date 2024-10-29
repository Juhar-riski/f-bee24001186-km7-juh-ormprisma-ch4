import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
import Joi from 'joi';


class UserProfileService {
  // Schema validasi dengan Joi
  userSchema = Joi.object({
    name: Joi.string().min(2).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(8).required(),
  });

  profileSchema = Joi.object({
    identityType: Joi.string().valid('ktp', 'kk').required(),
    identityNumber: Joi.string().min(5).required(),
    addres: Joi.string().required(),
  });
  async createUserWithProfile(userData, profileData) {
    // Validasi userData dan profileData
    if (!profileData || typeof profileData.identityType === 'undefined') {
      throw new Error('Profile data is missing or incomplete.');
    }
  
    const userValidation = this.userSchema.validate(userData);
    const profileValidation = this.profileSchema.validate(profileData, { abortEarly: false});
  
    if (userValidation.error) {
      throw new Error(`User validation error: ${userValidation.error.details[0].message}`);
    }
  
    if (profileValidation.error) {
      throw new Error(`Profile validation error: ${profileValidation.error.details.map(detail => detail.message).join(', ')}`);
    }
    try {
      const user = await prisma.$transaction(async (prisma) => {
        const newUser = await prisma.user.create({
          data: {
            name: userData.name,
            email: userData.email,
            password: userData.password,
          },
        });

        const newProfile = await prisma.profile.create({
          data: {
            userId: newUser.id,
            identityType: profileData.identityType,
            identityNumber: profileData.identityNumber,
            addres: profileData.addres,
            
          },
        });

        return { newUser, newProfile };
      });

      return user;
    } catch (error) {
      if (error.code === 'P2002') {
        throw new Error('Duplicate entry. Email mungkin sudah terdaftar.');
      }
      throw error;
    }
  }

  async updateUserWithProfile(userId, userData, profileData) {
    try {
      const updatedUser = await prisma.$transaction(async (prisma) => {
        // Update user berdasarkan ID
        const user = await prisma.user.update({
          where: { id: Number(userId) },
          data: userData,
        });

        // Update profile berdasarkan ID user 
        const profile = await prisma.profile.update({
          where: { userId: Number(userId) },
          data: profileData,
        });

        return { user, profile };
      });

      return updatedUser;
    } catch (error) {
      console.error(error);
      throw new Error('Error updating user and profile');
    }
  }

  async deleteUser(userId) {
    try {
      await prisma.$transaction(async (prisma) => {
        // Hapus profil user terkait
        await prisma.profile.deleteMany({
          where: { userId: Number(userId) },
        });

        // Dapatkan semua account yang terkait dengan user
        const accounts = await prisma.bankAccount.findMany({
          where: { userId: Number(userId) },
        });

        // Hapus semua transaksi yang terkait dengan accounts user
        for (const account of accounts) {
          await prisma.transactions.deleteMany({
            where: {
              OR: [
                { sourceAccountId: account.id },
                { destinationAccountId: account.id },
              ],
            },
          });
        }

        // Hapus semua account yang terkait dengan user
        await prisma.bankAccount.deleteMany({
          where: { userId: Number(userId) },
        });

        // Hapus user itu sendiri
        await prisma.user.delete({
          where: { id: Number(userId) },
        });
      });

      return { message: 'User and related data deleted successfully' };
    } catch (error) {
      // console.error('Error deleting user:', error);
      throw new Error('Failed to delete user');
    }
  }

}
export { UserProfileService };
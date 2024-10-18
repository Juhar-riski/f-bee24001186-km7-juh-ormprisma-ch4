const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const Joi = require('joi');

class UserProfileService {
  // Skema validasi dengan Joi
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
}

exports.UserProfileService = UserProfileService;
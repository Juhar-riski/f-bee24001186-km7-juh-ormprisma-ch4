import bcrypt from 'bcrypt'

const hashPassword = async (req, res, next) => {
    const { userData } = req.body;
    try {
        if (userData && userData.password) {
            const salt = 10;
            userData.password = await bcrypt.hash(userData.password, salt);
        }
        next();
    } catch (error) {
        res.status(500).json({ error: 'Gagal hash password'})
    }
};

export default hashPassword;
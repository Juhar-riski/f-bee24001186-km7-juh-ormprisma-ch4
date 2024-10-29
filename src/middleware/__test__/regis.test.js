import hashPassword from '../regis.js';
import bcrypt from 'bcrypt';

jest.mock('bcrypt');

describe('hashPassword Middleware', () => {
    let req, res, next;

    beforeEach(() => {
        req = {
            body: {
                userData: {
                    password: 'plainPassword'
                }
            }
        };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
        next = jest.fn();
    });

    it('should hash the password and call next()', async () => {
        bcrypt.hash.mockResolvedValue('hashedPassword');

        await hashPassword(req, res, next);

        expect(bcrypt.hash).toHaveBeenCalledWith('plainPassword', 10);
        expect(req.body.userData.password).toBe('hashedPassword');
        expect(next).toHaveBeenCalled();
    });

    it('should handle errors and return a 500 status', async () => {
        bcrypt.hash.mockRejectedValue(new Error('Hashing failed'));

        await hashPassword(req, res, next);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ error: 'Gagal hash password' });
        expect(next).not.toHaveBeenCalled();
    });

    it('should not hash password if userData is not present', async () => {
        req.body.userData = {};

        await hashPassword(req, res, next);

        expect(bcrypt.hash).not.toHaveBeenCalled();
        expect(next).toHaveBeenCalled();
    });
});

import jwt from 'jsonwebtoken';
import authenticateToken from '../auth.js';

describe('authenticateToken Middleware', () => {
  const mockReq = {};
  const mockRes = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
  };
  const mockNext = jest.fn();

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('should call next if token is valid', () => {
    const user = { id: 1, name: 'Test User' };
    const token = jwt.sign(user, 'secret');
    mockReq.headers = { authorization: `Bearer ${token}` };

    authenticateToken(mockReq, mockRes, mockNext);

    expect(mockNext).toHaveBeenCalled();
    expect(mockReq.user).toEqual(expect.objectContaining(user));
  });

  test('should return 401 if no token is provided', () => {
    mockReq.headers = {};

    authenticateToken(mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith({
      error: 'Access denied. No token provided.',
    });
    expect(mockNext).not.toHaveBeenCalled();
  });

  test('should return 403 if token is invalid', () => {
    mockReq.headers = { authorization: 'Bearer invalidtoken' };

    authenticateToken(mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(403);
    expect(mockRes.json).toHaveBeenCalledWith({
      error: 'Invalid token.',
    });
    expect(mockNext).not.toHaveBeenCalled();
  });
});

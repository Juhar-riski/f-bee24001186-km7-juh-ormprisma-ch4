import jwt from 'jsonwebtoken';

const authenticateToken = (req, res, next) => {
  // Mendapatkan token dari header Authorization
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  // Verifikasi token JWT
  jwt.verify(token, 'secret', (err, decoded) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token.' });
    }

    // Menyimpan data user dari token ke req.user
    req.user = decoded;
    next();
  });
};

export default authenticateToken;

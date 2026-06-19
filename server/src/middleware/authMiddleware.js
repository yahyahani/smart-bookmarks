const jwt = require('jsonwebtoken');

// Deze middleware checkt of een geldig JWT-token is meegestuurd
// in de Authorization header, in het formaat: "Bearer <token>"
function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Geen token meegestuurd' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId; // beschikbaar maken voor de volgende functie in de chain
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token is ongeldig of verlopen' });
  }
}

module.exports = requireAuth;

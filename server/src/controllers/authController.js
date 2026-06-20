const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { createUser, findUserByEmail } = require('../models/userModel');
const { isValidEmail, isValidPassword } = require('../utils/validation');

const SALT_ROUNDS = 10;

// POST /api/auth/register
async function register(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'E-mail en wachtwoord zijn verplicht' });
    }
    if (!isValidEmail(email)) {
      return res.status(400).json({ error: 'Vul een geldig e-mailadres in' });
    }
    if (!isValidPassword(password)) {
      return res.status(400).json({ error: 'Wachtwoord moet tussen 6 en 200 tekens zijn' });
    }

    // Check of de gebruiker al bestaat (genormaliseerd naar lowercase,
    // zodat "Test@Mail.com" en "test@mail.com" als dezelfde gebruiker tellen)
    const normalizedEmail = email.trim().toLowerCase();
    const existingUser = await findUserByEmail(normalizedEmail);
    if (existingUser) {
      return res.status(409).json({ error: 'Er bestaat al een account met dit e-mailadres' });
    }

    // Wachtwoord versleutelen en gebruiker aanmaken
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const newUser = await createUser(normalizedEmail, passwordHash);

    // Direct een token geven zodat de gebruiker meteen ingelogd is
    const token = jwt.sign(
      { userId: newUser.id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    res.status(201).json({
      message: 'Account aangemaakt',
      token,
      user: { id: newUser.id, email: newUser.email },
    });
  } catch (err) {
    console.error('Fout bij registratie:', err);
    res.status(500).json({ error: 'Er ging iets mis bij het registreren' });
  }
}

// POST /api/auth/login
async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'E-mail en wachtwoord zijn verplicht' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await findUserByEmail(normalizedEmail);
    if (!user) {
      // Bewust dezelfde foutmelding als bij verkeerd wachtwoord,
      // zodat een aanvaller niet kan raden welke e-mails bestaan.
      return res.status(401).json({ error: 'Ongeldige inloggegevens' });
    }

    const passwordMatches = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatches) {
      return res.status(401).json({ error: 'Ongeldige inloggegevens' });
    }

    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    res.json({
      message: 'Ingelogd',
      token,
      user: { id: user.id, email: user.email },
    });
  } catch (err) {
    console.error('Fout bij login:', err);
    res.status(500).json({ error: 'Er ging iets mis bij het inloggen' });
  }
}

module.exports = { register, login };

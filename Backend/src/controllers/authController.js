const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const pool = require('../config/db');
const generateToken = require('../utils/generateToken');

// ─── REGISTER ─────────────────────────────────────────────
const register = async (req, res) => {
  const { email, password, role } = req.body;

  try {
    // 1. Check all fields are provided
    if (!email || !password || !role) {
      return res.status(400).json({ error: 'Email, password and role are required' });
    }

    // 2. Role must be valid
    if (!['candidate', 'company'].includes(role)) {
      return res.status(400).json({ error: 'Role must be candidate or company' });
    }

    // 3. Check if email already exists
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // 4. Hash the password
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    // 5. Generate UUID for new user
    const id = uuidv4();

    // 6. Insert user into database
    const newUser = await pool.query(
      `INSERT INTO users (id, email, password_hash, role)
       VALUES ($1, $2, $3, $4)
       RETURNING id, email, role, created_at`,
      [id, email, password_hash, role]
    );

    const user = newUser.rows[0];

    // 7. Generate JWT token
    const token = generateToken(user.id, user.role);

    // 8. Send response
    res.status(201).json({
      message: 'Registration successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        created_at: user.created_at
      }
    });

  } catch (error) {
    console.error('Register error:', error.message);
    res.status(500).json({ error: 'Server error' });
  }
};

// ─── LOGIN ────────────────────────────────────────────────
const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    // 1. Check all fields are provided
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // 2. Find user by email
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );
    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    const user = result.rows[0];

    // 3. Compare password with hash
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    // 4. Generate JWT token
    const token = generateToken(user.id, user.role);

    // 5. Send response
    res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        created_at: user.created_at
      }
    });

  } catch (error) {
    console.error('Login error:', error.message);
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = { register, login };
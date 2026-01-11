import { pool } from '../config/database';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = '7d';

export interface User {
  id: string;
  email: string;
  full_name?: string;
  created_at: Date;
  last_login?: Date;
  is_active: boolean;
}

export interface UserSettings {
  theme: string;
  currency: string;
  date_format: string;
  notifications_enabled: boolean;
}

export class UserService {
  /**
   * Register a new user
   */
  async register(email: string, password: string, fullName?: string): Promise<{
    user: User;
    token: string;
  }> {
    // Check if user already exists
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    if (existingUser.rows.length > 0) {
      throw new Error('User with this email already exists');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const result = await pool.query(
      `INSERT INTO users (email, password_hash, full_name)
       VALUES ($1, $2, $3)
       RETURNING id, email, full_name, created_at, is_active`,
      [email.toLowerCase(), passwordHash, fullName]
    );

    const user = result.rows[0];

    // Create default settings
    await pool.query(
      `INSERT INTO user_settings (user_id)
       VALUES ($1)`,
      [user.id]
    );

    // Generate JWT
    const token = jwt.sign(
      { id: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    return { user, token };
  }

  /**
   * Login user
   */
  async login(email: string, password: string): Promise<{
    user: User;
    token: string;
  }> {
    // Get user
    const result = await pool.query(
      `SELECT id, email, password_hash, full_name, created_at, is_active
       FROM users
       WHERE email = $1`,
      [email.toLowerCase()]
    );

    if (result.rows.length === 0) {
      throw new Error('Invalid email or password');
    }

    const user = result.rows[0];

    if (!user.is_active) {
      throw new Error('Account is disabled');
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);

    if (!isValidPassword) {
      throw new Error('Invalid email or password');
    }

    // Update last login
    await pool.query(
      'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
      [user.id]
    );

    // Remove password_hash from response
    delete user.password_hash;

    // Generate JWT
    const token = jwt.sign(
      { id: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    return { user, token };
  }

  /**
   * Get user by ID
   */
  async getUserById(userId: string): Promise<User | null> {
    const result = await pool.query(
      `SELECT id, email, full_name, created_at, last_login, is_active
       FROM users
       WHERE id = $1`,
      [userId]
    );

    return result.rows[0] || null;
  }

  /**
   * Get user settings
   */
  async getUserSettings(userId: string): Promise<UserSettings> {
    const result = await pool.query(
      `SELECT theme, currency, date_format, notifications_enabled
       FROM user_settings
       WHERE user_id = $1`,
      [userId]
    );

    return result.rows[0] || {
      theme: 'light',
      currency: 'USD',
      date_format: 'YYYY-MM-DD',
      notifications_enabled: true,
    };
  }

  /**
   * Update user settings
   */
  async updateUserSettings(
    userId: string,
    settings: Partial<UserSettings>
  ): Promise<UserSettings> {
    const fields = [];
    const values = [];
    let paramCount = 1;

    for (const [key, value] of Object.entries(settings)) {
      fields.push(`${key} = $${paramCount}`);
      values.push(value);
      paramCount++;
    }

    values.push(userId);

    const query = `
      UPDATE user_settings
      SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE user_id = $${paramCount}
      RETURNING theme, currency, date_format, notifications_enabled
    `;

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  /**
   * Update user profile
   */
  async updateProfile(
    userId: string,
    updates: { full_name?: string }
  ): Promise<User> {
    const result = await pool.query(
      `UPDATE users
       SET full_name = COALESCE($1, full_name), updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING id, email, full_name, created_at, last_login, is_active`,
      [updates.full_name, userId]
    );

    return result.rows[0];
  }
}

export const userService = new UserService();

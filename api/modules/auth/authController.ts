import { Request, Response } from 'express';
import { AuthService } from './authService.js';
import { IRegisterData, ILoginCredentials } from '../../shared/interfaces/IUser.js';
import { 
  PASSWORD_CONFIG, 
  USER_ROLES, 
  COOKIE_CONFIG, 
  ERROR_MESSAGES, 
  SUCCESS_MESSAGES 
} from '../../config/constants.js';

export class AuthController {
  
  /**
   * Register a new user
   * POST /api/auth/register
   */
  static async register(req: Request, res: Response): Promise<void> {
    try {
      const { email, password, role }: IRegisterData = req.body;

      // Validation
      if (!email || !password) {
        res.status(400).json({
          success: false,
          message: ERROR_MESSAGES.VALIDATION.REQUIRED_FIELD('Email and password')
        });
        return;
      }

      // Basic email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        res.status(400).json({
          success: false,
          message: 'Please provide a valid email address'
        });
        return;
      }

      if (password.length < PASSWORD_CONFIG.MIN_LENGTH) {
        res.status(400).json({
          success: false,
          message: ERROR_MESSAGES.VALIDATION.MIN_LENGTH('Password', PASSWORD_CONFIG.MIN_LENGTH)
        });
        return;
      }

      if (role && ![USER_ROLES.ADMIN, USER_ROLES.FACULTY, USER_ROLES.STAFF].includes(role)) {
        res.status(400).json({
          success: false,
          message: ERROR_MESSAGES.VALIDATION.INVALID_ROLE
        });
        return;
      }

      // Register user
      const result = await AuthService.register({ email, password, role });

      // Set refresh token cookie
      if (result.refreshToken) {
        res.cookie(COOKIE_CONFIG.REFRESH_TOKEN_NAME, result.refreshToken, {
          httpOnly: COOKIE_CONFIG.HTTP_ONLY,
          secure: COOKIE_CONFIG.SECURE,
          sameSite: COOKIE_CONFIG.SAME_SITE,
          maxAge: COOKIE_CONFIG.MAX_AGE
        });
      }

      // Remove refresh token from response
      const { refreshToken, ...responseData } = result;

      res.status(201).json({
        success: true,
        message: SUCCESS_MESSAGES.AUTH.REGISTER_SUCCESS,
        data: responseData
      });

    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({
          success: false,
          message: error.message
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Internal server error'
        });
      }
    }
  }

  /**
   * Login user
   * POST /api/auth/login
   */
  static async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password }: ILoginCredentials = req.body;

      // Validation
      if (!email || !password) {
        res.status(400).json({
          success: false,
          message: ERROR_MESSAGES.VALIDATION.REQUIRED_FIELD('Email and password')
        });
        return;
      }

      // Login user
      const result = await AuthService.login({ email, password });

      // Set refresh token cookie
      if (result.refreshToken) {
        res.cookie(COOKIE_CONFIG.REFRESH_TOKEN_NAME, result.refreshToken, {
          httpOnly: COOKIE_CONFIG.HTTP_ONLY,
          secure: COOKIE_CONFIG.SECURE,
          sameSite: COOKIE_CONFIG.SAME_SITE,
          maxAge: COOKIE_CONFIG.MAX_AGE
        });
      }

      // Remove refresh token from response
      const { refreshToken, ...responseData } = result;

      res.status(200).json({
        success: true,
        message: SUCCESS_MESSAGES.AUTH.LOGIN_SUCCESS,
        data: responseData
      });

    } catch (error) {
      if (error instanceof Error) {
        res.status(401).json({
          success: false,
          message: error.message
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Internal server error'
        });
      }
    }
  }

  /**
   * Refresh access token
   * POST /api/auth/refresh
   */
  static async refresh(req: Request, res: Response): Promise<void> {
    try {
      const refreshToken = req.cookies[COOKIE_CONFIG.REFRESH_TOKEN_NAME];

      if (!refreshToken) {
        res.status(401).json({
          success: false,
          message: ERROR_MESSAGES.AUTH.REFRESH_TOKEN_REQUIRED
        });
        return;
      }

      // Refresh token
      const result = await AuthService.refreshToken(refreshToken);

      res.status(200).json({
        success: true,
        message: SUCCESS_MESSAGES.AUTH.TOKEN_REFRESHED,
        data: result
      });

    } catch (error) {
      // Clear invalid refresh token cookie
      res.clearCookie(COOKIE_CONFIG.REFRESH_TOKEN_NAME);

      if (error instanceof Error) {
        res.status(401).json({
          success: false,
          message: error.message
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Internal server error'
        });
      }
    }
  }

  /**
   * Logout user
   * POST /api/auth/logout
   */
  static async logout(req: Request, res: Response): Promise<void> {
    try {
      // Clear refresh token cookie
      res.clearCookie(COOKIE_CONFIG.REFRESH_TOKEN_NAME);

      res.status(200).json({
        success: true,
        message: SUCCESS_MESSAGES.AUTH.LOGOUT_SUCCESS
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Get all users (admin only)
   * GET /api/auth/users
   */
  static async getUsers(req: Request, res: Response): Promise<void> {
    try {
      const users = await AuthService.getUsers();

      res.status(200).json({
        success: true,
        message: SUCCESS_MESSAGES.AUTH.USERS_RETRIEVED,
        data: users
      });

    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({
          success: false,
          message: error.message
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Internal server error'
        });
      }
    }
  }

  /**
   * Delete user (admin only)
   * DELETE /api/auth/users/:id
   */
  static async deleteUser(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!id) {
        res.status(400).json({
          success: false,
          message: ERROR_MESSAGES.VALIDATION.REQUIRED_FIELD('User ID')
        });
        return;
      }

      // Prevent admin from deleting themselves
      if (req.user && req.user.id === id) {
        res.status(400).json({
          success: false,
          message: 'Cannot delete your own account'
        });
        return;
      }

      await AuthService.deleteUser(id);

      res.status(200).json({
        success: true,
        message: SUCCESS_MESSAGES.AUTH.USER_DELETED
      });

    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({
          success: false,
          message: error.message
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Internal server error'
        });
      }
    }
  }

  /**
   * Get current user profile
   * GET /api/auth/profile
   */
  static async getProfile(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: ERROR_MESSAGES.AUTH.UNAUTHORIZED
        });
        return;
      }

      const user = await AuthService.getUserById(req.user.id);

      if (!user) {
        res.status(404).json({
          success: false,
          message: ERROR_MESSAGES.AUTH.USER_NOT_FOUND
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: SUCCESS_MESSAGES.AUTH.PROFILE_RETRIEVED,
        data: user
      });

    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({
          success: false,
          message: error.message
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Internal server error'
        });
      }
    }
  }
}
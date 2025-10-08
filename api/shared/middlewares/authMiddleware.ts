import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/tokenUtils.js';
import { IUserPayload } from '../interfaces/IUser.js';
import { ERROR_MESSAGES, USER_ROLES } from '../../config/constants.js';

// Extend Express Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: IUserPayload;
    }
  }
}

/**
 * Middleware to authenticate JWT tokens
 */
export const authenticateToken = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      res.status(401).json({ 
        success: false, 
        message: ERROR_MESSAGES.AUTH.TOKEN_REQUIRED
      });
      return;
    }

    // Check if header starts with 'Bearer '
    if (!authHeader.startsWith('Bearer ')) {
      res.status(401).json({ 
        success: false, 
        message: ERROR_MESSAGES.VALIDATION.INVALID_FORMAT + '. Use Bearer <token>'
      });
      return;
    }

    // Extract token
    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    if (!token) {
      res.status(401).json({ 
        success: false, 
        message: ERROR_MESSAGES.AUTH.TOKEN_REQUIRED
      });
      return;
    }

    // Verify token
    const decoded = verifyAccessToken(token);
    req.user = decoded;
    
    next();
    
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'Token expired') {
        res.status(401).json({ 
          success: false, 
          message: ERROR_MESSAGES.AUTH.TOKEN_EXPIRED,
          code: 'TOKEN_EXPIRED'
        });
        return;
      } else if (error.message === 'Invalid token') {
        res.status(401).json({ 
          success: false, 
          message: ERROR_MESSAGES.AUTH.TOKEN_INVALID,
          code: 'INVALID_TOKEN'
        });
        return;
      }
    }
    
    res.status(401).json({ 
      success: false, 
      message: 'Token verification failed' 
    });
  }
};

/**
 * Middleware to check if user has admin role
 */
export const requireAdmin = (req: Request, res: Response, next: NextFunction): void => {
  try {
    if (!req.user) {
      res.status(401).json({ 
        success: false, 
        message: ERROR_MESSAGES.AUTH.UNAUTHORIZED
      });
      return;
    }

    if (req.user.role !== USER_ROLES.ADMIN) {
      res.status(403).json({ 
        success: false, 
        message: ERROR_MESSAGES.AUTH.ADMIN_REQUIRED
      });
      return;
    }

    next();
    
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Authorization check failed' 
    });
  }
};

/**
 * Middleware to check if user has specific roles
 */
export const requireRoles = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      if (!req.user) {
        res.status(401).json({ 
          success: false, 
          message: ERROR_MESSAGES.AUTH.UNAUTHORIZED
        });
        return;
      }

      if (!roles.includes(req.user.role)) {
        res.status(403).json({ 
          success: false, 
          message: ERROR_MESSAGES.AUTH.FORBIDDEN + `. Required roles: ${roles.join(', ')}`
        });
        return;
      }

      next();
      
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        message: 'Authorization check failed' 
      });
    }
  };
};

/**
 * Optional authentication middleware - doesn't fail if no token
 */
export const optionalAuth = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      
      if (token) {
        try {
          const decoded = verifyAccessToken(token);
          req.user = decoded;
        } catch (error) {
          // Silently ignore token errors in optional auth
        }
      }
    }
    
    next();
    
  } catch (error) {
    // Silently ignore errors in optional auth
    next();
  }
};
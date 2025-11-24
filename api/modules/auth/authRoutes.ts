import { Router } from 'express';
import { AuthController } from './authController.js';
import { authenticateToken, requireAdmin } from '../../shared/middlewares/authMiddleware.js';

const router: Router = Router();

// Public routes
router.post('/register', AuthController.register);
router.post('/login', AuthController.login);
router.post('/refresh', AuthController.refresh);
router.post('/logout', AuthController.logout);

// Protected routes - require authentication
router.get('/profile', authenticateToken, AuthController.getProfile);

// Admin only routes
router.get('/users', authenticateToken, requireAdmin, AuthController.getUsers);
router.delete('/users/:id', authenticateToken, requireAdmin, AuthController.deleteUser);

export default router;
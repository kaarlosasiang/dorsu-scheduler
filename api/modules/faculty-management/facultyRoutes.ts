import { Router } from 'express';
import { FacultyController } from './facultyController.js';
import { authenticateToken, requireRoles, ensureOwnFacultyOrAdmin } from '../../shared/middlewares/authMiddleware.js';

const router: Router = Router();

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Faculty statistics (place before /:id to avoid conflicts)
router.get('/stats', FacultyController.getStats);

// Current faculty user's own record (place before /:id to avoid conflicts)
router.get('/me', FacultyController.getMe);

// Faculty profile endpoint - faculty can view own, admin can view any
router.get('/:id/profile', ensureOwnFacultyOrAdmin, FacultyController.getProfile);

// Faculty workload endpoint - faculty can view own, admin can view any
router.get('/:id/workload', ensureOwnFacultyOrAdmin, FacultyController.getWorkload);

// Faculty schedules endpoint - faculty can view own, admin can view any
router.get('/:id/schedules', ensureOwnFacultyOrAdmin, FacultyController.getSchedules);

// Main CRUD routes
router.get('/', FacultyController.getAll);
router.get('/:id', FacultyController.getById);
router.post('/', requireRoles(['admin']), FacultyController.create);
router.put('/:id', requireRoles(['admin']), FacultyController.update);
router.delete('/:id', requireRoles(['admin']), FacultyController.remove);

// Specific update routes
router.patch('/:id/preparations', requireRoles(['admin']), FacultyController.updatePreparations);
router.patch('/:id/workload', requireRoles(['admin']), FacultyController.updateWorkload);
router.patch('/:id/status', requireRoles(['admin']), FacultyController.setStatus);

export default router;

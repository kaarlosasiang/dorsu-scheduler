import { Router } from 'express';
import { FacultyController } from './facultyController.js';
import { authenticateToken } from '../../shared/middlewares/authMiddleware.js';

const router: Router = Router();

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Faculty statistics (place before /:id to avoid conflicts)
router.get('/stats', FacultyController.getStats);

// Main CRUD routes
router.get('/', FacultyController.getAll);
router.get('/:id', FacultyController.getById);
router.post('/', FacultyController.create);
router.put('/:id', FacultyController.update);
router.delete('/:id', FacultyController.remove);

// Specific update routes
router.patch('/:id/availability', FacultyController.updateAvailability);
router.patch('/:id/workload', FacultyController.updateWorkload);
router.patch('/:id/status', FacultyController.setStatus);

export default router;
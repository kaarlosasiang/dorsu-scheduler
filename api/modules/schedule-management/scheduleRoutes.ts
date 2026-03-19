import { Router } from 'express';
import { ScheduleController } from './scheduleController.js';
import { authenticateToken, requireRoles } from '../../shared/middlewares/authMiddleware.js';

const router: Router = Router();

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Core automated scheduling (admin only)
router.post('/generate', requireRoles(['admin']), ScheduleController.generateSchedules);

// Stats and utilities
router.get('/stats', ScheduleController.getStats);
router.post('/detect-conflicts', requireRoles(['admin']), ScheduleController.detectConflicts);

// View by resource
router.get('/faculty/:facultyId', ScheduleController.getByFaculty);
router.get('/classroom/:classroomId', ScheduleController.getByClassroom);

// Bulk operations (admin only)
router.post('/publish', requireRoles(['admin']), ScheduleController.publishSchedules);
router.post('/archive', requireRoles(['admin']), ScheduleController.archiveSchedules);

// CRUD operations
router.get('/', ScheduleController.getAll);
router.get('/:id', ScheduleController.getById);
router.post('/', requireRoles(['admin']), ScheduleController.create);
router.put('/:id', requireRoles(['admin']), ScheduleController.update);
router.delete('/:id', requireRoles(['admin']), ScheduleController.delete);

export { router as scheduleRoutes };


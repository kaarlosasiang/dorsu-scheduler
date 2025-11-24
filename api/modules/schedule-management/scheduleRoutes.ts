import { Router } from 'express';
import { ScheduleController } from './scheduleController.js';

const router: Router = Router();

// Core automated scheduling
router.post('/generate', ScheduleController.generateSchedules);

// Stats and utilities
router.get('/stats', ScheduleController.getStats);
router.post('/detect-conflicts', ScheduleController.detectConflicts);

// View by resource
router.get('/faculty/:facultyId', ScheduleController.getByFaculty);
router.get('/classroom/:classroomId', ScheduleController.getByClassroom);

// Bulk operations
router.post('/publish', ScheduleController.publishSchedules);
router.post('/archive', ScheduleController.archiveSchedules);

// CRUD operations
router.get('/', ScheduleController.getAll);
router.get('/:id', ScheduleController.getById);
router.post('/', ScheduleController.create);
router.put('/:id', ScheduleController.update);
router.delete('/:id', ScheduleController.delete);

export { router as scheduleRoutes };


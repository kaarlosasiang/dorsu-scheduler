import { Router } from 'express';
import { ClassroomController } from './classroomController.js';

const router: Router = Router();

// Basic CRUD routes
router.get('/', ClassroomController.getAll);
router.get('/stats', ClassroomController.getStats);
router.get('/available', ClassroomController.getAvailable);
router.get('/:id', ClassroomController.getById);
router.post('/', ClassroomController.create);
router.put('/:id', ClassroomController.update);
router.delete('/:id', ClassroomController.delete);

export { router as classroomRoutes };


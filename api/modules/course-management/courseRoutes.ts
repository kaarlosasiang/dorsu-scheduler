import { Router } from 'express';
import { CourseController } from './courseController.js';

const router: Router = Router();

// Stats route (must be before :id routes)
router.get('/stats', CourseController.getStats);

// Query routes
router.get('/code/:code', CourseController.getByCode);
router.get('/department/:departmentId', CourseController.getByDepartment);

// Basic CRUD routes
router.get('/', CourseController.getAll);
router.get('/:id', CourseController.getById);
router.post('/', CourseController.create);
router.put('/:id', CourseController.update);
router.delete('/:id', CourseController.delete);

// Department assignment routes
router.post('/:id/assign-department', CourseController.assignToDepartment);
router.post('/:id/remove-department', CourseController.removeFromDepartment);

export { router as courseRoutes };


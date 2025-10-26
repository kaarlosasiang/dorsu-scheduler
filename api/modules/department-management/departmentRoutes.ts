import { Router } from 'express';
import { DepartmentController } from './departmentController';

const router: Router = Router();

// Basic CRUD routes
router.get('/', DepartmentController.getAll);
router.get('/stats', DepartmentController.getStats);
router.get('/code/:code', DepartmentController.getByCode);
router.get('/:id', DepartmentController.getById);
router.post('/', DepartmentController.create);
router.put('/:id', DepartmentController.update);
router.delete('/:id', DepartmentController.delete);

export { router as departmentRoutes };
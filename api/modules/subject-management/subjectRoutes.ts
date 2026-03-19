import { Router } from 'express';
import { SubjectController } from './subjectController.js';
import { authenticateToken, requireRoles } from '../../shared/middlewares/authMiddleware.js';

const router: Router = Router();

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Subject statistics and special routes (place before /:id to avoid conflicts)
router.get('/stats', SubjectController.getStats);
router.get('/course/:courseId', SubjectController.getByCourse);

// Main CRUD routes
router.get('/', SubjectController.getAll);
router.get('/:id', SubjectController.getById);
router.post('/', requireRoles(['admin']), SubjectController.create);
router.put('/:id', requireRoles(['admin']), SubjectController.update);
router.delete('/:id', requireRoles(['admin']), SubjectController.delete);

export default router;


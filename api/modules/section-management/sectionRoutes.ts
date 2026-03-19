import { Router } from 'express';
import { SectionController } from './sectionController.js';
import { authenticateToken, requireRoles } from '../../shared/middlewares/authMiddleware.js';

const router: Router = Router();

router.use(authenticateToken);

// Sub-resource routes before /:id to avoid conflicts
router.get('/program/:programId/year/:yearLevel', SectionController.getByProgramAndYearLevel);
router.get('/program/:programId', SectionController.getByProgram);

// Standard CRUD
router.get('/', SectionController.getAll);
router.get('/:id', SectionController.getById);
router.post('/', requireRoles(['admin']), SectionController.create);
router.put('/:id', requireRoles(['admin']), SectionController.update);
router.delete('/:id', requireRoles(['admin']), SectionController.delete);

export { router as sectionRoutes };

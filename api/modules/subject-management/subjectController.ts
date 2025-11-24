import { Request, Response } from 'express';
import * as SubjectService from './subjectService';
import {
  validateSubjectQuery,
  validateCreateSubject,
  validateUpdateSubject,
  validateSubjectId
} from '../../shared/validators/subjectValidator';

export class SubjectController {
  /**
   * GET /api/subjects - Get all subjects
   */
  static async getAll(req: Request, res: Response): Promise<void> {
    try {
      const queryValidation = validateSubjectQuery(req.query);
      if (!queryValidation.success) {
        res.status(400).json({
          success: false,
          message: 'Invalid query parameters',
          errors: queryValidation.error.issues.map(issue => issue.message)
        });
        return;
      }

      const subjects = await SubjectService.getAll(queryValidation.data);

      res.status(200).json({
        success: true,
        message: 'Subjects retrieved successfully',
        data: subjects,
        count: subjects.length
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Internal server error'
      });
    }
  }

  /**
   * GET /api/subjects/stats - Get subject statistics
   */
  static async getStats(req: Request, res: Response): Promise<void> {
    try {
      const stats = await SubjectService.getStats(req.query);

      res.status(200).json({
        success: true,
        message: 'Subject statistics retrieved successfully',
        data: stats
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to retrieve statistics'
      });
    }
  }

  /**
   * GET /api/subjects/course/:courseId - Get subjects by course
   */
  static async getByCourse(req: Request, res: Response): Promise<void> {
    try {
      const { courseId } = req.params;
      const idValidation = validateSubjectId(courseId);
      if (!idValidation.success) {
        res.status(400).json({ success: false, message: 'Invalid course ID format' });
        return;
      }

      const subjects = await SubjectService.getByCourse(courseId);

      res.status(200).json({
        success: true,
        message: 'Subjects retrieved successfully',
        data: subjects,
        count: subjects.length
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Internal server error'
      });
    }
  }

  /**
   * GET /api/subjects/:id - Get subject by ID
   */
  static async getById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const idValidation = validateSubjectId(id);
      if (!idValidation.success) {
        res.status(400).json({ success: false, message: 'Invalid subject ID format' });
        return;
      }

      const subject = await SubjectService.getById(id);

      res.status(200).json({
        success: true,
        message: 'Subject retrieved successfully',
        data: subject
      });
    } catch (error) {
      const statusCode = error instanceof Error && error.message === 'Subject not found' ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        message: error instanceof Error ? error.message : 'Internal server error'
      });
    }
  }

  /**
   * POST /api/subjects - Create a new subject
   */
  static async create(req: Request, res: Response): Promise<void> {
    try {
      const validation = validateCreateSubject(req.body);
      if (!validation.success) {
        res.status(400).json({
          success: false,
          message: 'Invalid subject data',
          errors: validation.error.issues.map(i => i.message)
        });
        return;
      }

      const subject = await SubjectService.create(validation.data);

      res.status(201).json({
        success: true,
        message: 'Subject created successfully',
        data: subject
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to create subject'
      });
    }
  }

  /**
   * PUT /api/subjects/:id - Update subject
   */
  static async update(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const idValidation = validateSubjectId(id);
      if (!idValidation.success) {
        res.status(400).json({ success: false, message: 'Invalid subject ID format' });
        return;
      }

      const validation = validateUpdateSubject(req.body);
      if (!validation.success) {
        res.status(400).json({
          success: false,
          message: 'Invalid subject data',
          errors: validation.error.issues.map(i => i.message)
        });
        return;
      }

      const subject = await SubjectService.update(id, validation.data);

      res.status(200).json({
        success: true,
        message: 'Subject updated successfully',
        data: subject
      });
    } catch (error) {
      const statusCode = error instanceof Error && error.message === 'Subject not found' ? 404 : 400;
      res.status(statusCode).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to update subject'
      });
    }
  }

  /**
   * DELETE /api/subjects/:id - Delete subject
   */
  static async delete(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const idValidation = validateSubjectId(id);
      if (!idValidation.success) {
        res.status(400).json({ success: false, message: 'Invalid subject ID format' });
        return;
      }

      await SubjectService.deleteSubject(id);

      res.status(200).json({
        success: true,
        message: 'Subject deleted successfully'
      });
    } catch (error) {
      const statusCode = error instanceof Error && error.message === 'Subject not found' ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to delete subject'
      });
    }
  }
}


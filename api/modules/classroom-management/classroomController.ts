import { Request, Response } from 'express';
import { ClassroomService } from './classroomService.js';
import {
  validateClassroomQuery,
  validateCreateClassroom,
  validateUpdateClassroom,
  validateClassroomId
} from '../../shared/validators/classroomValidator.js';

export class ClassroomController {
  /**
   * GET /api/classrooms - Get all classrooms
   */
  static async getAll(req: Request, res: Response): Promise<void> {
    try {
      // Validate query parameters
      const queryValidation = validateClassroomQuery(req.query);
      if (!queryValidation.success) {
        res.status(400).json({
          success: false,
          message: 'Invalid query parameters',
          errors: queryValidation.error.issues.map(issue => issue.message)
        });
        return;
      }

      const { roomNumber, building, type, status, minCapacity, maxCapacity } = queryValidation.data;

      const classrooms = await ClassroomService.getAll({
        roomNumber,
        building,
        type,
        status,
        minCapacity,
        maxCapacity
      });

      res.status(200).json({
        success: true,
        message: 'Classrooms retrieved successfully',
        data: classrooms,
        count: classrooms.length
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Internal server error'
      });
    }
  }

  /**
   * GET /api/classrooms/available - Get available classrooms
   */
  static async getAvailable(req: Request, res: Response): Promise<void> {
    try {
      const classrooms = await ClassroomService.getAvailable();

      res.status(200).json({
        success: true,
        message: 'Available classrooms retrieved successfully',
        data: classrooms,
        count: classrooms.length
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Internal server error'
      });
    }
  }

  /**
   * GET /api/classrooms/stats - Get classroom statistics
   */
  static async getStats(req: Request, res: Response): Promise<void> {
    try {
      const stats = await ClassroomService.getStats();

      res.status(200).json({
        success: true,
        message: 'Classroom statistics retrieved successfully',
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
   * GET /api/classrooms/:id - Get classroom by ID
   */
  static async getById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      // Validate ID format
      const idValidation = validateClassroomId(id);
      if (!idValidation.success) {
        res.status(400).json({ success: false, message: 'Invalid classroom ID format' });
        return;
      }

      const classroom = await ClassroomService.getById(id);

      res.status(200).json({
        success: true,
        message: 'Classroom retrieved successfully',
        data: classroom
      });
    } catch (error) {
      const statusCode = error instanceof Error && error.message === 'Classroom not found' ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        message: error instanceof Error ? error.message : 'Internal server error'
      });
    }
  }

  /**
   * POST /api/classrooms - Create a new classroom
   */
  static async create(req: Request, res: Response): Promise<void> {
    try {
      // Validate request body
      const validation = validateCreateClassroom(req.body);
      if (!validation.success) {
        res.status(400).json({
          success: false,
          message: 'Invalid classroom data',
          errors: validation.error.issues.map(i => i.message)
        });
        return;
      }

      const classroom = await ClassroomService.create(validation.data);

      res.status(201).json({
        success: true,
        message: 'Classroom created successfully',
        data: classroom
      });
    } catch (error) {
      const statusCode = error instanceof Error && error.message.includes('already exists') ? 409 : 400;
      res.status(statusCode).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to create classroom'
      });
    }
  }

  /**
   * PUT /api/classrooms/:id - Update classroom
   */
  static async update(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      // Validate ID format
      const idValidation = validateClassroomId(id);
      if (!idValidation.success) {
        res.status(400).json({ success: false, message: 'Invalid classroom ID format' });
        return;
      }

      // Validate request body
      const validation = validateUpdateClassroom(req.body);
      if (!validation.success) {
        res.status(400).json({
          success: false,
          message: 'Invalid classroom data',
          errors: validation.error.issues.map(i => i.message)
        });
        return;
      }

      const classroom = await ClassroomService.update(id, validation.data);

      res.status(200).json({
        success: true,
        message: 'Classroom updated successfully',
        data: classroom
      });
    } catch (error) {
      let statusCode = 400;
      if (error instanceof Error) {
        if (error.message === 'Classroom not found') {
          statusCode = 404;
        } else if (error.message.includes('already exists')) {
          statusCode = 409;
        }
      }

      res.status(statusCode).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to update classroom'
      });
    }
  }

  /**
   * DELETE /api/classrooms/:id - Delete classroom
   */
  static async delete(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      // Validate ID format
      const idValidation = validateClassroomId(id);
      if (!idValidation.success) {
        res.status(400).json({ success: false, message: 'Invalid classroom ID format' });
        return;
      }

      await ClassroomService.delete(id);

      res.status(200).json({
        success: true,
        message: 'Classroom deleted successfully'
      });
    } catch (error) {
      let statusCode = 400;
      if (error instanceof Error) {
        if (error.message === 'Classroom not found') {
          statusCode = 404;
        } else if (error.message.includes('Cannot delete')) {
          statusCode = 409;
        }
      }

      res.status(statusCode).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to delete classroom'
      });
    }
  }
}


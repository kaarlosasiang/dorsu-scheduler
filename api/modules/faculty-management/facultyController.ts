import { Request, Response } from 'express';
import { FacultyService } from './facultyService.js';
import { validateFacultyQuery } from '../../shared/validators/facultyValidator.js';

export class FacultyController {
  /**
   * GET /api/faculty - Get all faculty with optional filtering
   */
  static async getAll(req: Request, res: Response): Promise<void> {
    try {
      // Validate query parameters
      const queryValidation = validateFacultyQuery(req.query);
      if (!queryValidation.success) {
        const errors = queryValidation.error.issues.map(err => `${err.path.join('.')}: ${err.message}`);
        res.status(400).json({
          success: false,
          message: 'Invalid query parameters',
          errors
        });
        return;
      }

      const { department, status } = queryValidation.data;
      const faculty = await FacultyService.getAll({ department, status });

      res.status(200).json({
        success: true,
        message: 'Faculty retrieved successfully',
        data: faculty,
        count: faculty.length
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Internal server error'
      });
    }
  }

  /**
   * GET /api/faculty/:id - Get faculty by ID
   */
  static async getById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const faculty = await FacultyService.getById(id);

      res.status(200).json({
        success: true,
        message: 'Faculty retrieved successfully',
        data: faculty
      });
    } catch (error) {
      if (error instanceof Error && error.message === 'Faculty not found') {
        res.status(404).json({
          success: false,
          message: error.message
        });
        return;
      }

      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Internal server error'
      });
    }
  }

  /**
   * POST /api/faculty - Create new faculty
   */
  static async create(req: Request, res: Response): Promise<void> {
    try {
      const faculty = await FacultyService.create(req.body);

      res.status(201).json({
        success: true,
        message: 'Faculty created successfully',
        data: faculty
      });
    } catch (error) {
      if (error instanceof Error && error.message.includes('Validation error')) {
        res.status(400).json({
          success: false,
          message: error.message
        });
        return;
      }

      if (error instanceof Error && error.message.includes('already exists')) {
        res.status(409).json({
          success: false,
          message: error.message
        });
        return;
      }

      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Internal server error'
      });
    }
  }

  /**
   * PUT /api/faculty/:id - Update faculty
   */
  static async update(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const faculty = await FacultyService.update(id, req.body);

      res.status(200).json({
        success: true,
        message: 'Faculty updated successfully',
        data: faculty
      });
    } catch (error) {
      if (error instanceof Error && error.message === 'Faculty not found') {
        res.status(404).json({
          success: false,
          message: error.message
        });
        return;
      }

      if (error instanceof Error && error.message.includes('Validation error')) {
        res.status(400).json({
          success: false,
          message: error.message
        });
        return;
      }

      if (error instanceof Error && error.message.includes('already exists')) {
        res.status(409).json({
          success: false,
          message: error.message
        });
        return;
      }

      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Internal server error'
      });
    }
  }

  /**
   * PATCH /api/faculty/:id/availability - Update faculty availability
   */
  static async updateAvailability(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const faculty = await FacultyService.updateAvailability(id, req.body);

      res.status(200).json({
        success: true,
        message: 'Faculty availability updated successfully',
        data: faculty
      });
    } catch (error) {
      if (error instanceof Error && error.message === 'Faculty not found') {
        res.status(404).json({
          success: false,
          message: error.message
        });
        return;
      }

      if (error instanceof Error && error.message.includes('Validation error')) {
        res.status(400).json({
          success: false,
          message: error.message
        });
        return;
      }

      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Internal server error'
      });
    }
  }

  /**
   * PATCH /api/faculty/:id/workload - Update faculty workload
   */
  static async updateWorkload(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const faculty = await FacultyService.updateWorkload(id, req.body);

      res.status(200).json({
        success: true,
        message: 'Faculty workload updated successfully',
        data: faculty
      });
    } catch (error) {
      if (error instanceof Error && error.message === 'Faculty not found') {
        res.status(404).json({
          success: false,
          message: error.message
        });
        return;
      }

      if (error instanceof Error && error.message.includes('Validation error')) {
        res.status(400).json({
          success: false,
          message: error.message
        });
        return;
      }

      if (error instanceof Error && error.message.includes('cannot exceed')) {
        res.status(400).json({
          success: false,
          message: error.message
        });
        return;
      }

      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Internal server error'
      });
    }
  }

  /**
   * PATCH /api/faculty/:id/status - Update faculty status
   */
  static async setStatus(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const faculty = await FacultyService.setStatus(id, req.body);

      res.status(200).json({
        success: true,
        message: 'Faculty status updated successfully',
        data: faculty
      });
    } catch (error) {
      if (error instanceof Error && error.message === 'Faculty not found') {
        res.status(404).json({
          success: false,
          message: error.message
        });
        return;
      }

      if (error instanceof Error && error.message.includes('Validation error')) {
        res.status(400).json({
          success: false,
          message: error.message
        });
        return;
      }

      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Internal server error'
      });
    }
  }

  /**
   * DELETE /api/faculty/:id - Remove faculty
   */
  static async remove(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      await FacultyService.remove(id);

      res.status(200).json({
        success: true,
        message: 'Faculty removed successfully'
      });
    } catch (error) {
      if (error instanceof Error && error.message === 'Faculty not found') {
        res.status(404).json({
          success: false,
          message: error.message
        });
        return;
      }

      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Internal server error'
      });
    }
  }

  /**
   * GET /api/faculty/stats - Get faculty statistics
   */
  static async getStats(req: Request, res: Response): Promise<void> {
    try {
      const { department } = req.query;
      const stats = await FacultyService.getStats(department as string);

      res.status(200).json({
        success: true,
        message: 'Faculty statistics retrieved successfully',
        data: stats
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Internal server error'
      });
    }
  }
}
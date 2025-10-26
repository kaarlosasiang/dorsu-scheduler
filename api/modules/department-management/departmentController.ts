import { Request, Response } from 'express';
import { DepartmentService } from './departmentService.js';
import { validateDepartmentQuery } from '../../shared/validators/departmentValidator.js';

export class DepartmentController {
  /**
   * GET /api/departments - Get all departments
   */
  static async getAll(req: Request, res: Response): Promise<void> {
    try {
      // Validate query parameters
      const queryValidation = validateDepartmentQuery(req.query);
      if (!queryValidation.success) {
        res.status(400).json({
          success: false,
          message: 'Invalid query parameters',
          errors: queryValidation.error.issues.map(issue => issue.message)
        });
        return;
      }

      const { name, code } = queryValidation.data;

      const departments = await DepartmentService.getAll({ name, code });

      res.status(200).json({
        success: true,
        message: 'Departments retrieved successfully',
        data: departments,
        count: departments.length
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Internal server error'
      });
    }
  }

  /**
   * GET /api/departments/:id - Get department by ID
   */
  static async getById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const department = await DepartmentService.getById(id);

      res.status(200).json({
        success: true,
        message: 'Department retrieved successfully',
        data: department
      });
    } catch (error) {
      const statusCode = error instanceof Error && error.message === 'Department not found' ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        message: error instanceof Error ? error.message : 'Internal server error'
      });
    }
  }

  /**
   * GET /api/departments/code/:code - Get department by code
   */
  static async getByCode(req: Request, res: Response): Promise<void> {
    try {
      const { code } = req.params;

      const department = await DepartmentService.getByCode(code);

      res.status(200).json({
        success: true,
        message: 'Department retrieved successfully',
        data: department
      });
    } catch (error) {
      const statusCode = error instanceof Error && error.message === 'Department not found' ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        message: error instanceof Error ? error.message : 'Internal server error'
      });
    }
  }

  /**
   * POST /api/departments - Create a new department
   */
  static async create(req: Request, res: Response): Promise<void> {
    try {
      const department = await DepartmentService.create(req.body);

      res.status(201).json({
        success: true,
        message: 'Department created successfully',
        data: department
      });
    } catch (error) {
      const statusCode = error instanceof Error && error.message.includes('already exists') ? 409 : 400;
      res.status(statusCode).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to create department'
      });
    }
  }

  /**
   * PUT /api/departments/:id - Update department
   */
  static async update(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const department = await DepartmentService.update(id, req.body);

      res.status(200).json({
        success: true,
        message: 'Department updated successfully',
        data: department
      });
    } catch (error) {
      let statusCode = 400;
      if (error instanceof Error) {
        if (error.message === 'Department not found') {
          statusCode = 404;
        } else if (error.message.includes('already exists')) {
          statusCode = 409;
        }
      }

      res.status(statusCode).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to update department'
      });
    }
  }

  /**
   * DELETE /api/departments/:id - Delete department
   */
  static async delete(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      await DepartmentService.delete(id);

      res.status(200).json({
        success: true,
        message: 'Department deleted successfully'
      });
    } catch (error) {
      let statusCode = 400;
      if (error instanceof Error) {
        if (error.message === 'Department not found') {
          statusCode = 404;
        } else if (error.message.includes('Cannot delete')) {
          statusCode = 409;
        }
      }

      res.status(statusCode).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to delete department'
      });
    }
  }

  /**
   * GET /api/departments/stats - Get department statistics
   */
  static async getStats(req: Request, res: Response): Promise<void> {
    try {
      const stats = await DepartmentService.getStats();

      res.status(200).json({
        success: true,
        message: 'Department statistics retrieved successfully',
        data: stats
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to retrieve statistics'
      });
    }
  }
}
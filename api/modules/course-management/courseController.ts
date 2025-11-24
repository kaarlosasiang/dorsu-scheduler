import { Request, Response } from 'express';
import { CourseService } from './courseService';
import { validateCourseQuery, validateCreateCourse, validateUpdateCourse, validateCourseId } from '../../shared/validators/courseValidator.js';

export class CourseController {
  /**
   * GET /api/courses - Get all courses
   */
  static async getAll(req: Request, res: Response): Promise<void> {
    try {
      // Validate query parameters
      const queryValidation = validateCourseQuery(req.query);
      if (!queryValidation.success) {
        res.status(400).json({
          success: false,
          message: 'Invalid query parameters',
          errors: queryValidation.error.issues.map(issue => issue.message)
        });
        return;
      }

      const { courseCode, courseName, department } = queryValidation.data;

      const courses = await CourseService.getAll({ courseCode, courseName, department });

      res.status(200).json({
        success: true,
        message: 'Courses retrieved successfully',
        data: courses,
        count: courses.length
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Internal server error'
      });
    }
  }

  /**
   * GET /api/courses/:id - Get course by ID
   */
  static async getById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      // Validate ID format
      const idValidation = validateCourseId(id);
      if (!idValidation.success) {
        res.status(400).json({ success: false, message: 'Invalid course ID format' });
        return;
      }

      const course = await CourseService.getById(id);

      res.status(200).json({
        success: true,
        message: 'Course retrieved successfully',
        data: course
      });
    } catch (error) {
      const statusCode = error instanceof Error && error.message === 'Course not found' ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        message: error instanceof Error ? error.message : 'Internal server error'
      });
    }
  }

  /**
   * GET /api/courses/code/:code - Get course by code
   */
  static async getByCode(req: Request, res: Response): Promise<void> {
    try {
      const { code } = req.params;
      const { department } = req.query;

      const course = await CourseService.getByCode(code, department as string);

      res.status(200).json({
        success: true,
        message: 'Course retrieved successfully',
        data: course
      });
    } catch (error) {
      const statusCode = error instanceof Error && error.message === 'Course not found' ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        message: error instanceof Error ? error.message : 'Internal server error'
      });
    }
  }

  /**
   * GET /api/courses/department/:departmentId - Get courses by department
   */
  static async getByDepartment(req: Request, res: Response): Promise<void> {
    try {
      const { departmentId } = req.params;

      // Validate department ID format
      const idValidation = validateCourseId(departmentId);
      if (!idValidation.success) {
        res.status(400).json({ success: false, message: 'Invalid department ID format' });
        return;
      }

      const courses = await CourseService.getByDepartment(departmentId);

      res.status(200).json({
        success: true,
        message: 'Courses retrieved successfully',
        data: courses,
        count: courses.length
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Internal server error'
      });
    }
  }

  /**
   * POST /api/courses - Create a new course
   */
  static async create(req: Request, res: Response): Promise<void> {
    try {
      // Validate request body
      const validation = validateCreateCourse(req.body);
      if (!validation.success) {
        res.status(400).json({
          success: false,
          message: 'Invalid course data',
          errors: validation.error.issues.map(i => i.message)
        });
        return;
      }

      const course = await CourseService.create(validation.data);

      res.status(201).json({
        success: true,
        message: 'Course created successfully',
        data: course
      });
    } catch (error) {
      let statusCode = 400;
      if (error instanceof Error) {
        if (error.message.includes('already exists')) {
          statusCode = 409;
        } else if (error.message === 'Department not found') {
          statusCode = 404;
        }
      }

      res.status(statusCode).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to create course'
      });
    }
  }

  /**
   * PUT /api/courses/:id - Update course
   */
  static async update(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      // Validate ID format
      const idValidation = validateCourseId(id);
      if (!idValidation.success) {
        res.status(400).json({ success: false, message: 'Invalid course ID format' });
        return;
      }

      // Validate request body
      const validation = validateUpdateCourse(req.body);
      if (!validation.success) {
        res.status(400).json({
          success: false,
          message: 'Invalid course data',
          errors: validation.error.issues.map(i => i.message)
        });
        return;
      }

      const course = await CourseService.update(id, validation.data);

      res.status(200).json({
        success: true,
        message: 'Course updated successfully',
        data: course
      });
    } catch (error) {
      let statusCode = 400;
      if (error instanceof Error) {
        if (error.message === 'Course not found' || error.message === 'Department not found') {
          statusCode = 404;
        } else if (error.message.includes('already exists')) {
          statusCode = 409;
        }
      }

      res.status(statusCode).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to update course'
      });
    }
  }

  /**
   * DELETE /api/courses/:id - Delete course
   */
  static async delete(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      // Validate ID format
      const idValidation = validateCourseId(id);
      if (!idValidation.success) {
        res.status(400).json({ success: false, message: 'Invalid course ID format' });
        return;
      }

      await CourseService.delete(id);

      res.status(200).json({
        success: true,
        message: 'Course deleted successfully'
      });
    } catch (error) {
      let statusCode = 400;
      if (error instanceof Error) {
        if (error.message === 'Course not found') {
          statusCode = 404;
        } else if (error.message.includes('Cannot delete')) {
          statusCode = 409;
        }
      }

      res.status(statusCode).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to delete course'
      });
    }
  }

  /**
   * POST /api/courses/:id/assign-department - Assign course to department
   */
  static async assignToDepartment(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { departmentId } = req.body;

      // Validate IDs
      const courseIdValidation = validateCourseId(id);
      const deptIdValidation = validateCourseId(departmentId);

      if (!courseIdValidation.success || !deptIdValidation.success) {
        res.status(400).json({
          success: false,
          message: 'Invalid course or department ID format'
        });
        return;
      }

      const course = await CourseService.assignToDepartment(id, departmentId);

      res.status(200).json({
        success: true,
        message: 'Course assigned to department successfully',
        data: course
      });
    } catch (error) {
      const statusCode = error instanceof Error &&
        (error.message === 'Course not found' || error.message === 'Department not found')
        ? 404 : 500;

      res.status(statusCode).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to assign course'
      });
    }
  }

  /**
   * POST /api/courses/:id/remove-department - Remove course from department
   */
  static async removeFromDepartment(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      // Validate ID format
      const idValidation = validateCourseId(id);
      if (!idValidation.success) {
        res.status(400).json({ success: false, message: 'Invalid course ID format' });
        return;
      }

      const course = await CourseService.removeFromDepartment(id);

      res.status(200).json({
        success: true,
        message: 'Course removed from department successfully',
        data: course
      });
    } catch (error) {
      const statusCode = error instanceof Error && error.message === 'Course not found' ? 404 : 500;

      res.status(statusCode).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to remove course'
      });
    }
  }

  /**
   * GET /api/courses/stats - Get course statistics
   */
  static async getStats(req: Request, res: Response): Promise<void> {
    try {
      const stats = await CourseService.getStats();

      res.status(200).json({
        success: true,
        message: 'Course statistics retrieved successfully',
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


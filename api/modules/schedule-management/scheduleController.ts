import { Request, Response } from 'express';
import * as ScheduleService from './scheduleService.js';
import {
  validateScheduleQuery,
  validateCreateSchedule,
  validateUpdateSchedule,
  validateScheduleId,
  validateScheduleGeneration
} from '../../shared/validators/scheduleValidator.js';

export class ScheduleController {
  /**
   * GET /api/schedules - Get all schedules
   */
  static async getAll(req: Request, res: Response): Promise<void> {
    try {
      const queryValidation = validateScheduleQuery(req.query);
      if (!queryValidation.success) {
        res.status(400).json({
          success: false,
          message: 'Invalid query parameters',
          errors: queryValidation.error.issues.map(issue => issue.message)
        });
        return;
      }

      const schedules = await ScheduleService.getAll(queryValidation.data);

      res.status(200).json({
        success: true,
        message: 'Schedules retrieved successfully',
        data: schedules,
        count: schedules.length
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Internal server error'
      });
    }
  }

  /**
   * GET /api/schedules/stats - Get schedule statistics
   */
  static async getStats(req: Request, res: Response): Promise<void> {
    try {
      const stats = await ScheduleService.getStats(req.query);

      res.status(200).json({
        success: true,
        message: 'Schedule statistics retrieved successfully',
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
   * GET /api/schedules/:id - Get schedule by ID
   */
  static async getById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const idValidation = validateScheduleId(id);
      if (!idValidation.success) {
        res.status(400).json({ success: false, message: 'Invalid schedule ID format' });
        return;
      }

      const schedule = await ScheduleService.getById(id);

      res.status(200).json({
        success: true,
        message: 'Schedule retrieved successfully',
        data: schedule
      });
    } catch (error) {
      const statusCode = error instanceof Error && error.message === 'Schedule not found' ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        message: error instanceof Error ? error.message : 'Internal server error'
      });
    }
  }

  /**
   * POST /api/schedules - Create a new schedule
   */
  static async create(req: Request, res: Response): Promise<void> {
    try {
      const validation = validateCreateSchedule(req.body);
      if (!validation.success) {
        res.status(400).json({
          success: false,
          message: 'Invalid schedule data',
          errors: validation.error.issues.map(i => i.message)
        });
        return;
      }

      const schedule = await ScheduleService.create(validation.data);

      res.status(201).json({
        success: true,
        message: 'Schedule created successfully',
        data: schedule
      });
    } catch (error) {
      const statusCode = error instanceof Error && error.message.includes('conflict') ? 409 : 400;
      res.status(statusCode).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to create schedule'
      });
    }
  }

  /**
   * PUT /api/schedules/:id - Update schedule
   */
  static async update(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const idValidation = validateScheduleId(id);
      if (!idValidation.success) {
        res.status(400).json({ success: false, message: 'Invalid schedule ID format' });
        return;
      }

      const validation = validateUpdateSchedule(req.body);
      if (!validation.success) {
        res.status(400).json({
          success: false,
          message: 'Invalid schedule data',
          errors: validation.error.issues.map(i => i.message)
        });
        return;
      }

      const schedule = await ScheduleService.update(id, validation.data);

      res.status(200).json({
        success: true,
        message: 'Schedule updated successfully',
        data: schedule
      });
    } catch (error) {
      let statusCode = 400;
      if (error instanceof Error) {
        if (error.message === 'Schedule not found') {
          statusCode = 404;
        } else if (error.message.includes('conflict')) {
          statusCode = 409;
        }
      }

      res.status(statusCode).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to update schedule'
      });
    }
  }

  /**
   * DELETE /api/schedules/:id - Delete schedule
   */
  static async delete(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const idValidation = validateScheduleId(id);
      if (!idValidation.success) {
        res.status(400).json({ success: false, message: 'Invalid schedule ID format' });
        return;
      }

      await ScheduleService.deleteSchedule(id);

      res.status(200).json({
        success: true,
        message: 'Schedule deleted successfully'
      });
    } catch (error) {
      const statusCode = error instanceof Error && error.message === 'Schedule not found' ? 404 : 400;
      res.status(statusCode).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to delete schedule'
      });
    }
  }

  /**
   * POST /api/schedules/detect-conflicts - Detect conflicts for proposed schedule
   */
  static async detectConflicts(req: Request, res: Response): Promise<void> {
    try {
      const conflicts = await ScheduleService.detectConflicts(req.body);

      res.status(200).json({
        success: true,
        message: 'Conflict detection completed',
        conflicts,
        hasConflicts: conflicts.length > 0
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to detect conflicts'
      });
    }
  }

  /**
   * POST /api/schedules/generate - Generate automated schedules
   * CORE FEATURE: Automated scheduling
   */
  static async generateSchedules(req: Request, res: Response): Promise<void> {
    try {
      const validation = validateScheduleGeneration(req.body);
      if (!validation.success) {
        res.status(400).json({
          success: false,
          message: 'Invalid generation request',
          errors: validation.error.issues.map(i => i.message)
        });
        return;
      }

      const result = await ScheduleService.generateSchedules(validation.data);

      res.status(200).json(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to generate schedules'
      });
    }
  }

  /**
   * GET /api/schedules/faculty/:facultyId - Get schedules for specific faculty
   */
  static async getByFaculty(req: Request, res: Response): Promise<void> {
    try {
      const { facultyId } = req.params;
      const { semester, academicYear } = req.query;

      if (!semester || !academicYear) {
        res.status(400).json({
          success: false,
          message: 'Semester and academic year are required'
        });
        return;
      }

      const schedules = await ScheduleService.getByFaculty(
        facultyId,
        semester as string,
        academicYear as string
      );

      res.status(200).json({
        success: true,
        message: 'Faculty schedules retrieved successfully',
        data: schedules,
        count: schedules.length
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to retrieve faculty schedules'
      });
    }
  }

  /**
   * GET /api/schedules/classroom/:classroomId - Get schedules for specific classroom
   */
  static async getByClassroom(req: Request, res: Response): Promise<void> {
    try {
      const { classroomId } = req.params;
      const { semester, academicYear } = req.query;

      if (!semester || !academicYear) {
        res.status(400).json({
          success: false,
          message: 'Semester and academic year are required'
        });
        return;
      }

      const schedules = await ScheduleService.getByClassroom(
        classroomId,
        semester as string,
        academicYear as string
      );

      res.status(200).json({
        success: true,
        message: 'Classroom schedules retrieved successfully',
        data: schedules,
        count: schedules.length
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to retrieve classroom schedules'
      });
    }
  }

  /**
   * POST /api/schedules/publish - Publish schedules
   */
  static async publishSchedules(req: Request, res: Response): Promise<void> {
    try {
      const { scheduleIds } = req.body;

      if (!Array.isArray(scheduleIds) || scheduleIds.length === 0) {
        res.status(400).json({
          success: false,
          message: 'Schedule IDs array is required'
        });
        return;
      }

      const count = await ScheduleService.publishSchedules(scheduleIds);

      res.status(200).json({
        success: true,
        message: `${count} schedule(s) published successfully`,
        count
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to publish schedules'
      });
    }
  }

  /**
   * POST /api/schedules/archive - Archive schedules for semester
   */
  static async archiveSchedules(req: Request, res: Response): Promise<void> {
    try {
      const { semester, academicYear } = req.body;

      if (!semester || !academicYear) {
        res.status(400).json({
          success: false,
          message: 'Semester and academic year are required'
        });
        return;
      }

      const count = await ScheduleService.archiveSchedules(semester, academicYear);

      res.status(200).json({
        success: true,
        message: `${count} schedule(s) archived successfully`,
        count
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to archive schedules'
      });
    }
  }
}


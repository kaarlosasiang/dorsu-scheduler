import { Request, Response } from 'express';
import { FacultyService } from './facultyService.js';
import { validateFacultyQuery } from '../../shared/validators/facultyValidator.js';

export class FacultyController {
  /**
   * GET /api/faculty/public/:facultyId - Public faculty lookup for registration
   */
  static async getPublicById(req: Request, res: Response): Promise<void> {
    try {
      const { facultyId } = req.params;
      const faculty = await FacultyService.getRegistrationLookupById(facultyId);

      res.status(200).json({
        success: true,
        message: 'Faculty retrieved successfully',
        data: {
          id: faculty._id.toString(),
          email: faculty.email,
          fullName: [faculty.name.first, faculty.name.middle, faculty.name.last, faculty.name.ext]
            .filter(Boolean)
            .join(' '),
          program: faculty.program,
          status: faculty.status,
          hasAccount: Boolean(faculty.userId),
        }
      });
    } catch (error) {
      if (error instanceof Error && error.message === 'Faculty not found') {
        res.status(404).json({
          success: false,
          message: 'Faculty ID not found'
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

      const { program, status, employmentType, email } = queryValidation.data;
      const faculty = await FacultyService.getAll({ program, status, employmentType, email });

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
   * PATCH /api/faculty/:id/preparations - Update faculty preparations
   */
  static async updatePreparations(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const faculty = await FacultyService.updatePreparations(id, req.body);

      res.status(200).json({
        success: true,
        message: 'Faculty preparations updated successfully',
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

      if (error instanceof Error && (error.message.includes('cannot exceed') || error.message.includes('cannot be below'))) {
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
      const { program } = req.query;
      const stats = await FacultyService.getStats(program as string);

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

  /**
   * GET /api/faculty/me - Get the faculty record of the currently logged-in faculty user
   */
  static async getMe(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const faculty = await FacultyService.getByUserId(req.user.id);

      if (!faculty) {
        res.status(404).json({
          success: false,
          message: 'No faculty record linked to this account'
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Faculty record retrieved successfully',
        data: faculty
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Internal server error'
      });
    }
  }

  /**
   * GET /api/faculty/:id/profile - Get faculty profile (faculty own or admin)
   */
  static async getProfile(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const { id } = req.params;
      const faculty = await FacultyService.getById(id);

      // Security check: faculty can only view their own profile
      if (req.user.role === 'faculty') {
        if (faculty.userId?.toString() !== req.user.id) {
          res.status(403).json({
            success: false,
            message: 'Access denied. You can only view your own profile.'
          });
          return;
        }
      }

      res.status(200).json({
        success: true,
        data: {
          name: faculty.name,
          email: faculty.email,
          program: faculty.program,
          designation: faculty.designation,
          employmentType: faculty.employmentType,
          adminLoad: faculty.adminLoad,
          minLoad: faculty.minLoad,
          maxLoad: faculty.maxLoad,
          currentLoad: faculty.currentLoad
        }
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
   * GET /api/faculty/:id/workload - Get faculty workload (faculty own or admin)
   */
  static async getWorkload(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const { id } = req.params;
      const { semester, academicYear } = req.query;

      // Validate required query params
      if (!semester || !academicYear) {
        res.status(400).json({
          success: false,
          message: 'Semester and academic year are required'
        });
        return;
      }

      // Get faculty to verify access and get maxLoad
      const faculty = await FacultyService.getById(id);

      // Security check: faculty can only view their own workload
      if (req.user.role === 'faculty') {
        if (faculty.userId?.toString() !== req.user.id) {
          res.status(403).json({
            success: false,
            message: 'Access denied. You can only view your own workload.'
          });
          return;
        }
      }

      // Calculate workload using existing utility
      const { calculateFacultyWorkload } = await import('../../shared/utils/workloadCalculator.js');
      const workload = await calculateFacultyWorkload(
        id,
        semester as string,
        academicYear as string
      );

      // Add overloaded flag
      const isOverloaded = workload.totalTeachingHours > faculty.maxLoad;

      res.status(200).json({
        success: true,
        data: {
          ...workload,
          maxLoad: faculty.maxLoad,
          isOverloaded
        }
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
   * GET /api/faculty/:id/schedules - Get faculty schedules (faculty own or admin)
   * Optional query param ?export=csv for CSV download
   */
  static async getSchedules(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const { id } = req.params;
      const { semester, academicYear, export: exportFormat } = req.query;

      // Validate required query params
      if (!semester || !academicYear) {
        res.status(400).json({
          success: false,
          message: 'Semester and academic year are required'
        });
        return;
      }

      // Get faculty to verify access
      const faculty = await FacultyService.getById(id);

      // Security check: faculty can only view their own schedules
      if (req.user.role === 'faculty') {
        if (faculty.userId?.toString() !== req.user.id) {
          res.status(403).json({
            success: false,
            message: 'Access denied. You can only view your own schedules.'
          });
          return;
        }
      }

      // Fetch schedules with populated references
      const Schedule = (await import('../../models/scheduleModel.js')).Schedule;

      const schedules = await Schedule.find({
        faculty: id,
        semester,
        academicYear,
        status: { $ne: 'archived' }
      })
        .populate('subject', 'subjectCode subjectName units')
        .populate('classroom', 'roomNumber building')
        .populate('department', 'name code')
        .populate('section', 'name yearLevel')
        .sort({ 'timeSlot.day': 1, 'timeSlot.startTime': 1 })
        .exec();

      // If CSV export requested
      if (exportFormat === 'csv') {
        const csvHeaders = 'Day,Start Time,End Time,Subject Code,Subject Name,Type,Units,Classroom,Section,Department';
        const csvRows = schedules.map(s => {
          const schedule = s as any;
          const day = schedule.timeSlot?.day || '';
          const startTime = schedule.timeSlot?.startTime || '';
          const endTime = schedule.timeSlot?.endTime || '';
          const subjectCode = schedule.subject?.subjectCode || '';
          const subjectName = schedule.subject?.subjectName || '';
          const type = schedule.scheduleType || '';
          const units = schedule.subject?.units || '';
          const classroom = schedule.classroom
            ? `${schedule.classroom.roomNumber}${schedule.classroom.building ? ' (' + schedule.classroom.building + ')' : ''}`
            : '';
          const section = schedule.section?.name || '';
          const department = schedule.department?.name || '';

          return `"${day}","${startTime}","${endTime}","${subjectCode}","${subjectName}","${type}","${units}","${classroom}","${section}","${department}"`;
        });

        const csvContent = [csvHeaders, ...csvRows].join('\n');

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="faculty-schedules-${semester}-${academicYear}.csv"`);
        res.status(200).send(csvContent);
        return;
      }

      // Return JSON response
      res.status(200).json({
        success: true,
        message: 'Faculty schedules retrieved successfully',
        data: schedules,
        count: schedules.length
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
}

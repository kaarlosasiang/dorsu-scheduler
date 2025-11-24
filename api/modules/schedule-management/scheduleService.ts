import { Schedule, IScheduleDocument } from '../../models/scheduleModel';
import { IScheduleGenerationResult } from '../../shared/interfaces/ISchedule';
import {
  validateCreateSchedule,
  validateUpdateSchedule,
  CreateScheduleInput,
  UpdateScheduleInput,
  ScheduleQueryInput,
  ScheduleGenerationInput
} from '../../shared/validators/scheduleValidator';
import { detectConflicts as detectScheduleConflicts } from '../../shared/utils/conflictDetector';
import { generateSchedules as generateAutomatedSchedules } from '../../shared/utils/scheduleGenerator';

/**
 * Get all schedules with optional filtering
 */
export async function getAll(filters: ScheduleQueryInput = {}): Promise<IScheduleDocument[]> {
  try {
    const query: any = {};
    
    if (filters.subject) query.subject = filters.subject;
    if (filters.faculty) query.faculty = filters.faculty;
    if (filters.classroom) query.classroom = filters.classroom;
    if (filters.department) query.department = filters.department;
    if (filters.semester) query.semester = filters.semester;
    if (filters.academicYear) query.academicYear = filters.academicYear;
    if (filters.yearLevel) query.yearLevel = filters.yearLevel;
    if (filters.section) query.section = filters.section;
    if (filters.status) query.status = filters.status;
    if (filters.day) query['timeSlot.day'] = filters.day;

    const schedules = await Schedule.find(query)
      .populate('subject', 'subjectCode subjectName units')
      .populate('faculty', 'name email')
      .populate('classroom', 'roomNumber building capacity')
      .populate('department', 'name code')
      .sort({ 'timeSlot.day': 1, 'timeSlot.startTime': 1 })
      .exec();

    return schedules;
  } catch (error) {
    console.error('Error in getAll:', error);
    throw new Error('Failed to retrieve schedules');
  }
}

/**
 * Get schedule by ID
 */
export async function getById(id: string): Promise<IScheduleDocument> {
  try {
    const schedule = await Schedule.findById(id)
      .populate('subject', 'subjectCode subjectName units description')
      .populate('faculty', 'name email department')
      .populate('classroom', 'roomNumber building capacity type facilities')
      .populate('department', 'name code')
      .exec();

    if (!schedule) {
      throw new Error('Schedule not found');
    }

    return schedule;
  } catch (error) {
    console.error('Error in getById:', error);
    if (error instanceof Error && error.message === 'Schedule not found') {
      throw error;
    }
    throw new Error('Failed to retrieve schedule');
  }
}

/**
 * Create a new schedule with conflict detection
 */
export async function create(scheduleData: CreateScheduleInput): Promise<IScheduleDocument> {
  try {
    // Validate input
    const validation = validateCreateSchedule(scheduleData);
    if (!validation.success) {
      throw new Error(`Validation failed: ${validation.error.issues.map(i => i.message).join(', ')}`);
    }

    const validatedData = validation.data;

    // Detect conflicts before creating
    const conflicts = await detectScheduleConflicts(validatedData);
    
    // Only allow if no error-level conflicts
    const errorConflicts = conflicts.filter(c => c.severity === 'error');
    if (errorConflicts.length > 0) {
      throw new Error(`Cannot create schedule: ${errorConflicts.map(c => c.message).join('; ')}`);
    }

    // Create schedule
    const schedule = new Schedule(validatedData);
    const savedSchedule = await schedule.save();

    // Populate before returning
    await savedSchedule.populate([
      { path: 'subject', select: 'subjectCode subjectName units' },
      { path: 'faculty', select: 'name email' },
      { path: 'classroom', select: 'roomNumber building capacity' },
      { path: 'department', select: 'name code' }
    ]);

    return savedSchedule;
  } catch (error) {
    console.error('Error in create:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to create schedule');
  }
}

/**
 * Update schedule with conflict detection
 */
export async function update(id: string, updateData: UpdateScheduleInput): Promise<IScheduleDocument> {
  try {
    // Validate input
    const validation = validateUpdateSchedule(updateData);
    if (!validation.success) {
      throw new Error(`Validation failed: ${validation.error.issues.map(i => i.message).join(', ')}`);
    }

    const validatedData = validation.data;

    // Check if schedule exists
    const existingSchedule = await Schedule.findById(id);
    if (!existingSchedule) {
      throw new Error('Schedule not found');
    }

    // Detect conflicts with update
    const conflicts = await detectScheduleConflicts({
      ...validatedData,
      _id: id
    });
    
    const errorConflicts = conflicts.filter(c => c.severity === 'error');
    if (errorConflicts.length > 0) {
      throw new Error(`Cannot update schedule: ${errorConflicts.map(c => c.message).join('; ')}`);
    }

    // Update schedule
    const updatedSchedule = await Schedule.findByIdAndUpdate(
      id,
      validatedData,
      { new: true, runValidators: true }
    )
      .populate('subject', 'subjectCode subjectName units')
      .populate('faculty', 'name email')
      .populate('classroom', 'roomNumber building capacity')
      .populate('department', 'name code')
      .exec();

    if (!updatedSchedule) {
      throw new Error('Failed to update schedule');
    }

    return updatedSchedule;
  } catch (error) {
    console.error('Error in update:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to update schedule');
  }
}

/**
 * Delete schedule
 */
export async function deleteSchedule(id: string): Promise<void> {
  try {
    const schedule = await Schedule.findById(id);
    if (!schedule) {
      throw new Error('Schedule not found');
    }

    await Schedule.findByIdAndDelete(id);
  } catch (error) {
    console.error('Error in deleteSchedule:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to delete schedule');
  }
}

/**
 * Get schedule statistics
 */
export async function getStats(filter: any = {}): Promise<any> {
  try {
    return await Schedule.getStats(filter);
  } catch (error) {
    console.error('Error in getStats:', error);
    throw new Error('Failed to retrieve schedule statistics');
  }
}

/**
 * Detect conflicts for a schedule
 */
export async function detectConflicts(scheduleData: any): Promise<any[]> {
  try {
    return await detectScheduleConflicts(scheduleData);
  } catch (error) {
    console.error('Error in detectConflicts:', error);
    throw new Error('Failed to detect conflicts');
  }
}

/**
 * Generate automated schedules
 * CORE FEATURE: Implements all 4 objectives
 */
export async function generateSchedules(request: ScheduleGenerationInput): Promise<IScheduleGenerationResult> {
  try {
    return await generateAutomatedSchedules(request);
  } catch (error) {
    console.error('Error in generateSchedules:', error);
    throw new Error('Failed to generate schedules');
  }
}

/**
 * Get schedules by faculty (for workload view)
 */
export async function getByFaculty(facultyId: string, semester: string, academicYear: string): Promise<IScheduleDocument[]> {
  try {
    return await Schedule.find({
      faculty: facultyId,
      semester,
      academicYear,
      status: { $ne: 'archived' }
    })
      .populate('subject', 'subjectCode subjectName units')
      .populate('classroom', 'roomNumber building')
      .sort({ 'timeSlot.day': 1, 'timeSlot.startTime': 1 });
  } catch (error) {
    console.error('Error in getByFaculty:', error);
    throw new Error('Failed to retrieve faculty schedules');
  }
}

/**
 * Get schedules by classroom (for room utilization)
 */
export async function getByClassroom(classroomId: string, semester: string, academicYear: string): Promise<IScheduleDocument[]> {
  try {
    return await Schedule.find({
      classroom: classroomId,
      semester,
      academicYear,
      status: { $ne: 'archived' }
    })
      .populate('subject', 'subjectCode subjectName')
      .populate('faculty', 'name')
      .sort({ 'timeSlot.day': 1, 'timeSlot.startTime': 1 });
  } catch (error) {
    console.error('Error in getByClassroom:', error);
    throw new Error('Failed to retrieve classroom schedules');
  }
}

/**
 * Publish schedules (change status from draft to published)
 */
export async function publishSchedules(scheduleIds: string[]): Promise<number> {
  try {
    const result = await Schedule.updateMany(
      { _id: { $in: scheduleIds }, status: 'draft' },
      { $set: { status: 'published' } }
    );
    
    return result.modifiedCount;
  } catch (error) {
    console.error('Error in publishSchedules:', error);
    throw new Error('Failed to publish schedules');
  }
}

/**
 * Archive schedules
 */
export async function archiveSchedules(semester: string, academicYear: string): Promise<number> {
  try {
    const result = await Schedule.updateMany(
      { semester, academicYear },
      { $set: { status: 'archived' } }
    );
    
    return result.modifiedCount;
  } catch (error) {
    console.error('Error in archiveSchedules:', error);
    throw new Error('Failed to archive schedules');
  }
}


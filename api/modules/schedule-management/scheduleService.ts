import { Schedule, IScheduleDocument } from '../../models/scheduleModel.js';
import { IScheduleGenerationResult, ITimeSlot } from '../../shared/interfaces/ISchedule.js';
import {
  validateCreateSchedule,
  validateUpdateSchedule,
  CreateScheduleInput,
  UpdateScheduleInput,
  ScheduleQueryInput,
  ScheduleGenerationInput
} from '../../shared/validators/scheduleValidator.js';
import { detectConflicts as detectScheduleConflicts } from '../../shared/utils/conflictDetector.js';
import { generateSchedules as generateAutomatedSchedules } from '../../shared/utils/scheduleGenerator.js';
import { getTimeSlotsForScheduleType } from '../../shared/utils/timeSlotPatterns.js';

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
      .populate({
        path: 'subject',
        select: 'subjectCode subjectName units lectureUnits labUnits semester courseOfferings',
        populate: { path: 'courseOfferings.course', select: 'courseCode courseName' }
      })
      .populate('faculty', 'name email')
      .populate('classroom', 'roomNumber building capacity')
      .populate('department', 'name code')
      .populate({ path: 'section', select: 'name sectionCode yearLevel program', populate: { path: 'program', select: 'courseCode courseName' } })
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
      .populate({
        path: 'subject',
        select: 'subjectCode subjectName units description semester courseOfferings',
        populate: { path: 'courseOfferings.course', select: 'courseCode courseName' }
      })
      .populate('faculty', 'name email program')
      .populate('classroom', 'roomNumber building capacity type facilities')
      .populate('department', 'name code')
      .populate({ path: 'section', select: 'name sectionCode yearLevel program', populate: { path: 'program', select: 'courseCode courseName' } })
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
      {
        path: 'subject',
        select: 'subjectCode subjectName units semester courseOfferings',
        populate: { path: 'courseOfferings.course', select: 'courseCode courseName' }
      },
      { path: 'faculty', select: 'name email' },
      { path: 'classroom', select: 'roomNumber building capacity' },
      { path: 'department', select: 'name code' },
      { path: 'section', select: 'name sectionCode yearLevel' }
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
      .populate({
        path: 'subject',
        select: 'subjectCode subjectName units semester courseOfferings',
        populate: { path: 'courseOfferings.course', select: 'courseCode courseName' }
      })
      .populate('faculty', 'name email')
      .populate('classroom', 'roomNumber building capacity')
      .populate('department', 'name code')
      .populate('section', 'name sectionCode yearLevel')
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
      .populate({
        path: 'subject',
        select: 'subjectCode subjectName units lectureUnits labUnits yearLevel semester courseOfferings',
        populate: { path: 'courseOfferings.course', select: 'courseCode courseName' }
      })
      .populate('faculty', 'name email')
      .populate('classroom', 'roomNumber building capacity')
      .populate('department', 'name code')
      .populate({ path: 'section', select: 'name sectionCode yearLevel program', populate: { path: 'program', select: 'courseCode courseName' } })
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
      .populate({
        path: 'subject',
        select: 'subjectCode subjectName yearLevel semester courseOfferings',
        populate: { path: 'courseOfferings.course', select: 'courseCode courseName' }
      })
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

export interface AvailableSlotsResult {
  available: ITimeSlot[];
  occupied: { slot: ITimeSlot; reasons: string[] }[];
}

function slotOverlaps(a: ITimeSlot, b: ITimeSlot): boolean {
  const aDays = a.days && a.days.length > 0 ? a.days : [a.day];
  const bDays = b.days && b.days.length > 0 ? b.days : [b.day];
  if (!aDays.some(d => bDays.includes(d))) return false;
  const toMin = (t: string) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
  return toMin(a.startTime) < toMin(b.endTime) && toMin(a.endTime) > toMin(b.startTime);
}

/**
 * Return which time slots are free for a given faculty + classroom combination.
 * Used by the manual-add schedule form to show an availability grid.
 */
export async function getAvailableSlots(params: {
  faculty: string;
  classroom: string;
  semester: string;
  academicYear: string;
  scheduleType: 'lecture' | 'laboratory';
  section?: string;
  excludeId?: string;
}): Promise<AvailableSlotsResult> {
  const { faculty, classroom, semester, academicYear, scheduleType, section, excludeId } = params;

  const orConditions: any[] = [{ faculty }, { classroom }];
  if (section) orConditions.push({ section });

  const query: any = {
    $or: orConditions,
    semester,
    academicYear,
    status: { $ne: 'archived' },
  };
  if (excludeId) query._id = { $ne: excludeId };

  const existing = await Schedule.find(query)
    .select('faculty classroom section timeSlot')
    .lean()
    .exec();

  const candidates = getTimeSlotsForScheduleType(scheduleType);
  const available: ITimeSlot[] = [];
  const occupied: { slot: ITimeSlot; reasons: string[] }[] = [];

  for (const candidate of candidates) {
    const reasons: string[] = [];

    for (const sched of existing) {
      if (!slotOverlaps(candidate, sched.timeSlot as ITimeSlot)) continue;
      if (sched.faculty?.toString() === faculty) reasons.push('Faculty busy');
      if (sched.classroom?.toString() === classroom) reasons.push('Room taken');
      if (section && sched.section?.toString() === section) reasons.push('Section busy');
    }

    const unique = [...new Set(reasons)];
    if (unique.length === 0) {
      available.push(candidate);
    } else {
      occupied.push({ slot: candidate, reasons: unique });
    }
  }

  return { available, occupied };
}


import { Schedule } from '../../models/scheduleModel';
import { Faculty } from '../../models/facultyModel';
import { Classroom } from '../../models/classroomModel';
import { ISchedule, IScheduleConflict, ITimeSlot } from '../interfaces/ISchedule';

/**
 * Advanced conflict detection system
 * Objective 2: Implement intelligent algorithms to detect and resolve conflicts
 */

/**
 * Check for time overlap between two time slots
 */
function checkTimeOverlap(slot1: ITimeSlot, slot2: ITimeSlot): boolean {
  if (slot1.day !== slot2.day) return false;
  
  const toMinutes = (time: string) => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  };
  
  const start1 = toMinutes(slot1.startTime);
  const end1 = toMinutes(slot1.endTime);
  const start2 = toMinutes(slot2.startTime);
  const end2 = toMinutes(slot2.endTime);
  
  return start1 < end2 && end1 > start2;
}

/**
 * Detect all conflicts for a proposed schedule
 */
export async function detectConflicts(scheduleData: Partial<ISchedule>): Promise<IScheduleConflict[]> {
  const conflicts: IScheduleConflict[] = [];
  
  const { faculty, classroom, timeSlot, semester, academicYear, _id, course } = scheduleData;
  
  if (!timeSlot || !semester || !academicYear) {
    return conflicts;
  }
  
  // Find all schedules in the same semester/year on the same day
  const query: any = {
    'timeSlot.day': timeSlot.day,
    semester,
    academicYear,
    status: { $ne: 'archived' }
  };
  
  if (_id) {
    query._id = { $ne: _id };
  }
  
  const existingSchedules = await Schedule.find(query)
    .populate('course', 'courseCode courseName units')
    .populate('faculty', 'name email currentLoad maxLoad')
    .populate('classroom', 'roomNumber building capacity')
    .populate('department', 'name code');
  
  // Check each existing schedule for conflicts
  for (const existing of existingSchedules) {
    const hasOverlap = checkTimeOverlap(timeSlot, existing.timeSlot);
    
    if (!hasOverlap) continue;
    
    const existingCourse = existing.course as any;
    const existingFaculty = existing.faculty as any;
    const existingClassroom = existing.classroom as any;
    
    // 1. Faculty conflict
    if (faculty && existing.faculty._id.toString() === faculty.toString()) {
      conflicts.push({
        type: 'faculty',
        severity: 'error',
        message: `Faculty ${existingFaculty.name?.first} ${existingFaculty.name?.last} is already teaching ${existingCourse.courseCode} at this time`,
        schedules: [existing._id.toString()],
        details: {
          faculty: existingFaculty,
          course: existingCourse,
          timeSlot: existing.timeSlot,
          classroom: existingClassroom
        }
      });
    }
    
    // 2. Classroom conflict
    if (classroom && existing.classroom._id.toString() === classroom.toString()) {
      conflicts.push({
        type: 'classroom',
        severity: 'error',
        message: `Room ${existingClassroom.building} - ${existingClassroom.roomNumber} is already occupied by ${existingCourse.courseCode} at this time`,
        schedules: [existing._id.toString()],
        details: {
          classroom: existingClassroom,
          course: existingCourse,
          timeSlot: existing.timeSlot,
          faculty: existingFaculty
        }
      });
    }
  }
  
  // 3. Faculty workload check (Objective 3)
  if (faculty && course) {
    const workloadConflict = await checkFacultyWorkload(
      faculty.toString(),
      course.toString(),
      semester,
      academicYear,
      _id?.toString()
    );
    if (workloadConflict) {
      conflicts.push(workloadConflict);
    }
  }
  
  // 4. Classroom capacity check
  if (classroom && course) {
    const capacityConflict = await checkClassroomCapacity(
      classroom.toString(),
      course.toString()
    );
    if (capacityConflict) {
      conflicts.push(capacityConflict);
    }
  }
  
  return conflicts;
}

/**
 * Check faculty workload constraints
 * Objective 3: Faculty workload management
 */
export async function checkFacultyWorkload(
  facultyId: string,
  courseId: string,
  semester: string,
  academicYear: string,
  excludeScheduleId?: string
): Promise<IScheduleConflict | null> {
  const faculty = await Faculty.findById(facultyId);
  if (!faculty) return null;
  
  // Get all schedules for this faculty in the semester
  const query: any = {
    faculty: facultyId,
    semester,
    academicYear,
    status: { $ne: 'archived' }
  };
  
  if (excludeScheduleId) {
    query._id = { $ne: excludeScheduleId };
  }
  
  const facultySchedules = await Schedule.find(query)
    .populate('course', 'units courseCode');
  
  // Calculate total units/hours
  let totalUnits = 0;
  const uniqueCourses = new Set<string>();
  
  for (const schedule of facultySchedules) {
    totalUnits += (schedule as any).course.units || 0;
    uniqueCourses.add(schedule.course.toString());
  }
  
  // Check against faculty limits
  const maxLoad = faculty.maxLoad || 26;
  const maxPreparations = faculty.maxPreparations || 4;
  
  // Warning if approaching max load
  if (totalUnits >= maxLoad) {
    return {
      type: 'workload',
      severity: 'error',
      message: `Faculty ${faculty.name.first} ${faculty.name.last} has reached maximum load (${totalUnits}/${maxLoad} units)`,
      schedules: facultySchedules.map(s => s._id.toString()),
      details: {
        currentLoad: totalUnits,
        maxLoad,
        preparations: uniqueCourses.size
      }
    };
  }
  
  // Warning if too many preparations
  if (uniqueCourses.size >= maxPreparations) {
    return {
      type: 'workload',
      severity: 'warning',
      message: `Faculty ${faculty.name.first} ${faculty.name.last} has ${uniqueCourses.size + 1} preparations (max: ${maxPreparations})`,
      schedules: facultySchedules.map(s => s._id.toString()),
      details: {
        currentPreparations: uniqueCourses.size,
        maxPreparations
      }
    };
  }
  
  return null;
}

/**
 * Check if classroom capacity is sufficient
 */
export async function checkClassroomCapacity(
  classroomId: string,
  courseId: string
): Promise<IScheduleConflict | null> {
  const classroom = await Classroom.findById(classroomId);
  if (!classroom) return null;
  
  // Typical class sizes (can be made configurable)
  const typicalClassSize = 40;
  
  if (classroom.capacity < typicalClassSize * 0.8) {
    return {
      type: 'classroom',
      severity: 'warning',
      message: `Room ${classroom.building} - ${classroom.roomNumber} may be too small (capacity: ${classroom.capacity})`,
      schedules: [],
      details: {
        capacity: classroom.capacity,
        recommended: typicalClassSize
      }
    };
  }
  
  return null;
}

/**
 * Get standard time slots (configurable)
 */
export function getStandardTimeSlots(): ITimeSlot[] {
  const days: ITimeSlot['day'][] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
  const slots: ITimeSlot[] = [];
  
  const timeRanges = [
    { start: '07:00', end: '08:30' },
    { start: '08:30', end: '10:00' },
    { start: '10:00', end: '11:30' },
    { start: '11:30', end: '13:00' },
    { start: '13:00', end: '14:30' },
    { start: '14:30', end: '16:00' },
    { start: '16:00', end: '17:30' },
    { start: '17:30', end: '19:00' },
  ];
  
  for (const day of days) {
    for (const range of timeRanges) {
      slots.push({
        day,
        startTime: range.start,
        endTime: range.end
      });
    }
  }
  
  return slots;
}


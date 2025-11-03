import { Schedule } from '../../models/scheduleModel';
import { Subject } from '../../models/subjectModel';
import { Faculty } from '../../models/facultyModel';
import { Classroom } from '../../models/classroomModel';
import { detectConflicts, getStandardTimeSlots } from './conflictDetector';
import {
  ISchedule,
  IScheduleConstraints,
  IScheduleGenerationResult,
  ITimeSlot,
  IScheduleConflict
} from '../interfaces/ISchedule';
import { ScheduleGenerationInput } from '../validators/scheduleValidator';

/**
 * Automated Schedule Generator
 * Objectives 1 & 2: Design and develop automated system with intelligent algorithms
 */

/**
 * Get subjects to schedule
 */
async function getSubjectsToSchedule(
  departments?: string[],
  subjects?: string[],
  courses?: string[]
): Promise<any[]> {
  const query: any = {};

  if (subjects && subjects.length > 0) {
    query._id = { $in: subjects };
  } else {
    if (courses && courses.length > 0) {
      query.course = { $in: courses };
    }
    if (departments && departments.length > 0) {
      query.department = { $in: departments };
    }
  }

  return await Subject.find(query)
    .populate({
      path: 'course',
      select: 'courseCode courseName department',
      populate: {
        path: 'department',
        select: 'name code'
      }
    })
    .populate('department', 'name code');
}

/**
 * Get available faculty
 */
async function getAvailableFaculty(departments?: string[]): Promise<any[]> {
  const query: any = { status: 'active' };

  if (departments && departments.length > 0) {
    query.department = { $in: departments };
  }

  return await Faculty.find(query).populate('department', 'name code');
}

/**
 * Get available classrooms
 */
async function getAvailableClassrooms(): Promise<any[]> {
  return await Classroom.find({ status: 'available' });
}

/**
 * Update faculty current load
 */
async function updateFacultyLoad(facultyId: string, units: number): Promise<void> {
  await Faculty.findByIdAndUpdate(facultyId, {
    $inc: { currentLoad: units, currentPreparations: 1 }
  });
}

/**
 * Find suitable faculty for a subject
 * Objective 3: Consider availability, workload, and preferences
 */
async function findSuitableFaculty(
  subject: any,
  availableFaculty: any[],
  semester: string,
  academicYear: string,
  constraints: IScheduleConstraints
): Promise<any[]> {
  const suitable: any[] = [];

  for (const faculty of availableFaculty) {
    // Check if faculty belongs to same department
    if (subject.department && faculty.department.toString() !== subject.department.toString()) {
      continue;
    }

    // Get faculty's current schedules
    const facultySchedules = await Schedule.find({
      faculty: faculty._id,
      semester,
      academicYear,
      status: { $ne: 'archived' }
    }).populate('subject', 'units');

    // Calculate current load
    let currentUnits = 0;
    const uniqueSubjects = new Set();

    for (const schedule of facultySchedules) {
      currentUnits += (schedule as any).subject?.units || 0;
      uniqueSubjects.add(schedule.subject.toString());
    }

    // Check workload constraints
    const maxLoad = constraints.maxHoursPerWeek || faculty.maxLoad || 26;
    const maxPreparations = constraints.maxPreparations || faculty.maxPreparations || 4;

    // Check if adding this subject would exceed limits
    if (currentUnits + subject.units <= maxLoad && uniqueSubjects.size < maxPreparations) {
      suitable.push({
        ...faculty.toObject(),
        currentLoad: currentUnits,
        preparations: uniqueSubjects.size,
        // Priority: lower load = higher priority (for fair distribution)
        priority: maxLoad - currentUnits
      });
    }
  }

  // Sort by priority (faculty with lower load gets priority)
  return suitable.sort((a, b) => b.priority - a.priority);
}

/**
 * Find suitable classrooms for a subject
 * Objective 1: Consider capacity and facilities
 */
function findSuitableClassrooms(
  subject: any,
  availableClassrooms: any[],
  constraints: IScheduleConstraints
): any[] {
  const minCapacity = constraints.minimumCapacity || 30;
  const requiredFacilities = constraints.requiredFacilities || [];

  return availableClassrooms.filter(classroom => {
    // Check capacity
    if (classroom.capacity < minCapacity) {
      return false;
    }

    // Check status
    if (classroom.status !== 'available') {
      return false;
    }

    // Check required facilities
    if (requiredFacilities.length > 0) {
      const hasAllFacilities = requiredFacilities.every(
        facility => classroom.facilities?.includes(facility)
      );
      if (!hasAllFacilities) {
        return false;
      }
    }

    // Check room type matching for laboratory subjects
    if (subject.isLaboratory && classroom.type !== 'laboratory' && classroom.type !== 'computer-lab') {
      return false;
    }

    return true;
  }).sort((a, b) => {
    // Prefer rooms with capacity closer to requirement
    const diffA = Math.abs(a.capacity - minCapacity);
    const diffB = Math.abs(b.capacity - minCapacity);
    return diffA - diffB;
  });
}

/**
 * Find best faculty-classroom-time assignment
 * Objective 2: Intelligent algorithm to minimize conflicts
 */
async function findBestAssignment(
  subject: any,
  suitableFaculty: any[],
  suitableClassrooms: any[],
  timeSlots: ITimeSlot[],
  semester: string,
  academicYear: string
): Promise<{ faculty: any; classroom: any; timeSlot: ITimeSlot } | null> {

  // Try different combinations to find conflict-free assignment
  for (const faculty of suitableFaculty) {
    for (const classroom of suitableClassrooms) {
      for (const timeSlot of timeSlots) {
        // Check for conflicts
        const testSchedule = {
          subject: subject._id,
          faculty: faculty._id,
          classroom: classroom._id,
          timeSlot,
          semester,
          academicYear
        };

        const conflicts = await detectConflicts(testSchedule);

        // If no conflicts, we found a good assignment
        if (conflicts.length === 0) {
          return { faculty, classroom, timeSlot };
        }
      }
    }
  }

  return null;
}

/**
 * Generate schedule for a single subject
 * Uses intelligent algorithm to find best fit
 */
async function generateSubjectSchedule(
  subject: any,
  availableFaculty: any[],
  availableClassrooms: any[],
  timeSlots: ITimeSlot[],
  semester: string,
  academicYear: string,
  constraints: IScheduleConstraints
): Promise<ISchedule | null> {

  // 1. Find suitable faculty (Objective 3: Fair distribution)
  const suitableFaculty = await findSuitableFaculty(
    subject,
    availableFaculty,
    semester,
    academicYear,
    constraints
  );

  if (suitableFaculty.length === 0) {
    throw new Error(`No suitable faculty found for subject ${subject.subjectCode}`);
  }

  // 2. Find suitable classroom
  const suitableClassrooms = findSuitableClassrooms(
    subject,
    availableClassrooms,
    constraints
  );

  if (suitableClassrooms.length === 0) {
    throw new Error(`No suitable classroom found for subject ${subject.subjectCode}`);
  }

  // 3. Find best time slot (Objective 2: Conflict resolution)
  const bestAssignment = await findBestAssignment(
    subject,
    suitableFaculty,
    suitableClassrooms,
    timeSlots,
    semester,
    academicYear
  );

  if (!bestAssignment) {
    return null;
  }

  // 4. Create and save the schedule
  // Get department from subject or fallback to course's department
  const departmentId = subject.department?._id || subject.department ||
                       subject.course?.department?._id || subject.course?.department;

  if (!departmentId) {
    throw new Error(`No department found for subject ${subject.subjectCode}. Please assign a department to the subject or its course.`);
  }

  const schedule = new Schedule({
    subject: subject._id,
    faculty: bestAssignment.faculty._id,
    classroom: bestAssignment.classroom._id,
    department: departmentId,
    timeSlot: bestAssignment.timeSlot,
    semester,
    academicYear,
    yearLevel: subject.yearLevel,
    status: 'draft',
    isGenerated: true
  });

  await schedule.save();

  // 5. Update faculty current load
  await updateFacultyLoad(bestAssignment.faculty._id, subject.units);

  return JSON.parse(JSON.stringify(schedule)) as ISchedule;
}

/**
 * Calculate generation statistics
 * Objective 4: Evaluate effectiveness
 */
async function calculateStatistics(
  schedules: ISchedule[],
  faculty: any[],
  classrooms: any[]
): Promise<any> {
  const byDepartment: Record<string, number> = {};
  const byFaculty: Record<string, number> = {};
  const byClassroom: Record<string, number> = {};

  for (const schedule of schedules) {
    const dept = schedule.department?.toString() || 'unknown';
    const fac = schedule.faculty?.toString() || 'unknown';
    const room = schedule.classroom?.toString() || 'unknown';

    byDepartment[dept] = (byDepartment[dept] || 0) + 1;
    byFaculty[fac] = (byFaculty[fac] || 0) + 1;
    byClassroom[room] = (byClassroom[room] || 0) + 1;
  }

  // Calculate classroom utilization
  const utilizationRates: any[] = [];
  for (const classroom of classrooms) {
    const scheduleCount = byClassroom[classroom._id.toString()] || 0;
    // Assume 5 days, 8 hours per day = 40 possible time slots
    const utilization = (scheduleCount / 40) * 100;
    utilizationRates.push({
      classroom: classroom.roomNumber,
      building: classroom.building,
      utilization: Math.round(utilization * 100) / 100
    });
  }

  return {
    totalSchedules: schedules.length,
    byDepartment,
    byFaculty,
    utilizationRates,
    averageUtilization: utilizationRates.reduce((sum, r) => sum + r.utilization, 0) / utilizationRates.length || 0
  };
}

/**
 * Main schedule generation function
 * Implements all 4 project objectives
 */
export async function generateSchedules(request: ScheduleGenerationInput): Promise<IScheduleGenerationResult> {
  try {
    const {
      semester,
      academicYear,
      departments,
      courses,
      subjects,
      constraints = {}
    } = request;

    // Get data
    const subjectsToSchedule = await getSubjectsToSchedule(departments, subjects, courses);
    const availableFaculty = await getAvailableFaculty(departments);
    const availableClassrooms = await getAvailableClassrooms();
    const timeSlots = getStandardTimeSlots();

    if (subjectsToSchedule.length === 0) {
      throw new Error('No subjects found to schedule');
    }

    if (availableFaculty.length === 0) {
      throw new Error('No available faculty found');
    }

    if (availableClassrooms.length === 0) {
      throw new Error('No available classrooms found');
    }

    const generatedSchedules: ISchedule[] = [];
    const failedSubjects: Array<{ subject: any; reason: string }> = [];
    const conflicts: IScheduleConflict[] = [];

    // Generate schedule for each subject
    for (const subject of subjectsToSchedule) {
      try {
        const schedule = await generateSubjectSchedule(
          subject,
          availableFaculty,
          availableClassrooms,
          timeSlots,
          semester,
          academicYear,
          constraints
        );

        if (schedule) {
          generatedSchedules.push(schedule);
        } else {
          failedSubjects.push({
            subject,
            reason: 'No conflict-free time slot found'
          });
        }
      } catch (error) {
        failedSubjects.push({
          subject,
          reason: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    // Calculate statistics
    const statistics = await calculateStatistics(
      generatedSchedules,
      availableFaculty,
      availableClassrooms
    );

    return {
      success: true,
      message: `Successfully generated ${generatedSchedules.length} out of ${subjectsToSchedule.length} schedules`,
      schedules: generatedSchedules,
      statistics,
      conflicts,
      failedSubjects: failedSubjects.map(f => ({
        subjectCode: f.subject.subjectCode,
        subjectName: f.subject.subjectName,
        reason: f.reason
      }))
    };

  } catch (error) {
    console.error('Error in generateSchedules:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to generate schedules',
      schedules: [],
      conflicts: [],
      failedSubjects: []
    };
  }
}


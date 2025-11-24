import { Schedule } from '../../models/scheduleModel.js';
import { Subject } from '../../models/subjectModel.js';
import { Faculty } from '../../models/facultyModel.js';
import { Classroom } from '../../models/classroomModel.js';
import { detectConflicts } from './conflictDetector.js';
import {
  ISchedule,
  IScheduleConstraints,
  IScheduleGenerationResult,
  ITimeSlot,
  IScheduleConflict
} from '../interfaces/ISchedule.js';
import { ScheduleGenerationInput } from '../validators/scheduleValidator.js';
import {
  calculateLectureHours,
  calculateLabHours
} from './teachingHoursCalculator.js';
import {
  generateLectureTimeSlots,
  generateLabTimeSlots
} from './timeSlotPatterns.js';

/**
 * Automated Schedule Generator
 * Objectives 1 & 2: Design and develop automated system with intelligent algorithms
 */

/**
 * Get subjects to schedule
 * Filters by semester to only get subjects for the requested term
 */
async function getSubjectsToSchedule(
  semester: string,
  departments?: string[],
  subjects?: string[],
  courses?: string[]
): Promise<any[]> {
  const query: any = {};

  // IMPORTANT: Filter by semester
  query.semester = semester;

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
 * Now uses teaching hours instead of units
 */
async function updateFacultyLoad(facultyId: string, teachingHours: number): Promise<void> {
  await Faculty.findByIdAndUpdate(facultyId, {
    $inc: { currentLoad: teachingHours, currentPreparations: 1 }
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
    }).populate('subject', 'lectureUnits labUnits');

    // Calculate current load in teaching hours
    let currentHours = 0;
    const uniqueSubjects = new Set();

    for (const schedule of facultySchedules) {
      const subjectData = (schedule as any).subject;
      if (subjectData) {
        const scheduleType = (schedule as any).scheduleType;
        if (scheduleType === 'lecture') {
          currentHours += calculateLectureHours(subjectData.lectureUnits || 0);
        } else if (scheduleType === 'laboratory') {
          currentHours += calculateLabHours(subjectData.labUnits || 0);
        }
        uniqueSubjects.add(schedule.subject.toString());
      }
    }

    // Check workload constraints (now in hours, not units)
    const maxLoad = constraints.maxHoursPerWeek || faculty.maxLoad || 26;
    const maxPreparations = constraints.maxPreparations || faculty.maxPreparations || 4;

    // Calculate teaching hours for this subject component
    const subjectHours = subject.lectureUnits ? calculateLectureHours(subject.lectureUnits) : 0;
    const labHours = subject.labUnits ? calculateLabHours(subject.labUnits) : 0;
    const totalSubjectHours = subjectHours + labHours;

    // Check if adding this subject would exceed limits
    if (currentHours + totalSubjectHours <= maxLoad && uniqueSubjects.size < maxPreparations) {
      suitable.push({
        ...faculty.toObject(),
        currentLoad: currentHours,
        preparations: uniqueSubjects.size,
        // Priority: lower load = higher priority (for fair distribution)
        priority: maxLoad - currentHours
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
  constraints: IScheduleConstraints,
  scheduleType: 'lecture' | 'laboratory' = 'lecture'
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

    // Check room type matching based on schedule type
    if (scheduleType === 'laboratory') {
      // Laboratory schedules MUST use laboratory or computer-lab rooms
      if (classroom.type !== 'laboratory' && classroom.type !== 'computer-lab') {
        return false;
      }
    }
    // For lectures, allow any room (they can use lecture rooms, conference rooms, etc.)
    // Don't filter out any rooms for lectures

    return true;
  }).sort((a, b) => {
    // For labs: prefer lab rooms
    // For lectures: prefer lecture/conference rooms over labs
    if (scheduleType === 'laboratory') {
      // Prefer actual labs over computer labs
      const aScore = a.type === 'laboratory' ? 2 : (a.type === 'computer-lab' ? 1 : 0);
      const bScore = b.type === 'laboratory' ? 2 : (b.type === 'computer-lab' ? 1 : 0);
      if (aScore !== bScore) return bScore - aScore;
    } else {
      // Prefer lecture/conference rooms for lectures
      const aScore = a.type === 'lecture' ? 3 : (a.type === 'conference' ? 2 : (a.type === 'computer-lab' ? 1 : 0));
      const bScore = b.type === 'lecture' ? 3 : (b.type === 'conference' ? 2 : (b.type === 'computer-lab' ? 1 : 0));
      if (aScore !== bScore) return bScore - aScore;
    }

    // Then prefer rooms with capacity closer to requirement
    const diffA = Math.abs(a.capacity - minCapacity);
    const diffB = Math.abs(b.capacity - minCapacity);
    return diffA - diffB;
  });
}

/**
 * Find best faculty-classroom-time assignment pattern
 * Objective 2: Intelligent algorithm to minimize conflicts
 * Returns a pattern of time slots (e.g., MW at 8:00-9:00) instead of a single slot
 */
async function findBestAssignmentPattern(
  subject: any,
  suitableFaculty: any[],
  suitableClassrooms: any[],
  timeSlots: ITimeSlot[],
  semester: string,
  academicYear: string,
  scheduleType: 'lecture' | 'laboratory' = 'lecture'
): Promise<{ faculty: any; classroom: any; timeSlots: ITimeSlot[] } | null> {

  // Time slots now come with days arrays already set (e.g., ['monday', 'wednesday'])
  // So we don't need to reconstruct patterns - just use them directly

  let attemptCount = 0;
  let conflictCount = 0;

  for (const faculty of suitableFaculty) {
    for (const classroom of suitableClassrooms) {
      // Try each time slot pattern
      for (const timeSlot of timeSlots) {
        attemptCount++;

        // Check for conflicts on this pattern
        const testSchedule = {
          subject: subject._id,
          faculty: faculty._id,
          classroom: classroom._id,
          timeSlot, // This already has days array
          scheduleType,
          semester,
          academicYear
        };

        const conflicts = await detectConflicts(testSchedule);

        if (conflicts.length > 0) {
          conflictCount++;

          // Log first conflict for debugging
          if (attemptCount === 1) {
            const days = timeSlot.days?.join(', ') || timeSlot.day;
            console.log(`     DEBUG: First attempt conflict on ${days} ${timeSlot.startTime}:`);
            conflicts.forEach(c => console.log(`       - ${c.type}: ${c.message}`));
          }
          continue; // Try next slot
        }

        // No conflicts found! Return this assignment
        console.log(`     ✓ SUCCESS! Found conflict-free slot after ${attemptCount} attempts`);
        if (conflictCount > 0) {
          console.log(`       (${conflictCount} combinations had conflicts before this one)`);
        }

        // Return the slot as an array for compatibility with existing code
        return { faculty, classroom, timeSlots: [timeSlot] };
      }
    }
  }

  console.log(`     ✗ Tried ${attemptCount} combinations, all had conflicts (faculty: ${suitableFaculty.length}, rooms: ${suitableClassrooms.length})`);
  return null;

  return null;
}

/**
 * Generate schedule for a single subject component (lecture or lab)
 * Uses intelligent algorithm to find best fit
 * Returns array of schedules because subjects meet on multiple days
 */
async function generateScheduleComponent(
  subject: any,
  availableFaculty: any[],
  availableClassrooms: any[],
  timeSlots: ITimeSlot[],
  semester: string,
  academicYear: string,
  constraints: IScheduleConstraints,
  scheduleType: 'lecture' | 'laboratory',
  units: number
): Promise<ISchedule[]> {

  // 1. Find suitable faculty (Objective 3: Fair distribution)
  const suitableFaculty = await findSuitableFaculty(
    subject,
    availableFaculty,
    semester,
    academicYear,
    constraints
  );

  console.log(`Found ${suitableFaculty.length} suitable faculty`);
  if (suitableFaculty.length === 0) {
    throw new Error(`No suitable faculty found for ${scheduleType} of subject ${subject.subjectCode}`);
  }

  // 2. Find suitable classroom based on schedule type
  const suitableClassrooms = findSuitableClassrooms(
    subject,
    availableClassrooms,
    constraints,
    scheduleType
  );

  console.log(`     Found ${suitableClassrooms.length} suitable ${scheduleType} classrooms`);
  if (suitableClassrooms.length === 0) {
    throw new Error(`No suitable ${scheduleType} classroom found for subject ${subject.subjectCode}`);
  }

  // 3. Find best time slot pattern (e.g., MW, TTh) - returns multiple time slots
  const bestAssignment = await findBestAssignmentPattern(
    subject,
    suitableFaculty,
    suitableClassrooms,
    timeSlots,
    semester,
    academicYear,
    scheduleType
  );

  if (!bestAssignment) {
    console.log(`     ✗ No conflict-free time slot found`);
    return [];
  }

  const patternSlot = bestAssignment.timeSlots[0];
  const daysDisplay = patternSlot.days?.join(', ') || patternSlot.day;
  console.log(`     ✓ Found conflict-free assignment: ${daysDisplay} at ${patternSlot.startTime}`);

  // 4. Create and save ONE schedule with the pattern
  // Get department from subject or fallback to course's department
  const departmentId = subject.department?._id || subject.department ||
                       subject.course?.department?._id || subject.course?.department;

  if (!departmentId) {
    throw new Error(`No department found for subject ${subject.subjectCode}. Please assign a department to the subject or its course.`);
  }

  // The slot already has days array sorted properly from timeSlotPatterns
  const schedule = new Schedule({
    subject: subject._id,
    faculty: bestAssignment.faculty._id,
    classroom: bestAssignment.classroom._id,
    department: departmentId,
    timeSlot: {
      day: patternSlot.day, // First day for backward compatibility
      days: patternSlot.days, // Array of days in pattern (already sorted)
      startTime: patternSlot.startTime,
      endTime: patternSlot.endTime
    },
    scheduleType,
    semester,
    academicYear,
    yearLevel: subject.yearLevel,
    status: 'draft',
    isGenerated: true
  });

  await schedule.save();

  // 5. Update faculty current load ONCE (convert units to teaching hours based on type)
  const teachingHours = scheduleType === 'lecture'
    ? calculateLectureHours(units)
    : calculateLabHours(units);
  await updateFacultyLoad(bestAssignment.faculty._id, teachingHours);

  return [JSON.parse(JSON.stringify(schedule)) as ISchedule];
}

/**
 * Generate schedule for a single subject (may create lecture and/or lab schedules)
 * Uses intelligent algorithm to find best fit
 */
async function generateSubjectSchedule(
  subject: any,
  availableFaculty: any[],
  availableClassrooms: any[],
  semester: string,
  academicYear: string,
  constraints: IScheduleConstraints
): Promise<ISchedule[]> {
  const schedules: ISchedule[] = [];

  // Generate lecture schedule if subject has lecture units
  // Lectures use MW, MF, or WF patterns with 1 hour sessions per day
  // Example: 2 lecture units = 2 hours total = 1 hour M + 1 hour W
  if (subject.lectureUnits && subject.lectureUnits > 0) {
    console.log(`  → Generating LECTURE schedule for ${subject.subjectCode} (${subject.lectureUnits} units)`);
    const lectureTimeSlots = generateLectureTimeSlots();
    console.log(`     Available lecture time slots: ${lectureTimeSlots.length}`);

    try {
      const lectureSchedules = await generateScheduleComponent(
        subject,
        availableFaculty,
        availableClassrooms,
        lectureTimeSlots,
        semester,
        academicYear,
        constraints,
        'lecture',
        subject.lectureUnits
      );

      if (lectureSchedules && lectureSchedules.length > 0) {
        console.log(`     ✓ Successfully generated ${lectureSchedules.length} lecture schedule(s)`);
        schedules.push(...lectureSchedules);
      } else {
        console.log(`     ✗ No lecture schedule generated (no conflicts found but no slots assigned)`);
      }
    } catch (error) {
      console.log(`     ✗ Failed to generate lecture schedule: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Generate laboratory schedule if subject has lab units
  // Labs use TTh pattern with 1.5 hour sessions
  if (subject.labUnits && subject.labUnits > 0) {
    console.log(`  → Generating LAB schedule for ${subject.subjectCode} (${subject.labUnits} units)`);
    const labTimeSlots = generateLabTimeSlots();
    console.log(`     Available lab time slots: ${labTimeSlots.length}`);

    try {
      const labSchedules = await generateScheduleComponent(
        subject,
        availableFaculty,
        availableClassrooms,
        labTimeSlots,
        semester,
        academicYear,
        constraints,
        'laboratory',
        subject.labUnits
      );

      if (labSchedules && labSchedules.length > 0) {
        console.log(`     ✓ Successfully generated ${labSchedules.length} lab schedule(s)`);
        schedules.push(...labSchedules);
      } else {
        console.log(`     ✗ No lab schedule generated (no conflicts found but no slots assigned)`);
      }
    } catch (error) {
      console.log(`     ✗ Failed to generate lab schedule: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  return schedules;
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
    const subjectsToSchedule = await getSubjectsToSchedule(semester, departments, subjects, courses);
    const availableFaculty = await getAvailableFaculty(departments);
    const availableClassrooms = await getAvailableClassrooms();

    if (subjectsToSchedule.length === 0) {
      throw new Error(`No subjects found to schedule for ${semester}. Please ensure subjects are assigned to this semester.`);
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
        const schedules = await generateSubjectSchedule(
          subject,
          availableFaculty,
          availableClassrooms,
          semester,
          academicYear,
          constraints
        );

        if (schedules && schedules.length > 0) {
          generatedSchedules.push(...schedules);
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


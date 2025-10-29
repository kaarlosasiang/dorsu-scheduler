import { Schedule } from '../../models/scheduleModel';
import { Course } from '../../models/courseModel';
import { Faculty } from '../../models/facultyModel';
import { Classroom } from '../../models/classroomModel';
import { detectConflicts, getStandardTimeSlots } from './conflictDetector';
import {
  ISchedule,
  IScheduleConstraints,
  IScheduleGenerationRequest,
  IScheduleGenerationResult,
  ITimeSlot,
  IScheduleConflict
} from '../interfaces/ISchedule';

/**
 * Automated Schedule Generator
 * Objectives 1 & 2: Design and develop automated system with intelligent algorithms
 */

/**
 * Get courses to schedule
 */
async function getCoursesToSchedule(
  departments?: string[],
  courses?: string[]
): Promise<any[]> {
  const query: any = {};
  
  if (courses && courses.length > 0) {
    query._id = { $in: courses };
  } else if (departments && departments.length > 0) {
    query.department = { $in: departments };
  }
  
  return await Course.find(query).populate('department', 'name code');
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
 * Find suitable faculty for a course
 * Objective 3: Consider availability, workload, and preferences
 */
async function findSuitableFaculty(
  course: any,
  availableFaculty: any[],
  semester: string,
  academicYear: string,
  constraints: IScheduleConstraints
): Promise<any[]> {
  const suitable: any[] = [];
  
  for (const faculty of availableFaculty) {
    // Check if faculty belongs to same department
    if (course.department && faculty.department.toString() !== course.department.toString()) {
      continue;
    }
    
    // Get faculty's current schedules
    const facultySchedules = await Schedule.find({
      faculty: faculty._id,
      semester,
      academicYear,
      status: { $ne: 'archived' }
    }).populate('course', 'units');
    
    // Calculate current load
    let currentUnits = 0;
    const uniqueCourses = new Set();
    
    for (const schedule of facultySchedules) {
      currentUnits += (schedule as any).course?.units || 0;
      uniqueCourses.add(schedule.course.toString());
    }
    
    // Check workload constraints
    const maxLoad = constraints.maxHoursPerWeek || faculty.maxLoad || 26;
    const maxPreparations = constraints.maxPreparations || faculty.maxPreparations || 4;
    
    // Check if adding this course would exceed limits
    if (currentUnits + course.units <= maxLoad && uniqueCourses.size < maxPreparations) {
      suitable.push({
        ...faculty.toObject(),
        currentLoad: currentUnits,
        preparations: uniqueCourses.size,
        // Priority: lower load = higher priority (for fair distribution)
        priority: maxLoad - currentUnits
      });
    }
  }
  
  // Sort by priority (faculty with lower load gets priority)
  return suitable.sort((a, b) => b.priority - a.priority);
}

/**
 * Find suitable classrooms for a course
 * Objective 1: Consider capacity and facilities
 */
function findSuitableClassrooms(
  course: any,
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
    
    // Check room type matching
    if (course.requiresLab && classroom.type !== 'laboratory' && classroom.type !== 'computer-lab') {
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
  course: any,
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
          course: course._id,
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
 * Generate schedule for a single course
 * Uses intelligent algorithm to find best fit
 */
async function generateCourseSchedule(
  course: any,
  availableFaculty: any[],
  availableClassrooms: any[],
  timeSlots: ITimeSlot[],
  semester: string,
  academicYear: string,
  constraints: IScheduleConstraints
): Promise<ISchedule | null> {
  
  // 1. Find suitable faculty (Objective 3: Fair distribution)
  const suitableFaculty = await findSuitableFaculty(
    course,
    availableFaculty,
    semester,
    academicYear,
    constraints
  );
  
  if (suitableFaculty.length === 0) {
    throw new Error('No suitable faculty found');
  }
  
  // 2. Find suitable classroom
  const suitableClassrooms = findSuitableClassrooms(
    course,
    availableClassrooms,
    constraints
  );
  
  if (suitableClassrooms.length === 0) {
    throw new Error('No suitable classroom found');
  }
  
  // 3. Find best time slot (Objective 2: Conflict resolution)
  const bestAssignment = await findBestAssignment(
    course,
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
  const schedule = new Schedule({
    course: course._id,
    faculty: bestAssignment.faculty._id,
    classroom: bestAssignment.classroom._id,
    department: course.department,
    timeSlot: bestAssignment.timeSlot,
    semester,
    academicYear,
    status: 'draft',
    isGenerated: true
  });
  
  await schedule.save();
  
  // 5. Update faculty current load
  await updateFacultyLoad(bestAssignment.faculty._id, course.units);
  
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
  
  for (const schedule of schedules) {
    // Count by department
    const deptId = schedule.department?.toString() || 'unknown';
    byDepartment[deptId] = (byDepartment[deptId] || 0) + 1;
    
    // Count by faculty
    const facId = schedule.faculty?.toString() || 'unknown';
    byFaculty[facId] = (byFaculty[facId] || 0) + 1;
  }
  
  // Calculate room utilization
  const totalTimeSlots = getStandardTimeSlots().length;
  const usedSlots = schedules.length;
  const roomUtilization = classrooms.length > 0
    ? (usedSlots / (classrooms.length * totalTimeSlots)) * 100
    : 0;
  
  // Calculate faculty utilization
  const facultyUtilization = faculty.length > 0
    ? (Object.keys(byFaculty).length / faculty.length) * 100
    : 0;
  
  return {
    totalSchedules: schedules.length,
    byDepartment,
    byFaculty,
    roomUtilization: Math.round(roomUtilization * 100) / 100,
    facultyUtilization: Math.round(facultyUtilization * 100) / 100
  };
}

/**
 * Main generation method
 * Objective 1: Generate course schedules based on constraints
 */
export async function generateSchedules(
  request: IScheduleGenerationRequest
): Promise<IScheduleGenerationResult> {
  const {
    semester,
    academicYear,
    departments,
    courses: requestedCourses,
    constraints = {},
    overwriteExisting = false
  } = request;
  
  const generatedSchedules: ISchedule[] = [];
  const conflicts: IScheduleConflict[] = [];
  let failedCount = 0;
  
  try {
    // 1. Delete existing schedules if overwrite is enabled
    if (overwriteExisting) {
      await Schedule.deleteMany({ semester, academicYear, isGenerated: true });
    }
    
    // 2. Get courses to schedule
    const coursesToSchedule = await getCoursesToSchedule(
      departments,
      requestedCourses
    );
    
    if (coursesToSchedule.length === 0) {
      return {
        success: false,
        message: 'No courses found to schedule',
        generated: 0,
        failed: 0,
        conflicts: []
      };
    }
    
    // 3. Get available resources
    const availableFaculty = await getAvailableFaculty(departments);
    const availableClassrooms = await getAvailableClassrooms();
    const timeSlots = getStandardTimeSlots();
    
    // 4. Generate schedules using intelligent algorithm
    for (const course of coursesToSchedule) {
      try {
        const schedule = await generateCourseSchedule(
          course,
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
          failedCount++;
          conflicts.push({
            type: 'time',
            severity: 'error',
            message: `Could not find suitable time slot for ${course.courseCode}`,
            schedules: [],
            details: { course }
          });
        }
      } catch (error) {
        failedCount++;
        conflicts.push({
          type: 'time',
          severity: 'error',
          message: `Failed to schedule ${course.courseCode}: ${error instanceof Error ? error.message : 'Unknown error'}`,
          schedules: [],
          details: { course }
        });
      }
    }
    
    // 5. Calculate statistics
    const statistics = await calculateStatistics(
      generatedSchedules,
      availableFaculty,
      availableClassrooms
    );
    
    return {
      success: true,
      message: `Successfully generated ${generatedSchedules.length} schedules`,
      generated: generatedSchedules.length,
      failed: failedCount,
      conflicts,
      schedules: generatedSchedules,
      statistics
    };
    
  } catch (error) {
    return {
      success: false,
      message: `Failed to generate schedules: ${error instanceof Error ? error.message : 'Unknown error'}`,
      generated: generatedSchedules.length,
      failed: failedCount,
      conflicts
    };
  }
}


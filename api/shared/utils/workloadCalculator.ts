import { Schedule } from '../../models/scheduleModel.js';
import { calculateLectureHours, calculateLabHours } from './teachingHoursCalculator.js';

/**
 * Faculty Workload Calculator
 * Calculates teaching hours based on lecture/lab unit ratios
 * - Lecture: 1 unit = 1 hour
 * - Lab: 1 unit = 1.333... hours (or 0.75 units = 1 hour)
 */

export interface FacultyWorkload {
  facultyId: string;
  facultyName?: string;
  totalTeachingHours: number;
  lectureHours: number;
  labHours: number;
  totalUnits: number;
  lectureUnits: number;
  labUnits: number;
  preparations: number;
  scheduleCount: number;
  subjectBreakdown: Array<{
    subjectCode: string;
    subjectName: string;
    scheduleType: 'lecture' | 'laboratory';
    units: number;
    teachingHours: number;
  }>;
}

/**
 * Calculate workload for a specific faculty member
 */
export async function calculateFacultyWorkload(
  facultyId: string,
  semester: string,
  academicYear: string
): Promise<FacultyWorkload> {
  const schedules = await Schedule.find({
    faculty: facultyId,
    semester,
    academicYear,
    status: { $ne: 'archived' }
  })
    .populate('subject', 'subjectCode subjectName lectureUnits labUnits')
    .populate('faculty', 'name')
    .exec();

  let totalLectureHours = 0;
  let totalLabHours = 0;
  let totalLectureUnits = 0;
  let totalLabUnits = 0;
  const uniqueSubjects = new Set<string>();
  const subjectBreakdown: any[] = [];

  for (const schedule of schedules) {
    const subject = (schedule as any).subject;
    const scheduleType = (schedule as any).scheduleType || 'lecture';

    if (subject) {
      uniqueSubjects.add(subject._id.toString());

      if (scheduleType === 'lecture' && subject.lectureUnits) {
        const hours = calculateLectureHours(subject.lectureUnits);
        totalLectureHours += hours;
        totalLectureUnits += subject.lectureUnits;

        subjectBreakdown.push({
          subjectCode: subject.subjectCode,
          subjectName: subject.subjectName,
          scheduleType: 'lecture',
          units: subject.lectureUnits,
          teachingHours: hours
        });
      } else if (scheduleType === 'laboratory' && subject.labUnits) {
        const hours = calculateLabHours(subject.labUnits);
        totalLabHours += hours;
        totalLabUnits += subject.labUnits;

        subjectBreakdown.push({
          subjectCode: subject.subjectCode,
          subjectName: subject.subjectName,
          scheduleType: 'laboratory',
          units: subject.labUnits,
          teachingHours: hours
        });
      }
    }
  }

  const faculty = schedules.length > 0 ? (schedules[0] as any).faculty : null;

  return {
    facultyId,
    facultyName: faculty?.name || 'Unknown',
    totalTeachingHours: totalLectureHours + totalLabHours,
    lectureHours: totalLectureHours,
    labHours: totalLabHours,
    totalUnits: totalLectureUnits + totalLabUnits,
    lectureUnits: totalLectureUnits,
    labUnits: totalLabUnits,
    preparations: uniqueSubjects.size,
    scheduleCount: schedules.length,
    subjectBreakdown
  };
}

/**
 * Calculate workload for all faculty in a department
 */
export async function calculateDepartmentWorkload(
  departmentId: string,
  semester: string,
  academicYear: string
): Promise<FacultyWorkload[]> {
  const schedules = await Schedule.find({
    department: departmentId,
    semester,
    academicYear,
    status: { $ne: 'archived' }
  })
    .populate('subject', 'subjectCode subjectName lectureUnits labUnits')
    .populate('faculty', 'name')
    .exec();

  const facultyMap = new Map<string, any[]>();

  // Group schedules by faculty
  for (const schedule of schedules) {
    const facultyId = (schedule as any).faculty._id.toString();
    if (!facultyMap.has(facultyId)) {
      facultyMap.set(facultyId, []);
    }
    facultyMap.get(facultyId)!.push(schedule);
  }

  // Calculate workload for each faculty
  const workloads: FacultyWorkload[] = [];
  for (const [facultyId] of facultyMap.entries()) {
    const workload = await calculateFacultyWorkload(facultyId, semester, academicYear);
    workloads.push(workload);
  }

  return workloads.sort((a, b) => b.totalTeachingHours - a.totalTeachingHours);
}

/**
 * Check if faculty is overloaded
 * Standard max: 26 teaching hours per week
 */
export function isOverloaded(workload: FacultyWorkload, maxHours: number = 26): boolean {
  return workload.totalTeachingHours > maxHours;
}

/**
 * Check if faculty is underloaded
 * Standard min: 18 teaching hours per week
 */
export function isUnderloaded(workload: FacultyWorkload, minHours: number = 18): boolean {
  return workload.totalTeachingHours < minHours;
}

/**
 * Get workload status
 */
export function getWorkloadStatus(
  workload: FacultyWorkload,
  minHours: number = 18,
  maxHours: number = 26
): 'underloaded' | 'optimal' | 'overloaded' {
  if (workload.totalTeachingHours < minHours) return 'underloaded';
  if (workload.totalTeachingHours > maxHours) return 'overloaded';
  return 'optimal';
}


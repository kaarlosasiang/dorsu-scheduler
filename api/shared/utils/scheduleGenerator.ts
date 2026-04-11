import { Schedule } from '../../models/scheduleModel.js';
import { Subject } from '../../models/subjectModel.js';
import { Faculty } from '../../models/facultyModel.js';
import { Classroom } from '../../models/classroomModel.js';
import { Section } from '../../models/sectionModel.js';
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

// ─── In-Memory Schedule Store ─────────────────────────────────────────────────
// Pre-loaded once per generation run. All conflict and workload checks operate
// against this store instead of firing individual DB queries in the hot loop.

interface TimeRange {
  startMinutes: number;
  endMinutes: number;
}

interface InMemoryScheduleStore {
  /** "faculty:<id>:<day>" | "classroom:<id>:<day>" | "section:<id>:<day>" → occupied time ranges */
  occupiedSlots: Map<string, TimeRange[]>;
  /** facultyId → accumulated teaching hours for the semester */
  facultyHoursMap: Map<string, number>;
  /** facultyId → Set of unique subjectIds (preparation count) */
  facultyPrepsMap: Map<string, Set<string>>;
  /**
   * Day-pattern key (e.g. "monday,wednesday") → number of schedules assigned.
   * Used to round-robin across patterns so no single pattern gets overloaded.
   */
  patternUsageMap: Map<string, number>;
}

function toMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

function hasOverlap(range: TimeRange, startMin: number, endMin: number): boolean {
  return range.startMinutes < endMin && range.endMinutes > startMin;
}

/** Check whether a faculty member or classroom is free for the given time slot (in-memory). */
function isSlotFree(
  store: InMemoryScheduleStore,
  entityType: 'faculty' | 'classroom' | 'section',
  entityId: string,
  timeSlot: ITimeSlot
): boolean {
  const days = timeSlot.days && timeSlot.days.length > 0 ? timeSlot.days : [timeSlot.day];
  const startMin = toMinutes(timeSlot.startTime);
  const endMin   = toMinutes(timeSlot.endTime);

  for (const day of days) {
    const key    = `${entityType}:${entityId}:${day}`;
    const ranges = store.occupiedSlots.get(key) ?? [];
    if (ranges.some(r => hasOverlap(r, startMin, endMin))) return false;
  }
  return true;
}

/** Mark a faculty member or classroom as occupied for the given time slot (in-memory). */
function markSlotOccupied(
  store: InMemoryScheduleStore,
  entityType: 'faculty' | 'classroom' | 'section',
  entityId: string,
  timeSlot: ITimeSlot
): void {
  const days = timeSlot.days && timeSlot.days.length > 0 ? timeSlot.days : [timeSlot.day];
  const range: TimeRange = {
    startMinutes: toMinutes(timeSlot.startTime),
    endMinutes:   toMinutes(timeSlot.endTime)
  };

  for (const day of days) {
    const key = `${entityType}:${entityId}:${day}`;
    const existing = store.occupiedSlots.get(key) ?? [];
    existing.push(range);
    store.occupiedSlots.set(key, existing);
  }
}

/** Canonical sort key for a time slot's day pattern (e.g. "monday,wednesday"). */
function patternKey(timeSlot: ITimeSlot): string {
  const days = timeSlot.days && timeSlot.days.length > 0 ? timeSlot.days : [timeSlot.day];
  return [...days].sort().join(',');
}

/**
 * Re-order a time-slot list so the least-used day patterns are tried first.
 * Within the same usage tier, original relative order is preserved (stable).
 * This ensures load is round-robined across MW / MF / WF rather than all
 * subjects piling onto MW just because it happens to be listed first.
 */
function sortSlotsByPatternUsage(slots: ITimeSlot[], store: InMemoryScheduleStore): ITimeSlot[] {
  return [...slots].sort((a, b) => {
    const usageA = store.patternUsageMap.get(patternKey(a)) ?? 0;
    const usageB = store.patternUsageMap.get(patternKey(b)) ?? 0;
    return usageA - usageB;
  });
}

/**
 * Pre-load ONE query worth of schedule data into the in-memory store.
 * All subsequent workload / conflict checks for this generation run use this
 * store instead of individual DB round-trips.
 */
async function buildScheduleStore(semester: string, academicYear: string): Promise<InMemoryScheduleStore> {
  const store: InMemoryScheduleStore = {
    occupiedSlots:   new Map(),
    facultyHoursMap: new Map(),
    facultyPrepsMap: new Map(),
    patternUsageMap: new Map()
  };

  const existing = await Schedule.find({
    semester,
    academicYear,
    status: { $ne: 'archived' }
  })
    .populate('subject', 'lectureUnits labUnits')
    .lean();

  for (const s of existing) {
    const facultyId   = s.faculty?.toString();
    const classroomId = s.classroom?.toString();
    const sectionId   = s.section?.toString();
    const subjectId   = s.subject?._id?.toString() ?? s.subject?.toString();
    const timeSlot    = s.timeSlot as ITimeSlot;

    if (!timeSlot) continue;

    // Occupied slot tracking for faculty and classroom
    if (facultyId)   markSlotOccupied(store, 'faculty',   facultyId,   timeSlot);
    if (classroomId) markSlotOccupied(store, 'classroom', classroomId, timeSlot);
    if (sectionId)   markSlotOccupied(store, 'section',   sectionId,   timeSlot);

    // Pattern usage — count from existing schedules so we don't bias new ones
    const key = patternKey(timeSlot);
    store.patternUsageMap.set(key, (store.patternUsageMap.get(key) ?? 0) + 1);

    // Teaching hours accumulation
    if (facultyId) {
      const subjectData = s.subject as any;
      let hours = 0;
      if ((s as any).scheduleType === 'lecture') {
        hours = calculateLectureHours(subjectData?.lectureUnits ?? 0);
      } else if ((s as any).scheduleType === 'laboratory') {
        hours = calculateLabHours(subjectData?.labUnits ?? 0);
      }
      store.facultyHoursMap.set(facultyId, (store.facultyHoursMap.get(facultyId) ?? 0) + hours);
    }

    // Preparations (unique subjects) tracking
    if (facultyId && subjectId) {
      const preps = store.facultyPrepsMap.get(facultyId) ?? new Set<string>();
      preps.add(subjectId);
      store.facultyPrepsMap.set(facultyId, preps);
    }
  }

  console.log(`   📦 Built schedule store from ${existing.length} existing schedule(s)`);
  return store;
}

async function getActiveSectionsMap(programIds?: string[]): Promise<Map<string, any[]>> {
  const query: any = { status: 'active' };

  if (programIds && programIds.length > 0) {
    query.program = { $in: programIds };
  }

  const sections = await Section.find(query)
    .select('program yearLevel sectionCode name status')
    .lean();

  const sectionMap = new Map<string, any[]>();

  for (const section of sections) {
    const key = `${section.program?.toString()}:${section.yearLevel}`;
    const existing = sectionMap.get(key) ?? [];
    existing.push(section);
    sectionMap.set(key, existing);
  }

  return sectionMap;
}

// ─────────────────────────────────────────────────────────────────────────────

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
async function getAvailableFaculty(programs?: string[]): Promise<any[]> {
  const query: any = { status: 'active' };

  if (programs && programs.length > 0) {
    query.program = { $in: programs };
  }

  return await Faculty.find(query).populate('program', 'courseCode courseName');
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
 * Find suitable faculty for a subject.
 * Objective 3: Consider availability, workload, and preferences.
 * Uses the pre-loaded InMemoryScheduleStore — zero DB queries.
 */
function findSuitableFaculty(
  subject: any,
  availableFaculty: any[],
  constraints: IScheduleConstraints,
  store: InMemoryScheduleStore
): any[] {
  const suitable: any[] = [];

  for (const faculty of availableFaculty) {
    // Faculty must belong to the same program as the subject's course.
    // Exception: GE faculty (courseCode === 'GE') can teach any subject.
    const facultyProgramCode: string | undefined =
      typeof faculty.program === 'object' ? faculty.program?.courseCode : undefined;
    const facultyProgramId: string =
      typeof faculty.program === 'object'
        ? (faculty.program?._id?.toString() ?? faculty.program?.toString())
        : faculty.program?.toString();
    const subjectCourseId: string =
      typeof subject.course === 'object'
        ? (subject.course?._id?.toString() ?? subject.course?.toString())
        : subject.course?.toString();

    if (
      subject.course &&
      faculty.program &&
      facultyProgramCode !== 'GE' &&
      facultyProgramId !== subjectCourseId
    ) {
      continue;
    }

    const facultyId = faculty._id.toString();

    // Pull workload data from the in-memory store (no DB round-trip)
    const currentHours = store.facultyHoursMap.get(facultyId) ?? 0;
    const uniqueSubjects = store.facultyPrepsMap.get(facultyId) ?? new Set<string>();

    // Check workload constraints
    const rawMaxLoad  = constraints.maxHoursPerWeek || faculty.maxLoad || 26;
    const adminLoad   = faculty.adminLoad || 0;
    const maxLoad     = rawMaxLoad - adminLoad;
    const maxPreparations = constraints.maxPreparations || faculty.maxPreparations || 4;

    // Teaching hours this subject component would add
    const subjectHours      = subject.lectureUnits ? calculateLectureHours(subject.lectureUnits) : 0;
    const labHours          = subject.labUnits     ? calculateLabHours(subject.labUnits)         : 0;
    const totalSubjectHours = subjectHours + labHours;

    if (currentHours + totalSubjectHours <= maxLoad && uniqueSubjects.size < maxPreparations) {
      suitable.push({
        ...faculty.toObject(),
        currentLoad:  currentHours,
        preparations: uniqueSubjects.size,
        // Lower load → higher priority (fair distribution)
        priority: maxLoad - currentHours
      });
    }
  }

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
 * Find best faculty-classroom-time assignment.
 * Objective 2: Intelligent algorithm to minimise conflicts.
 * Now fully synchronous — uses the in-memory store for O(1) overlap checks.
 */
function findBestAssignmentPattern(
  subject: any,
  suitableFaculty: any[],
  suitableClassrooms: any[],
  timeSlots: ITimeSlot[],
  store: InMemoryScheduleStore,
  sectionId?: string,
  scheduleType: 'lecture' | 'laboratory' = 'lecture'
): { faculty: any; classroom: any; timeSlots: ITimeSlot[] } | null {

  let attemptCount  = 0;
  let conflictCount = 0;

  for (const faculty of suitableFaculty) {
    const facultyId = faculty._id.toString();

    for (const classroom of suitableClassrooms) {
      const classroomId = classroom._id.toString();

      for (const timeSlot of timeSlots) {
        attemptCount++;

        const facultyFree   = isSlotFree(store, 'faculty',   facultyId,   timeSlot);
        const classroomFree = isSlotFree(store, 'classroom', classroomId, timeSlot);
        const sectionFree   = sectionId
          ? isSlotFree(store, 'section', sectionId, timeSlot)
          : true;

        if (!facultyFree || !classroomFree || !sectionFree) {
          conflictCount++;
          continue;
        }

        // Conflict-free — return this assignment
        console.log(`     ✓ SUCCESS! Found conflict-free slot after ${attemptCount} attempt(s)`);
        if (conflictCount > 0) {
          console.log(`       (${conflictCount} combination(s) had conflicts before this one)`);
        }
        return { faculty, classroom, timeSlots: [timeSlot] };
      }
    }
  }

  console.log(`     ✗ Tried ${attemptCount} combinations, all had conflicts (faculty: ${suitableFaculty.length}, rooms: ${suitableClassrooms.length})`);
  return null;
}

/**
 * Generate schedule for a single subject component (lecture or lab).
 * Uses the in-memory store for all conflict/workload checks, then updates
 * the store after a successful save so subsequent subjects see the new slot.
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
  units: number,
  store: InMemoryScheduleStore,
  section?: any
): Promise<ISchedule[]> {

  // 1. Find suitable faculty — pure in-memory, zero DB queries
  const suitableFaculty = findSuitableFaculty(subject, availableFaculty, constraints, store);

  console.log(`Found ${suitableFaculty.length} suitable faculty`);
  if (suitableFaculty.length === 0) {
    throw new Error(`No suitable faculty found for ${scheduleType} of subject ${subject.subjectCode}`);
  }

  // 2. Find suitable classrooms
  const suitableClassrooms = findSuitableClassrooms(subject, availableClassrooms, constraints, scheduleType);

  console.log(`     Found ${suitableClassrooms.length} suitable ${scheduleType} classrooms`);
  if (suitableClassrooms.length === 0) {
    throw new Error(`No suitable ${scheduleType} classroom found for subject ${subject.subjectCode}`);
  }

  // 3. Find best time slot — sort by least-used pattern first, then check in-memory
  const sortedTimeSlots = sortSlotsByPatternUsage(timeSlots, store);
  const sectionId = section?._id?.toString() ?? section?.id?.toString() ?? undefined;
  const bestAssignment = findBestAssignmentPattern(
    subject,
    suitableFaculty,
    suitableClassrooms,
    sortedTimeSlots,
    store,
    sectionId,
    scheduleType
  );

  if (!bestAssignment) {
    console.log(`     ✗ No conflict-free time slot found`);
    return [];
  }

  const patternSlot  = bestAssignment.timeSlots[0];
  const daysDisplay  = patternSlot.days?.join(', ') || patternSlot.day;
  console.log(`     ✓ Found conflict-free assignment: ${daysDisplay} at ${patternSlot.startTime}`);

  // 4. Persist the schedule
  const departmentId = subject.department?._id || subject.department ||
                       subject.course?.department?._id || subject.course?.department ||
                       null;

  const schedule = new Schedule({
    ...(departmentId ? { department: departmentId } : {}),
    subject:      subject._id,
    faculty:      bestAssignment.faculty._id,
    classroom:    bestAssignment.classroom._id,
    ...(section?._id ? { section: section._id } : {}),
    timeSlot: {
      day:       patternSlot.day,
      days:      patternSlot.days,
      startTime: patternSlot.startTime,
      endTime:   patternSlot.endTime
    },
    scheduleType,
    semester,
    academicYear,
    yearLevel:    subject.yearLevel,
    status:       'draft',
    isGenerated:  true
  });

  await schedule.save();

  // 5. Update the in-memory store so subsequent subjects see this slot as taken
  const facultyId   = bestAssignment.faculty._id.toString();
  const classroomId = bestAssignment.classroom._id.toString();
  const subjectId   = subject._id.toString();

  markSlotOccupied(store, 'faculty',   facultyId,   patternSlot);
  markSlotOccupied(store, 'classroom', classroomId, patternSlot);
  if (sectionId) {
    markSlotOccupied(store, 'section', sectionId, patternSlot);
  }

  // Increment pattern usage so the next subject avoids this pattern if others are free
  const pKey = patternKey(patternSlot);
  store.patternUsageMap.set(pKey, (store.patternUsageMap.get(pKey) ?? 0) + 1);

  const teachingHours = scheduleType === 'lecture'
    ? calculateLectureHours(units)
    : calculateLabHours(units);

  store.facultyHoursMap.set(facultyId, (store.facultyHoursMap.get(facultyId) ?? 0) + teachingHours);

  const preps = store.facultyPrepsMap.get(facultyId) ?? new Set<string>();
  preps.add(subjectId);
  store.facultyPrepsMap.set(facultyId, preps);

  // 6. Persist faculty load update to DB (fire-and-forget — non-blocking)
  await updateFacultyLoad(facultyId, teachingHours);

  return [JSON.parse(JSON.stringify(schedule)) as ISchedule];
}

/**
 * Generate schedule for a single subject (may create lecture and/or lab schedules).
 */
async function generateSubjectSchedule(
  subject: any,
  availableFaculty: any[],
  availableClassrooms: any[],
  semester: string,
  academicYear: string,
  constraints: IScheduleConstraints,
  store: InMemoryScheduleStore,
  sectionMap: Map<string, any[]>
): Promise<ISchedule[]> {
  const schedules: ISchedule[] = [];

  const courseId = subject.course?._id?.toString?.() || subject.course?.toString?.() || '';
  const sectionKey = `${courseId}:${subject.yearLevel}`;
  const sectionsForSubject = sectionMap.get(sectionKey) ?? [];

  // If a subject has a yearLevel but no matching sections exist, skip it entirely.
  // Generating sectionless schedules for year-levelled subjects produces orphan entries.
  if (subject.yearLevel && sectionsForSubject.length === 0) {
    const courseCode = subject.course?.courseCode || courseId || 'unknown';
    console.log(`  ⚠ No active sections found for ${courseCode} / ${subject.yearLevel} — skipping ${subject.subjectCode}`);
    throw new Error(`No active sections found for ${courseCode} ${subject.yearLevel}. Create sections for this program/year level first.`);
  }

  // Subjects with no yearLevel (e.g. cross-program GE subjects) are scheduled without a section.
  const targetSections = sectionsForSubject.length > 0 ? sectionsForSubject : [null];

  for (const targetSection of targetSections) {
    const sectionLabel = targetSection?.name || targetSection?.sectionCode || 'NO-SECTION';

    if (subject.lectureUnits && subject.lectureUnits > 0) {
      console.log(`  → Generating LECTURE schedule for ${subject.subjectCode} (${subject.lectureUnits} units) [${sectionLabel}]`);
      const lectureTimeSlots = generateLectureTimeSlots();
      console.log(`     Available lecture time slots: ${lectureTimeSlots.length}`);

      try {
        const lectureSchedules = await generateScheduleComponent(
          subject, availableFaculty, availableClassrooms,
          lectureTimeSlots, semester, academicYear,
          constraints, 'lecture', subject.lectureUnits, store, targetSection
        );

        if (lectureSchedules && lectureSchedules.length > 0) {
          console.log(`     ✓ Successfully generated ${lectureSchedules.length} lecture schedule(s)`);
          schedules.push(...lectureSchedules);
        } else {
          console.log(`     ✗ No lecture schedule generated`);
        }
      } catch (error) {
        console.log(`     ✗ Failed to generate lecture schedule: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    if (subject.labUnits && subject.labUnits > 0) {
      console.log(`  → Generating LAB schedule for ${subject.subjectCode} (${subject.labUnits} units) [${sectionLabel}]`);
      const labTimeSlots = generateLabTimeSlots();
      console.log(`     Available lab time slots: ${labTimeSlots.length}`);

      try {
        const labSchedules = await generateScheduleComponent(
          subject, availableFaculty, availableClassrooms,
          labTimeSlots, semester, academicYear,
          constraints, 'laboratory', subject.labUnits, store, targetSection
        );

        if (labSchedules && labSchedules.length > 0) {
          console.log(`     ✓ Successfully generated ${labSchedules.length} lab schedule(s)`);
          schedules.push(...labSchedules);
        } else {
          console.log(`     ✗ No lab schedule generated`);
        }
      } catch (error) {
        console.log(`     ✗ Failed to generate lab schedule: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
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
 * Main schedule generation function.
 * Implements all 4 project objectives.
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

    console.time('⏱  Schedule generation');

    // 1. Fetch reference data (3 queries total for the entire run)
    const subjectsToSchedule  = await getSubjectsToSchedule(semester, departments, subjects, courses);
    const availableFaculty    = await getAvailableFaculty(courses);
    const availableClassrooms = await getAvailableClassrooms();
    const sectionMap          = await getActiveSectionsMap(courses);

    if (subjectsToSchedule.length === 0) {
      throw new Error(`No subjects found to schedule for ${semester}. Please ensure subjects are assigned to this semester.`);
    }
    if (availableFaculty.length === 0) {
      throw new Error('No available faculty found');
    }
    if (availableClassrooms.length === 0) {
      throw new Error('No available classrooms found');
    }

    // 2. Pre-load ALL existing schedules into memory — the only scheduling-related DB query
    const store = await buildScheduleStore(semester, academicYear);

    const generatedSchedules: ISchedule[]                              = [];
    const failedSubjects: Array<{ subject: any; reason: string }>      = [];
    const conflicts: IScheduleConflict[]                               = [];

    // 3. Generate schedule for each subject — all conflict checks are in-memory from here
    for (const subject of subjectsToSchedule) {
      try {
        const schedules = await generateSubjectSchedule(
          subject,
          availableFaculty,
          availableClassrooms,
          semester,
          academicYear,
          constraints,
          store,
          sectionMap
        );

        if (schedules && schedules.length > 0) {
          generatedSchedules.push(...schedules);
        } else {
          failedSubjects.push({ subject, reason: 'No conflict-free time slot found' });
        }
      } catch (error) {
        failedSubjects.push({
          subject,
          reason: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    console.timeEnd('⏱  Schedule generation');

    // 4. Calculate statistics
    const statistics = await calculateStatistics(generatedSchedules, availableFaculty, availableClassrooms);

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


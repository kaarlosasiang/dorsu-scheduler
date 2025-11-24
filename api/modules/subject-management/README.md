# Subject Management Module - Backend Changes

## Overview

This document describes the major architectural fix to the DORSU Scheduler backend. The system was incorrectly scheduling **courses** (degree programs) when it should be scheduling **subjects** (individual classes/courses within a curriculum).

## Problem Identified

### Before (Incorrect):
- **Course** was used to represent entire degree programs (e.g., BS Computer Science, BS Information Technology)
- **Schedule** was linking: Course + Faculty + Classroom + Time
- This meant we were scheduling entire degree programs instead of individual subjects/classes

### After (Correct):
- **Course** represents degree programs (e.g., BSCS, BSIT, BSN)
- **Subject** represents individual classes within a program (e.g., CS101 - Data Structures, MATH101 - Calculus)
- **Schedule** now links: Subject + Faculty + Classroom + Time

## Changes Made

### 1. New Files Created

#### Models:
- `api/models/subjectModel.ts` - Subject entity model with MongoDB schema

#### Interfaces:
- `api/shared/interfaces/ISubject.ts` - TypeScript interface for Subject

#### Validators:
- `api/shared/validators/subjectValidator.ts` - Zod validation schemas for Subject operations

#### Module (MVC Pattern):
- `api/modules/subject-management/subjectService.ts` - Business logic for subject operations
- `api/modules/subject-management/subjectController.ts` - HTTP request handlers
- `api/modules/subject-management/subjectRoutes.ts` - API route definitions

### 2. Modified Files

#### Schedule-related files updated to use 'subject' instead of 'course':
- `api/models/scheduleModel.ts`
  - Changed field from `course` to `subject`
  - Updated reference from `'Course'` to `'Subject'`
  - Updated population queries

- `api/shared/interfaces/ISchedule.ts`
  - Changed `course: string` to `subject: string`
  - Updated filter interface

- `api/shared/validators/scheduleValidator.ts`
  - Changed validation from `course` to `subject`

- `api/modules/schedule-management/scheduleService.ts`
  - Updated all populate calls to use `'subject'`
  - Changed query filters to use `subject`

#### Conflict detection updated:
- `api/shared/utils/conflictDetector.ts`
  - Updated to detect conflicts based on subjects
  - Changed workload calculation to use subjects
  - Updated function parameters from `courseId` to `subjectId`

#### Schedule generator updated:
- `api/shared/utils/scheduleGenerator.ts`
  - Renamed `getCoursesToSchedule()` to `getSubjectsToSchedule()`
  - Updated to fetch and schedule subjects instead of courses
  - Changed faculty matching to work with subjects
  - Updated classroom matching for laboratory subjects

#### Main API:
- `api/index.ts`
  - Added subject routes: `/api/subjects`

## API Endpoints

### Subject Management

#### Get all subjects
```
GET /api/subjects
Query params: course, department, yearLevel, semester, subjectCode, subjectName, isLaboratory
```

#### Get subject by ID
```
GET /api/subjects/:id
```

#### Get subjects by course
```
GET /api/subjects/course/:courseId
```

#### Get subject statistics
```
GET /api/subjects/stats
Query params: course, department, yearLevel, semester
```

#### Create subject
```
POST /api/subjects
Body: {
  subjectCode: string,
  subjectName: string,
  units: number,
  description?: string,
  course: string (ObjectId),
  department?: string (ObjectId),
  yearLevel?: "1st Year" | "2nd Year" | "3rd Year" | "4th Year" | "5th Year",
  semester?: "1st Semester" | "2nd Semester" | "Summer",
  isLaboratory?: boolean,
  prerequisites?: string[] (Array of Subject ObjectIds)
}
```

#### Update subject
```
PUT /api/subjects/:id
Body: Partial subject data
```

#### Delete subject
```
DELETE /api/subjects/:id
```

## Data Model

### Subject Schema

```typescript
{
  subjectCode: string,        // e.g., "CS101", "MATH201"
  subjectName: string,        // e.g., "Introduction to Programming"
  units: number,              // Credit units (0-12)
  description?: string,       // Optional description
  course: ObjectId,           // Reference to Course (degree program)
  department?: ObjectId,      // Reference to Department
  yearLevel?: string,         // "1st Year", "2nd Year", etc.
  semester?: string,          // "1st Semester", "2nd Semester", "Summer"
  isLaboratory: boolean,      // Requires lab facilities
  prerequisites: ObjectId[],  // Array of prerequisite subjects
  createdAt: Date,
  updatedAt: Date
}
```

### Relationships

```
Course (Degree Program)
  └─> Subject (Individual Classes)
       └─> Schedule (Subject + Faculty + Classroom + Time)
            ├─> Faculty
            ├─> Classroom
            └─> TimeSlot
```

## Migration Guide

### For Existing Data:

If you have existing schedules in the database, you need to:

1. **Create Subject entries** for each course that was being scheduled
2. **Update Schedule documents** to reference subjects instead of courses
3. **Update Course documents** to represent degree programs only

### Example Migration Script Structure:

```javascript
// 1. Identify courses that were actually subjects
const coursesAsSubjects = await Course.find({ /* criteria */ });

// 2. Create actual degree programs as Courses
const bscs = await Course.create({
  courseCode: "BSCS",
  courseName: "Bachelor of Science in Computer Science",
  units: 0, // Total program units
  department: csDepartmentId
});

// 3. Convert old "courses" to subjects
for (const oldCourse of coursesAsSubjects) {
  await Subject.create({
    subjectCode: oldCourse.courseCode,
    subjectName: oldCourse.courseName,
    units: oldCourse.units,
    course: bscs._id, // Link to degree program
    department: oldCourse.department
  });
}

// 4. Update schedules to reference subjects
// This will need to be done based on your data
```

## Testing

Test the following scenarios:

1. **Create subjects** under different courses (degree programs)
2. **Create schedules** linking subjects with faculty, classrooms, and time slots
3. **Conflict detection** should work with subjects
4. **Schedule generation** should generate schedules for subjects
5. **Faculty workload** calculation should consider subject units
6. **Classroom allocation** should consider laboratory requirements

## Benefits

1. **Correct Domain Model**: The system now properly represents academic structure
2. **Granular Scheduling**: Schedule individual classes, not entire programs
3. **Better Curriculum Management**: Track subjects by year level and semester
4. **Prerequisites Support**: Can define prerequisite relationships between subjects
5. **Laboratory Tracking**: Identify subjects requiring special facilities
6. **Accurate Workload**: Faculty workload based on actual subjects taught

## Next Steps

1. Update frontend to work with subjects instead of courses
2. Create curriculum management features to define subjects for each program
3. Add subject prerequisite validation
4. Implement section-based scheduling (e.g., CS101 Section A, Section B)
5. Add enrollment capacity tracking per subject section


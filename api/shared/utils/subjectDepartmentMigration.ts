/**
 * Utility to update subjects without departments to inherit from their courses
 * This can be run as a one-time migration or maintenance task
 */

import { Subject } from '../../models/subjectModel';
import { Course } from '../../models/courseModel';

export async function updateSubjectsWithCourseDepartments(): Promise<{
  success: boolean;
  updated: number;
  failed: number;
  errors: string[];
}> {
  const errors: string[] = [];
  let updated = 0;
  let failed = 0;

  try {
    // Find all subjects without a department
    const subjectsWithoutDept = await Subject.find({
      $or: [
        { department: null },
        { department: { $exists: false } }
      ]
    }).populate('course');

    console.log(`Found ${subjectsWithoutDept.length} subjects without departments`);

    for (const subject of subjectsWithoutDept) {
      try {
        // Get the course to find its department
        let courseData: any = subject.course;

        // If course is not populated, fetch it
        if (typeof courseData === 'string' || !courseData.department) {
          courseData = await Course.findById(subject.course);
        }

        if (courseData?.department) {
          // Update the subject with the course's department
          subject.department = courseData.department;
          await subject.save();
          updated++;
          console.log(`✓ Updated subject ${subject.subjectCode} with department from course ${courseData.courseCode}`);
        } else {
          failed++;
          const errorMsg = `Subject ${subject.subjectCode}: Course ${courseData?.courseCode || subject.course} has no department assigned`;
          errors.push(errorMsg);
          console.warn(`✗ ${errorMsg}`);
        }
      } catch (error) {
        failed++;
        const errorMsg = `Subject ${subject.subjectCode}: ${error instanceof Error ? error.message : 'Unknown error'}`;
        errors.push(errorMsg);
        console.error(`✗ ${errorMsg}`);
      }
    }

    return {
      success: true,
      updated,
      failed,
      errors
    };
  } catch (error) {
    console.error('Migration failed:', error);
    return {
      success: false,
      updated,
      failed,
      errors: [...errors, error instanceof Error ? error.message : 'Unknown error']
    };
  }
}

/**
 * Update a single subject's department from its course
 */
export async function updateSingleSubjectDepartment(subjectId: string): Promise<boolean> {
  try {
    const subject = await Subject.findById(subjectId);
    if (!subject) {
      throw new Error('Subject not found');
    }

    if (subject.department) {
      console.log(`Subject ${subject.subjectCode} already has a department`);
      return true;
    }

    const course = await Course.findById(subject.course);
    if (!course?.department) {
      throw new Error(`Course has no department assigned`);
    }

    subject.department = course.department;
    await subject.save();
    console.log(`✓ Updated subject ${subject.subjectCode} with department from course`);
    return true;
  } catch (error) {
    console.error(`Failed to update subject department:`, error);
    return false;
  }
}


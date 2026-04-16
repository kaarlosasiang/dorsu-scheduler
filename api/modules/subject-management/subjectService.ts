import { Subject, ISubjectDocument } from '../../models/subjectModel.js';
import { ISubjectFilter } from '../../shared/interfaces/ISubject.js';
import {
  validateCreateSubject,
  validateUpdateSubject,
  CreateSubjectInput,
  UpdateSubjectInput
} from '../../shared/validators/subjectValidator.js';

/**
 * Get all subjects with optional filtering
 */
export async function getAll(filters: ISubjectFilter = {}): Promise<ISubjectDocument[]> {
  try {
    const query: any = {};

    if (filters.courseId) query['courseOfferings.course'] = filters.courseId;
    if (filters.department) query.department = filters.department;
    if (filters.semester) query.semester = filters.semester;
    if (filters.subjectCode) query.subjectCode = new RegExp(filters.subjectCode, 'i');
    if (filters.subjectName) query.subjectName = new RegExp(filters.subjectName, 'i');

    const subjects = await Subject.find(query)
      .populate('courseOfferings.course', 'courseCode courseName')
      .populate('department', 'name code')
      .populate('prerequisites', 'subjectCode subjectName')
      .sort({ semester: 1, subjectCode: 1 })
      .exec();

    return subjects;
  } catch (error) {
    console.error('Error in getAll:', error);
    throw new Error('Failed to retrieve subjects');
  }
}

/**
 * Get subject by ID
 */
export async function getById(id: string): Promise<ISubjectDocument> {
  try {
    const subject = await Subject.findById(id)
      .populate('courseOfferings.course', 'courseCode courseName description')
      .populate('department', 'name code')
      .populate('prerequisites', 'subjectCode subjectName units')
      .exec();

    if (!subject) {
      throw new Error('Subject not found');
    }

    return subject;
  } catch (error) {
    console.error('Error in getById:', error);
    if (error instanceof Error && error.message === 'Subject not found') {
      throw error;
    }
    throw new Error('Failed to retrieve subject');
  }
}

/**
 * Create a new subject
 */
export async function create(subjectData: CreateSubjectInput): Promise<ISubjectDocument> {
  try {
    // Validate input
    const validation = validateCreateSubject(subjectData);
    if (!validation.success) {
      throw new Error(`Validation failed: ${validation.error.issues.map(i => i.message).join(', ')}`);
    }

    const validatedData = validation.data;

    // If department is not provided, derive it from the first non-GE course offering
    if (!validatedData.department && validatedData.courseOfferings?.length) {
      const Course = (await import('../../models/courseModel.js')).Course;
      const firstCourse = await Course.findById(validatedData.courseOfferings[0].course);
      if (firstCourse?.department) {
        validatedData.department = firstCourse.department as any;
      }
    }

    // Create subject
    const subject = new Subject(validatedData);
    const savedSubject = await subject.save();

    // Populate before returning
    await savedSubject.populate([
      { path: 'courseOfferings.course', select: 'courseCode courseName' },
      { path: 'department', select: 'name code' },
      { path: 'prerequisites', select: 'subjectCode subjectName' }
    ]);

    return savedSubject;
  } catch (error) {
    console.error('Error in create:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to create subject');
  }
}

/**
 * Update subject
 */
export async function update(id: string, updateData: UpdateSubjectInput): Promise<ISubjectDocument> {
  try {
    // If department is not in the update and courseOfferings is being updated, derive from first offering
    if (!updateData.department && updateData.courseOfferings?.length) {
      const Course = (await import('../../models/courseModel.js')).Course;
      const firstCourse = await Course.findById(updateData.courseOfferings[0].course);
      if (firstCourse?.department) {
        updateData.department = firstCourse.department as any;
      }
    }

    // Validate input
    const validation = validateUpdateSubject(updateData);
    if (!validation.success) {
      throw new Error(`Validation failed: ${validation.error.issues.map(i => i.message).join(', ')}`);
    }

    const validatedData = validation.data;

    // Check if subject exists
    const existingSubject = await Subject.findById(id);
    if (!existingSubject) {
      throw new Error('Subject not found');
    }

    // Update subject
    const updatedSubject = await Subject.findByIdAndUpdate(
      id,
      validatedData,
      { new: true, runValidators: true }
    )
      .populate('courseOfferings.course', 'courseCode courseName')
      .populate('department', 'name code')
      .populate('prerequisites', 'subjectCode subjectName')
      .exec();

    if (!updatedSubject) {
      throw new Error('Failed to update subject');
    }

    return updatedSubject;
  } catch (error) {
    console.error('Error in update:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to update subject');
  }
}

/**
 * Delete subject
 */
export async function deleteSubject(id: string): Promise<void> {
  try {
    const subject = await Subject.findById(id);
    if (!subject) {
      throw new Error('Subject not found');
    }

    // Check if any schedules use this subject
    const Schedule = (await import('../../models/scheduleModel.js')).Schedule;
    const scheduleCount = await Schedule.countDocuments({ subject: id });
    if (scheduleCount > 0) {
      throw new Error('Cannot delete subject that is assigned to schedules. Please remove or reassign schedules first.');
    }

    // Check if any other subjects have this as a prerequisite
    const dependentSubjects = await Subject.countDocuments({ prerequisites: id });
    if (dependentSubjects > 0) {
      throw new Error('Cannot delete subject that is a prerequisite for other subjects. Please update dependent subjects first.');
    }

    await Subject.findByIdAndDelete(id);
  } catch (error) {
    console.error('Error in deleteSubject:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to delete subject');
  }
}

/**
 * Get subject statistics
 */
export async function getStats(filter: any = {}): Promise<any> {
  try {
    return await Subject.getStats(filter);
  } catch (error) {
    console.error('Error in getStats:', error);
    throw new Error('Failed to retrieve subject statistics');
  }
}

/**
 * Get subjects by course
 */
export async function getByCourse(courseId: string): Promise<ISubjectDocument[]> {
  try {
    return await Subject.find({ 'courseOfferings.course': courseId })
      .populate('courseOfferings.course', 'courseCode courseName')
      .populate('department', 'name code')
      .populate('prerequisites', 'subjectCode subjectName')
      .sort({ semester: 1, subjectCode: 1 });
  } catch (error) {
    console.error('Error in getByCourse:', error);
    throw new Error('Failed to retrieve subjects by course');
  }
}

/**
 * Get subjects by offering (courseId + yearLevel) and semester
 */
export async function getByYearAndSemester(
  courseId: string,
  yearLevel: string,
  semester: string
): Promise<ISubjectDocument[]> {
  try {
    return await Subject.find({
      courseOfferings: { $elemMatch: { course: courseId, yearLevel } },
      semester
    })
      .populate('courseOfferings.course', 'courseCode courseName')
      .populate('department', 'name code')
      .populate('prerequisites', 'subjectCode subjectName')
      .sort({ subjectCode: 1 });
  } catch (error) {
    console.error('Error in getByYearAndSemester:', error);
    throw new Error('Failed to retrieve subjects');
  }
}


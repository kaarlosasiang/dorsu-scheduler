import { Course, ICourseDocument } from '../../models/courseModel.js';
import {
  validateCreateCourse,
  validateUpdateCourse,
  CreateCourseInput,
  UpdateCourseInput
} from '../../shared/validators/courseValidator.js';

export interface ICourseFilter {
  courseCode?: string;
  courseName?: string;
  department?: string;
}

export class CourseService {
  /**
   * Get all courses with optional filtering
   */
  static async getAll(filters: ICourseFilter = {}): Promise<ICourseDocument[]> {
    try {
      const query: any = {};

      if (filters.courseCode) {
        query.courseCode = new RegExp(filters.courseCode, 'i');
      }

      if (filters.courseName) {
        query.courseName = new RegExp(filters.courseName, 'i');
      }

      if (filters.department) {
        query.department = filters.department;
      }

      const courses = await Course.find(query)
        .populate('department', 'name code')
        .sort({ courseCode: 1 })
        .exec();

      return courses;
    } catch (error) {
      console.error('Error in CourseService.getAll:', error);
      throw new Error('Failed to retrieve courses');
    }
  }

  /**
   * Get course by ID
   */
  static async getById(id: string): Promise<ICourseDocument> {
    try {
      const course = await Course.findById(id)
        .populate('department', 'name code')
        .exec();

      if (!course) {
        throw new Error('Course not found');
      }

      return course;
    } catch (error) {
      console.error('Error in CourseService.getById:', error);
      if (error instanceof Error && error.message === 'Course not found') {
        throw error;
      }
      throw new Error('Failed to retrieve course');
    }
  }

  /**
   * Get course by code
   */
  static async getByCode(code: string, departmentId?: string): Promise<ICourseDocument> {
    try {
      const query: any = { courseCode: code.toUpperCase() };
      if (departmentId) {
        query.department = departmentId;
      }

      const course = await Course.findOne(query)
        .populate('department', 'name code')
        .exec();

      if (!course) {
        throw new Error('Course not found');
      }

      return course;
    } catch (error) {
      console.error('Error in CourseService.getByCode:', error);
      if (error instanceof Error && error.message === 'Course not found') {
        throw error;
      }
      throw new Error('Failed to retrieve course');
    }
  }

  /**
   * Get courses by department
   */
  static async getByDepartment(departmentId: string): Promise<ICourseDocument[]> {
    try {
      const courses = await Course.find({ department: departmentId })
        .sort({ courseCode: 1 })
        .exec();

      return courses;
    } catch (error) {
      console.error('Error in CourseService.getByDepartment:', error);
      throw new Error('Failed to retrieve courses for department');
    }
  }

  /**
   * Create a new course
   */
  static async create(courseData: CreateCourseInput): Promise<ICourseDocument> {
    try {
      // Validate input
      const validation = validateCreateCourse(courseData);
      if (!validation.success) {
        throw new Error(`Validation failed: ${validation.error.issues.map(i => i.message).join(', ')}`);
      }

      const validatedData = validation.data;

      // If department is provided, verify it exists
      if (validatedData.department) {
        const Department = (await import('../../models/departmentModel.js')).Department;
        const departmentExists = await Department.findById(validatedData.department);
        if (!departmentExists) {
          throw new Error('Department not found');
        }
      }

      // Create course
      const course = new Course(validatedData);
      const savedCourse = await course.save();

      // Populate department before returning
      await savedCourse.populate('department', 'name code');

      return savedCourse;
    } catch (error) {
      console.error('Error in CourseService.create:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to create course');
    }
  }

  /**
   * Update course
   */
  static async update(id: string, updateData: UpdateCourseInput): Promise<ICourseDocument> {
    try {
      // Validate input
      const validation = validateUpdateCourse(updateData);
      if (!validation.success) {
        throw new Error(`Validation failed: ${validation.error.issues.map(i => i.message).join(', ')}`);
      }

      const validatedData = validation.data;

      // Check if course exists
      const existingCourse = await Course.findById(id);
      if (!existingCourse) {
        throw new Error('Course not found');
      }

      // If department is being updated, verify it exists
      if (validatedData.department) {
        const Department = (await import('../../models/departmentModel.js')).Department;
        const departmentExists = await Department.findById(validatedData.department);
        if (!departmentExists) {
          throw new Error('Department not found');
        }
      }

      // Update course
      const updatedCourse = await Course.findByIdAndUpdate(
        id,
        validatedData,
        { new: true, runValidators: true }
      )
        .populate('department', 'name code')
        .exec();

      if (!updatedCourse) {
        throw new Error('Failed to update course');
      }

      return updatedCourse;
    } catch (error) {
      console.error('Error in CourseService.update:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to update course');
    }
  }

  /**
   * Delete course
   */
  static async delete(id: string): Promise<void> {
    try {
      // Check if course exists
      const course = await Course.findById(id);
      if (!course) {
        throw new Error('Course not found');
      }

      // TODO: Uncomment when Schedule model is implemented
      // const Schedule = (await import('../../models/scheduleModel.js')).Schedule;
      // const scheduleCount = await Schedule.countDocuments({ course: id });
      // if (scheduleCount > 0) {
      //   throw new Error('Cannot delete course that is referenced in schedules');
      // }

      // Remove course from any departments that reference it
      if (course.department) {
        const Department = (await import('../../models/departmentModel.js')).Department;
        await Department.findByIdAndUpdate(
          course.department,
          { $pull: { courses: id } }
        );
      }

      // Delete the course
      await Course.findByIdAndDelete(id);
    } catch (error) {
      console.error('Error in CourseService.delete:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to delete course');
    }
  }

  /**
   * Check if course exists
   */
  static async exists(id: string): Promise<boolean> {
    try {
      const count = await Course.countDocuments({ _id: id });
      return count > 0;
    } catch (error) {
      console.error('Error in CourseService.exists:', error);
      return false;
    }
  }

  /**
   * Assign course to department
   */
  static async assignToDepartment(courseId: string, departmentId: string): Promise<ICourseDocument> {
    try {
      // Verify course exists
      const course = await Course.findById(courseId);
      if (!course) {
        throw new Error('Course not found');
      }

      // Verify department exists
      const Department = (await import('../../models/departmentModel.js')).Department;
      const department = await Department.findById(departmentId);
      if (!department) {
        throw new Error('Department not found');
      }

      // Update course department reference
      course.department = departmentId as any;
      await course.save();

      // Add course to department's courses array if not already there
      if (!department.courses?.includes(courseId as any)) {
        department.courses = department.courses || [];
        department.courses.push(courseId as any);
        await department.save();
      }

      await course.populate('department', 'name code');
      return course;
    } catch (error) {
      console.error('Error in CourseService.assignToDepartment:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to assign course to department');
    }
  }

  /**
   * Remove course from department
   */
  static async removeFromDepartment(courseId: string): Promise<ICourseDocument> {
    try {
      // Verify course exists
      const course = await Course.findById(courseId);
      if (!course) {
        throw new Error('Course not found');
      }

      const oldDepartmentId = course.department;

      // Remove department reference from course
      course.department = undefined;
      await course.save();

      // Remove course from department's courses array
      if (oldDepartmentId) {
        const Department = (await import('../../models/departmentModel.js')).Department;
        await Department.findByIdAndUpdate(
          oldDepartmentId,
          { $pull: { courses: courseId } }
        );
      }

      return course;
    } catch (error) {
      console.error('Error in CourseService.removeFromDepartment:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to remove course from department');
    }
  }

  /**
   * Get course statistics
   */
  static async getStats(): Promise<any> {
    try {
      return await Course.getStats();
    } catch (error) {
      console.error('Error in CourseService.getStats:', error);
      throw new Error('Failed to retrieve course statistics');
    }
  }
}


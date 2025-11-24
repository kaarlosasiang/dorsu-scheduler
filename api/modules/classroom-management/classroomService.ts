import { Classroom, IClassroomDocument } from '../../models/classroomModel.js';
import { IClassroomFilter } from '../../shared/interfaces/IClassroom.js';
import {
  validateCreateClassroom,
  validateUpdateClassroom,
  CreateClassroomInput,
  UpdateClassroomInput
} from '../../shared/validators/classroomValidator.js';

export class ClassroomService {
  /**
   * Get all classrooms with optional filtering
   */
  static async getAll(filters: IClassroomFilter = {}): Promise<IClassroomDocument[]> {
    try {
      const query: any = {};

      if (filters.roomNumber) {
        query.roomNumber = new RegExp(filters.roomNumber, 'i');
      }

      if (filters.building) {
        query.building = new RegExp(filters.building, 'i');
      }

      if (filters.type) {
        query.type = filters.type;
      }

      if (filters.status) {
        query.status = filters.status;
      }

      if (filters.minCapacity !== undefined || filters.maxCapacity !== undefined) {
        query.capacity = {};
        if (filters.minCapacity !== undefined) {
          query.capacity.$gte = filters.minCapacity;
        }
        if (filters.maxCapacity !== undefined) {
          query.capacity.$lte = filters.maxCapacity;
        }
      }

      const classrooms = await Classroom.find(query)
        .sort({ building: 1, roomNumber: 1 })
        .exec();

      return classrooms;
    } catch (error) {
      console.error('Error in ClassroomService.getAll:', error);
      throw new Error('Failed to retrieve classrooms');
    }
  }

  /**
   * Get classroom by ID
   */
  static async getById(id: string): Promise<IClassroomDocument> {
    try {
      const classroom = await Classroom.findById(id).exec();

      if (!classroom) {
        throw new Error('Classroom not found');
      }

      return classroom;
    } catch (error) {
      console.error('Error in ClassroomService.getById:', error);
      if (error instanceof Error && error.message === 'Classroom not found') {
        throw error;
      }
      throw new Error('Failed to retrieve classroom');
    }
  }

  /**
   * Create a new classroom
   */
  static async create(classroomData: CreateClassroomInput): Promise<IClassroomDocument> {
    try {
      // Validate input
      const validation = validateCreateClassroom(classroomData);
      if (!validation.success) {
        throw new Error(`Validation failed: ${validation.error.issues.map(i => i.message).join(', ')}`);
      }

      const validatedData = validation.data;

      // Create classroom
      const classroom = new Classroom(validatedData);
      const savedClassroom = await classroom.save();

      return savedClassroom;
    } catch (error) {
      console.error('Error in ClassroomService.create:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to create classroom');
    }
  }

  /**
   * Update classroom
   */
  static async update(id: string, updateData: UpdateClassroomInput): Promise<IClassroomDocument> {
    try {
      // Validate input
      const validation = validateUpdateClassroom(updateData);
      if (!validation.success) {
        throw new Error(`Validation failed: ${validation.error.issues.map(i => i.message).join(', ')}`);
      }

      const validatedData = validation.data;

      // Check if classroom exists
      const existingClassroom = await Classroom.findById(id);
      if (!existingClassroom) {
        throw new Error('Classroom not found');
      }

      // Update classroom
      const updatedClassroom = await Classroom.findByIdAndUpdate(
        id,
        validatedData,
        { new: true, runValidators: true }
      ).exec();

      if (!updatedClassroom) {
        throw new Error('Failed to update classroom');
      }

      return updatedClassroom;
    } catch (error) {
      console.error('Error in ClassroomService.update:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to update classroom');
    }
  }

  /**
   * Delete classroom
   */
  static async delete(id: string): Promise<void> {
    try {
      // Check if classroom exists
      const classroom = await Classroom.findById(id);
      if (!classroom) {
        throw new Error('Classroom not found');
      }

      // Check if any schedules are using this classroom
      const Schedule = (await import('../../models/scheduleModel.js')).Schedule;
      const scheduleCount = await Schedule.countDocuments({ classroom: id });
      if (scheduleCount > 0) {
        throw new Error('Cannot delete classroom that is assigned to schedules. Please remove or reassign schedules first.');
      }

      await Classroom.findByIdAndDelete(id);
    } catch (error) {
      console.error('Error in ClassroomService.delete:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to delete classroom');
    }
  }

  /**
   * Check if classroom exists
   */
  static async exists(id: string): Promise<boolean> {
    try {
      const count = await Classroom.countDocuments({ _id: id });
      return count > 0;
    } catch (error) {
      console.error('Error in ClassroomService.exists:', error);
      return false;
    }
  }

  /**
   * Get classroom statistics
   */
  static async getStats(): Promise<any> {
    try {
      return await Classroom.getStats();
    } catch (error) {
      console.error('Error in ClassroomService.getStats:', error);
      throw new Error('Failed to retrieve classroom statistics');
    }
  }

  /**
   * Get available classrooms (not in maintenance or reserved)
   */
  static async getAvailable(): Promise<IClassroomDocument[]> {
    try {
      return await Classroom.find({ status: 'available' })
        .sort({ building: 1, roomNumber: 1 })
        .exec();
    } catch (error) {
      console.error('Error in ClassroomService.getAvailable:', error);
      throw new Error('Failed to retrieve available classrooms');
    }
  }
}


import { Department, IDepartmentDocument } from '../../models/departmentModel.js';
import { IDepartmentFilter } from '../../shared/interfaces/IDepartment.js';
import { 
  validateCreateDepartment, 
  validateUpdateDepartment,
  CreateDepartmentInput,
  UpdateDepartmentInput
} from '../../shared/validators/departmentValidator.js';

export class DepartmentService {
  /**
   * Get all departments with optional filtering
   */
  static async getAll(filters: IDepartmentFilter = {}): Promise<IDepartmentDocument[]> {
    try {
      const query: any = {};
      
      if (filters.name) {
        query.name = new RegExp(filters.name, 'i');
      }
      
      if (filters.code) {
        query.code = new RegExp(filters.code, 'i');
      }

      const departments = await Department.find(query)
        .sort({ name: 1 })
        .exec();

      return departments;
    } catch (error) {
      console.error('Error in DepartmentService.getAll:', error);
      throw new Error('Failed to retrieve departments');
    }
  }

  /**
   * Get department by ID
   */
  static async getById(id: string): Promise<IDepartmentDocument> {
    try {
      const department = await Department.findById(id).exec();

      if (!department) {
        throw new Error('Department not found');
      }

      return department;
    } catch (error) {
      console.error('Error in DepartmentService.getById:', error);
      if (error instanceof Error && error.message === 'Department not found') {
        throw error;
      }
      throw new Error('Failed to retrieve department');
    }
  }

  /**
   * Get department by code
   */
  static async getByCode(code: string): Promise<IDepartmentDocument> {
    try {
      const department = await Department.findOne({ code: code.toUpperCase() }).exec();

      if (!department) {
        throw new Error('Department not found');
      }

      return department;
    } catch (error) {
      console.error('Error in DepartmentService.getByCode:', error);
      if (error instanceof Error && error.message === 'Department not found') {
        throw error;
      }
      throw new Error('Failed to retrieve department');
    }
  }

  /**
   * Create a new department
   */
  static async create(departmentData: CreateDepartmentInput): Promise<IDepartmentDocument> {
    try {
      // Validate input
      const validation = validateCreateDepartment(departmentData);
      if (!validation.success) {
        throw new Error(`Validation failed: ${validation.error.issues.map(i => i.message).join(', ')}`);
      }

      const validatedData = validation.data;

      // Auto-generate code if not provided
      if (!validatedData.code) {
        validatedData.code = await this.generateDepartmentCode(validatedData.name);
      }

      // Create department
      const department = new Department(validatedData);
      const savedDepartment = await department.save();

      return savedDepartment;
    } catch (error) {
      console.error('Error in DepartmentService.create:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to create department');
    }
  }

  /**
   * Update department
   */
  static async update(id: string, updateData: UpdateDepartmentInput): Promise<IDepartmentDocument> {
    try {
      // Validate input
      const validation = validateUpdateDepartment(updateData);
      if (!validation.success) {
        throw new Error(`Validation failed: ${validation.error.issues.map(i => i.message).join(', ')}`);
      }

      const validatedData = validation.data;

      // Check if department exists
      const existingDepartment = await Department.findById(id);
      if (!existingDepartment) {
        throw new Error('Department not found');
      }

      // Update department
      const updatedDepartment = await Department.findByIdAndUpdate(
        id,
        validatedData,
        { new: true, runValidators: true }
      ).exec();

      if (!updatedDepartment) {
        throw new Error('Failed to update department');
      }

      return updatedDepartment;
    } catch (error) {
      console.error('Error in DepartmentService.update:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to update department');
    }
  }

  /**
   * Delete department (soft delete by checking faculty references)
   */
  static async delete(id: string): Promise<void> {
    try {
      // Check if department exists
      const department = await Department.findById(id);
      if (!department) {
        throw new Error('Department not found');
      }

      // Check if any faculty members are assigned to this department
      const Faculty = (await import('../../models/facultyModel.js')).Faculty;
      const facultyCount = await Faculty.countDocuments({ department: id });
      
      if (facultyCount > 0) {
        throw new Error('Cannot delete department with assigned faculty members');
      }

      // Delete the department
      await Department.findByIdAndDelete(id);
    } catch (error) {
      console.error('Error in DepartmentService.delete:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to delete department');
    }
  }

  /**
   * Check if department exists
   */
  static async exists(id: string): Promise<boolean> {
    try {
      const count = await Department.countDocuments({ _id: id });
      return count > 0;
    } catch (error) {
      console.error('Error in DepartmentService.exists:', error);
      return false;
    }
  }

  /**
   * Generate unique department code from name
   */
  private static async generateDepartmentCode(name: string): Promise<string> {
    try {
      // Generate base code from name (first 3-4 characters, uppercase)
      const baseCode = name.replace(/[^A-Za-z0-9]/g, '').substring(0, 4).toUpperCase();
      
      if (baseCode.length < 2) {
        throw new Error('Department name must contain at least 2 alphanumeric characters');
      }

      let code = baseCode;
      let counter = 1;

      // Ensure uniqueness
      while (await Department.findOne({ code })) {
        code = `${baseCode}${counter}`;
        counter++;
        if (counter > 999) {
          throw new Error('Unable to generate unique department code');
        }
      }

      return code;
    } catch (error) {
      console.error('Error generating department code:', error);
      throw new Error('Failed to generate department code');
    }
  }

  /**
   * Get departments stats
   */
  static async getStats(): Promise<any> {
    try {
      return await Department.getStats();
    } catch (error) {
      console.error('Error in DepartmentService.getStats:', error);
      throw new Error('Failed to retrieve department statistics');
    }
  }
}
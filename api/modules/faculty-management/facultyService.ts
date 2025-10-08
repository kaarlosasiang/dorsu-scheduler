import { Faculty, IFacultyDocument } from '../../models/facultyModel.js';
import { IFacultyFilter } from '../../shared/interfaces/IFaculty.js';
import { 
  validateCreateFaculty, 
  validateUpdateFaculty, 
  validateAvailability,
  validateWorkloadUpdate,
  validateStatusUpdate,
  CreateFacultyInput,
  UpdateFacultyInput,
  AvailabilityInput,
  WorkloadUpdateInput,
  StatusUpdateInput
} from '../../shared/validators/facultyValidator.js';
import { ERROR_MESSAGES } from '../../config/constants.js';

// Event emitter for integration hooks (placeholder for future implementation)
class EventEmitter {
  static emit(event: string, data: any) {
    // TODO: Implement actual event emission when needed
    console.log(`Event emitted: ${event}`, data);
  }
}

export class FacultyService {
  /**
   * Get all faculty with optional filtering
   */
  static async getAll(filters: IFacultyFilter = {}): Promise<IFacultyDocument[]> {
    try {
      const query: any = {};
      
      if (filters.department) {
        query.department = new RegExp(filters.department, 'i');
      }
      
      if (filters.status) {
        query.status = filters.status;
      }

      const faculty = await Faculty.find(query).sort({ name: 1 });
      
      // Emit event for potential integration hooks
      EventEmitter.emit('faculty.queried', { filters, count: faculty.length });
      
      return faculty;
    } catch (error) {
      throw new Error(`Failed to fetch faculty: ${error}`);
    }
  }

  /**
   * Get faculty by ID
   */
  static async getById(id: string): Promise<IFacultyDocument> {
    try {
      const faculty = await Faculty.findById(id);
      
      if (!faculty) {
        throw new Error('Faculty not found');
      }

      // Emit event for potential integration hooks
      EventEmitter.emit('faculty.retrieved', { facultyId: id });
      
      return faculty;
    } catch (error) {
      if (error instanceof Error && error.message === 'Faculty not found') {
        throw error;
      }
      throw new Error(`Failed to fetch faculty: ${error}`);
    }
  }

  /**
   * Create new faculty
   */
  static async create(data: CreateFacultyInput): Promise<IFacultyDocument> {
    try {
      // Validate input data
      const validation = validateCreateFaculty(data);
      if (!validation.success) {
        const errors = validation.error.issues.map(err => `${err.path.join('.')}: ${err.message}`);
        throw new Error(`Validation error: ${errors.join(', ')}`);
      }

      const validatedData = validation.data;

      // Check for duplicate faculty name in department
      const existingFaculty = await Faculty.findOne({
        name: new RegExp(`^${validatedData.name}$`, 'i'),
        department: validatedData.department
      });

      if (existingFaculty) {
        throw new Error('Faculty with this name already exists in the department');
      }

      const faculty = new Faculty(validatedData);
      await faculty.save();

      // Emit event for potential integration hooks
      EventEmitter.emit('faculty.created', { 
        facultyId: faculty._id, 
        department: faculty.department,
        name: faculty.name 
      });
      
      return faculty;
    } catch (error) {
      throw new Error(`Failed to create faculty: ${error}`);
    }
  }

  /**
   * Update faculty by ID
   */
  static async update(id: string, data: UpdateFacultyInput): Promise<IFacultyDocument> {
    try {
      // Validate input data
      const validation = validateUpdateFaculty(data);
      if (!validation.success) {
        const errors = validation.error.issues.map(err => `${err.path.join('.')}: ${err.message}`);
        throw new Error(`Validation error: ${errors.join(', ')}`);
      }

      const validatedData = validation.data;

      // Check if faculty exists
      const existingFaculty = await Faculty.findById(id);
      if (!existingFaculty) {
        throw new Error('Faculty not found');
      }

      // Check for duplicate name if updating name or department
      if (validatedData.name || validatedData.department) {
        const duplicateQuery: any = {
          _id: { $ne: id }
        };
        
        if (validatedData.name) {
          duplicateQuery.name = new RegExp(`^${validatedData.name}$`, 'i');
        } else {
          duplicateQuery.name = new RegExp(`^${existingFaculty.name}$`, 'i');
        }
        
        if (validatedData.department) {
          duplicateQuery.department = validatedData.department;
        } else {
          duplicateQuery.department = existingFaculty.department;
        }

        const duplicateFaculty = await Faculty.findOne(duplicateQuery);
        if (duplicateFaculty) {
          throw new Error('Faculty with this name already exists in the department');
        }
      }

      // Update faculty
      const updatedFaculty = await Faculty.findByIdAndUpdate(
        id,
        validatedData,
        { new: true, runValidators: true }
      );

      if (!updatedFaculty) {
        throw new Error('Faculty not found');
      }

      // Emit event for potential integration hooks
      EventEmitter.emit('faculty.updated', { 
        facultyId: id, 
        changes: Object.keys(validatedData),
        department: updatedFaculty.department 
      });
      
      return updatedFaculty;
    } catch (error) {
      throw new Error(`Failed to update faculty: ${error}`);
    }
  }

  /**
   * Remove faculty by ID
   */
  static async remove(id: string): Promise<void> {
    try {
      const faculty = await Faculty.findById(id);
      if (!faculty) {
        throw new Error('Faculty not found');
      }

      await Faculty.findByIdAndDelete(id);

      // Emit event for potential integration hooks
      EventEmitter.emit('faculty.deleted', { 
        facultyId: id, 
        department: faculty.department,
        name: faculty.name 
      });
    } catch (error) {
      throw new Error(`Failed to remove faculty: ${error}`);
    }
  }

  /**
   * Update faculty availability
   */
  static async updateAvailability(id: string, availability: AvailabilityInput): Promise<IFacultyDocument> {
    try {
      // Validate availability data
      const validation = validateAvailability(availability);
      if (!validation.success) {
        const errors = validation.error.issues.map(err => `${err.path.join('.')}: ${err.message}`);
        throw new Error(`Validation error: ${errors.join(', ')}`);
      }

      const validatedAvailability = validation.data;

      const updatedFaculty = await Faculty.findByIdAndUpdate(
        id,
        { availability: validatedAvailability },
        { new: true, runValidators: true }
      );

      if (!updatedFaculty) {
        throw new Error('Faculty not found');
      }

      // Emit event for potential integration hooks
      EventEmitter.emit('faculty.availability.updated', { 
        facultyId: id,
        availabilityCount: validatedAvailability.length 
      });
      
      return updatedFaculty;
    } catch (error) {
      throw new Error(`Failed to update availability: ${error}`);
    }
  }

  /**
   * Update faculty workload
   */
  static async updateWorkload(id: string, workloadData: WorkloadUpdateInput): Promise<IFacultyDocument> {
    try {
      // Validate workload data
      const validation = validateWorkloadUpdate(workloadData);
      if (!validation.success) {
        const errors = validation.error.issues.map(err => `${err.path.join('.')}: ${err.message}`);
        throw new Error(`Validation error: ${errors.join(', ')}`);
      }

      const { hours } = validation.data;

      const faculty = await Faculty.findById(id);
      if (!faculty) {
        throw new Error('Faculty not found');
      }

      // Check if new workload exceeds max load
      if (hours > (faculty.maxLoad || 18)) {
        throw new Error(`Workload (${hours}) cannot exceed maximum load (${faculty.maxLoad || 18})`);
      }

      const updatedFaculty = await Faculty.findByIdAndUpdate(
        id,
        { currentLoad: hours },
        { new: true, runValidators: true }
      );

      if (!updatedFaculty) {
        throw new Error('Faculty not found');
      }

      // Emit event for potential integration hooks
      EventEmitter.emit('faculty.workload.updated', { 
        facultyId: id,
        oldLoad: faculty.currentLoad,
        newLoad: hours,
        maxLoad: faculty.maxLoad
      });
      
      return updatedFaculty;
    } catch (error) {
      throw new Error(`Failed to update workload: ${error}`);
    }
  }

  /**
   * Set faculty status (activate/deactivate)
   */
  static async setStatus(id: string, statusData: StatusUpdateInput): Promise<IFacultyDocument> {
    try {
      // Validate status data
      const validation = validateStatusUpdate(statusData);
      if (!validation.success) {
        const errors = validation.error.issues.map(err => `${err.path.join('.')}: ${err.message}`);
        throw new Error(`Validation error: ${errors.join(', ')}`);
      }

      const { status } = validation.data;

      const updatedFaculty = await Faculty.findByIdAndUpdate(
        id,
        { status },
        { new: true, runValidators: true }
      );

      if (!updatedFaculty) {
        throw new Error('Faculty not found');
      }

      // Emit event for potential integration hooks
      EventEmitter.emit('faculty.status.updated', { 
        facultyId: id,
        newStatus: status,
        department: updatedFaculty.department
      });
      
      return updatedFaculty;
    } catch (error) {
      throw new Error(`Failed to update status: ${error}`);
    }
  }

  /**
   * Get faculty statistics
   */
  static async getStats(department?: string): Promise<{
    total: number;
    active: number;
    inactive: number;
    totalWorkload: number;
    averageWorkload: number;
    departments: string[];
  }> {
    try {
      const query = department ? { department: new RegExp(department, 'i') } : {};
      const faculty = await Faculty.find(query);

      const stats = {
        total: faculty.length,
        active: faculty.filter(f => f.status === 'active').length,
        inactive: faculty.filter(f => f.status === 'inactive').length,
        totalWorkload: faculty.reduce((sum, f) => sum + (f.currentLoad || 0), 0),
        averageWorkload: 0,
        departments: [...new Set(faculty.map(f => f.department))]
      };

      stats.averageWorkload = stats.total > 0 ? stats.totalWorkload / stats.total : 0;

      return stats;
    } catch (error) {
      throw new Error(`Failed to get faculty statistics: ${error}`);
    }
  }
}
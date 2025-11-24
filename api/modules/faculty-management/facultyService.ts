import { Faculty, IFacultyDocument } from '../../models/facultyModel.js';
import { Department } from '../../models/departmentModel.js';
import { IFacultyFilter } from '../../shared/interfaces/IFaculty.js';
import { 
  validateCreateFaculty, 
  validateUpdateFaculty, 
  validateWorkloadUpdate,
  validatePreparationUpdate,
  validateStatusUpdate,
  CreateFacultyInput,
  UpdateFacultyInput,
  WorkloadUpdateInput,
  PreparationUpdateInput,
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
      
      // Handle department filtering - can be by ObjectId or department name search
      if (filters.department) {
        // Check if it's a valid ObjectId first
        if (/^[0-9a-fA-F]{24}$/.test(filters.department)) {
          query.department = filters.department;
        } else {
          // Search by department name - first find matching departments
          const departments = await Department.find({
            name: new RegExp(filters.department, 'i'),
            status: 'active'
          }).select('_id');
          
          if (departments.length > 0) {
            query.department = { $in: departments.map(d => d._id) };
          } else {
            // No matching departments found, return empty array
            return [];
          }
        }
      }

      if (filters.departmentId) {
        query.department = filters.departmentId;
      }
      
      if (filters.status) {
        query.status = filters.status;
      }

      if (filters.employmentType) {
        query.employmentType = filters.employmentType;
      }

      if (filters.email) {
        query.email = new RegExp(filters.email, 'i');
      }

      const faculty = await Faculty.find(query)
        .populate('department', 'name code college status')
        .sort({ 'name.last': 1, 'name.first': 1 });
      
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
      const faculty = await Faculty.findById(id)
        .populate('department', 'name code college status');
      
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
   * Get faculty by email
   */
  static async getByEmail(email: string): Promise<IFacultyDocument> {
    try {
      const faculty = await Faculty.findOne({ email: email.toLowerCase() })
        .populate('department', 'name code college status');
      
      if (!faculty) {
        throw new Error('Faculty not found');
      }

      // Emit event for potential integration hooks
      EventEmitter.emit('faculty.retrieved', { facultyEmail: email });
      
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

        // Validate department exists
        if (validatedData.department) {
          const department = await Department.findById(validatedData.department);
          if (!department) {
            throw new Error('Department not found');
          }
        }      // Check for duplicate email
      const existingEmail = await Faculty.findOne({
        email: validatedData.email
      });

      if (existingEmail) {
        throw new Error('Faculty with this email already exists');
      }

      // Check for duplicate faculty name in department
      const existingFaculty = await Faculty.findOne({
        'name.first': new RegExp(`^${validatedData.name.first}$`, 'i'),
        'name.last': new RegExp(`^${validatedData.name.last}$`, 'i'),
        department: validatedData.department
      });

      if (existingFaculty) {
        throw new Error('Faculty with this name already exists in the department');
      }

      const faculty = new Faculty(validatedData);
      await faculty.save();

      // Populate the department for response
      await faculty.populate('department', 'name code college status');

      // Emit event for potential integration hooks
      EventEmitter.emit('faculty.created', { 
        facultyId: faculty._id, 
        department: faculty.department,
        name: faculty.name,
        employmentType: faculty.employmentType
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

      // Check for duplicate email if updating email
      if (validatedData.email && validatedData.email !== existingFaculty.email) {
        const duplicateEmail = await Faculty.findOne({
          email: validatedData.email,
          _id: { $ne: id }
        });

        if (duplicateEmail) {
          throw new Error('Faculty with this email already exists');
        }
      }

      // Validate department if updating
      if (validatedData.department) {
        const department = await Department.findById(validatedData.department);
        if (!department) {
          throw new Error('Department not found');
        }
      }

      // Check for duplicate name if updating name or department
      if (validatedData.name || validatedData.department) {
        const duplicateQuery: any = {
          _id: { $ne: id }
        };
        
        if (validatedData.name) {
          duplicateQuery['name.first'] = new RegExp(`^${validatedData.name.first}$`, 'i');
          duplicateQuery['name.last'] = new RegExp(`^${validatedData.name.last}$`, 'i');
        } else {
          duplicateQuery['name.first'] = new RegExp(`^${existingFaculty.name.first}$`, 'i');
          duplicateQuery['name.last'] = new RegExp(`^${existingFaculty.name.last}$`, 'i');
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
      ).populate('department', 'name code college status');

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

      // Check if any schedules are assigned to this faculty
      const Schedule = (await import('../../models/scheduleModel.js')).Schedule;
      const scheduleCount = await Schedule.countDocuments({ faculty: id });
      if (scheduleCount > 0) {
        throw new Error('Cannot delete faculty who is assigned to schedules. Please remove or reassign schedules first.');
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
      if (hours > (faculty.maxLoad || 26)) {
        throw new Error(`Workload (${hours}) cannot exceed maximum load (${faculty.maxLoad || 26})`);
      }

      // Check if new workload is below min load
      if (hours < (faculty.minLoad || 18)) {
        throw new Error(`Workload (${hours}) cannot be below minimum load (${faculty.minLoad || 18})`);
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
        maxLoad: faculty.maxLoad,
        minLoad: faculty.minLoad
      });
      
      return updatedFaculty;
    } catch (error) {
      throw new Error(`Failed to update workload: ${error}`);
    }
  }

  /**
   * Update faculty preparations
   */
  static async updatePreparations(id: string, preparationData: PreparationUpdateInput): Promise<IFacultyDocument> {
    try {
      // Validate preparation data
      const validation = validatePreparationUpdate(preparationData);
      if (!validation.success) {
        const errors = validation.error.issues.map(err => `${err.path.join('.')}: ${err.message}`);
        throw new Error(`Validation error: ${errors.join(', ')}`);
      }

      const { preparations } = validation.data;

      const faculty = await Faculty.findById(id);
      if (!faculty) {
        throw new Error('Faculty not found');
      }

      // Check if new preparations exceed max preparations
      if (preparations > (faculty.maxPreparations || 4)) {
        throw new Error(`Preparations (${preparations}) cannot exceed maximum preparations (${faculty.maxPreparations || 4})`);
      }

      const updatedFaculty = await Faculty.findByIdAndUpdate(
        id,
        { currentPreparations: preparations },
        { new: true, runValidators: true }
      );

      if (!updatedFaculty) {
        throw new Error('Faculty not found');
      }

      // Emit event for potential integration hooks
      EventEmitter.emit('faculty.preparations.updated', { 
        facultyId: id,
        oldPreparations: faculty.currentPreparations,
        newPreparations: preparations,
        maxPreparations: faculty.maxPreparations
      });
      
      return updatedFaculty;
    } catch (error) {
      throw new Error(`Failed to update preparations: ${error}`);
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
    fullTime: number;
    partTime: number;
    totalWorkload: number;
    averageWorkload: number;
    totalPreparations: number;
    averagePreparations: number;
    departments: string[];
  }> {
    try {
      const query = department ? { department: new RegExp(department, 'i') } : {};
      const faculty = await Faculty.find(query);

      const stats = {
        total: faculty.length,
        active: faculty.filter(f => f.status === 'active').length,
        inactive: faculty.filter(f => f.status === 'inactive').length,
        fullTime: faculty.filter(f => f.employmentType === 'full-time').length,
        partTime: faculty.filter(f => f.employmentType === 'part-time').length,
        totalWorkload: faculty.reduce((sum, f) => sum + (f.currentLoad || 0), 0),
        averageWorkload: 0,
        totalPreparations: faculty.reduce((sum, f) => sum + (f.currentPreparations || 0), 0),
        averagePreparations: 0,
        departments: [...new Set(faculty.map(f => f.department))]
      };

      stats.averageWorkload = stats.total > 0 ? stats.totalWorkload / stats.total : 0;
      stats.averagePreparations = stats.total > 0 ? stats.totalPreparations / stats.total : 0;

      return stats;
    } catch (error) {
      throw new Error(`Failed to get faculty statistics: ${error}`);
    }
  }
}
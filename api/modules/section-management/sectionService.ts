import { Section, ISectionDocument } from '../../models/sectionModel.js';

export interface ISectionFilter {
  program?: string;
  yearLevel?: string;
  status?: string;
}

export class SectionService {
  static async getAll(filters: ISectionFilter = {}): Promise<ISectionDocument[]> {
    try {
      const query: any = {};

      if (filters.program) query.program = filters.program;
      if (filters.yearLevel) query.yearLevel = filters.yearLevel;
      if (filters.status) query.status = filters.status;

      return await Section.find(query)
        .populate('program', 'courseCode courseName')
        .sort({ yearLevel: 1, sectionCode: 1 })
        .exec();
    } catch (error) {
      console.error('Error in SectionService.getAll:', error);
      throw new Error('Failed to retrieve sections');
    }
  }

  static async getById(id: string): Promise<ISectionDocument> {
    try {
      const section = await Section.findById(id)
        .populate('program', 'courseCode courseName')
        .exec();

      if (!section) throw new Error('Section not found');
      return section;
    } catch (error) {
      console.error('Error in SectionService.getById:', error);
      if (error instanceof Error && error.message === 'Section not found') throw error;
      throw new Error('Failed to retrieve section');
    }
  }

  static async getByProgram(programId: string): Promise<ISectionDocument[]> {
    try {
      return await Section.find({ program: programId })
        .populate('program', 'courseCode courseName')
        .sort({ yearLevel: 1, sectionCode: 1 })
        .exec();
    } catch (error) {
      console.error('Error in SectionService.getByProgram:', error);
      throw new Error('Failed to retrieve sections for program');
    }
  }

  static async getByProgramAndYearLevel(programId: string, yearLevel: string): Promise<ISectionDocument[]> {
    try {
      return await Section.find({ program: programId, yearLevel, status: 'active' })
        .populate('program', 'courseCode courseName')
        .sort({ sectionCode: 1 })
        .exec();
    } catch (error) {
      console.error('Error in SectionService.getByProgramAndYearLevel:', error);
      throw new Error('Failed to retrieve sections');
    }
  }

  static async create(data: {
    program: string;
    yearLevel: string;
    sectionCode: string;
    capacity?: number;
    status?: string;
  }): Promise<ISectionDocument> {
    try {
      const Course = (await import('../../models/courseModel.js')).Course;
      const courseExists = await Course.findById(data.program);
      if (!courseExists) throw new Error('Program not found');

      const section = new Section(data);
      const saved = await section.save();
      await saved.populate('program', 'courseCode courseName');
      return saved;
    } catch (error) {
      console.error('Error in SectionService.create:', error);
      if (error instanceof Error) throw error;
      throw new Error('Failed to create section');
    }
  }

  static async update(
    id: string,
    data: Partial<{ sectionCode: string; capacity: number; status: string }>
  ): Promise<ISectionDocument> {
    try {
      const section = await Section.findById(id);
      if (!section) throw new Error('Section not found');

      if (data.sectionCode !== undefined) section.sectionCode = data.sectionCode;
      if (data.capacity !== undefined) section.capacity = data.capacity;
      if (data.status !== undefined) section.status = data.status as 'active' | 'inactive';

      const saved = await section.save();
      await saved.populate('program', 'courseCode courseName');
      return saved;
    } catch (error) {
      console.error('Error in SectionService.update:', error);
      if (error instanceof Error) throw error;
      throw new Error('Failed to update section');
    }
  }

  static async delete(id: string): Promise<void> {
    try {
      const section = await Section.findById(id);
      if (!section) throw new Error('Section not found');

      const Schedule = (await import('../../models/scheduleModel.js')).Schedule;
      const scheduleCount = await Schedule.countDocuments({
        section: id,
        status: { $ne: 'archived' },
      });
      if (scheduleCount > 0) {
        throw new Error(
          'Cannot delete section that has active schedules. Archive or remove the schedules first.'
        );
      }

      await Section.findByIdAndDelete(id);
    } catch (error) {
      console.error('Error in SectionService.delete:', error);
      if (error instanceof Error) throw error;
      throw new Error('Failed to delete section');
    }
  }
}

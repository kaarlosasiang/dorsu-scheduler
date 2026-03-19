import { Request, Response } from 'express';
import { SectionService } from './sectionService.js';
import mongoose from 'mongoose';

function isValidObjectId(id: string): boolean {
  return mongoose.Types.ObjectId.isValid(id);
}

export class SectionController {
  static async getAll(req: Request, res: Response): Promise<void> {
    try {
      const { program, yearLevel, status } = req.query;
      const sections = await SectionService.getAll({
        program: program as string,
        yearLevel: yearLevel as string,
        status: status as string,
      });

      res.status(200).json({
        success: true,
        message: 'Sections retrieved successfully',
        data: sections,
        count: sections.length,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Internal server error',
      });
    }
  }

  static async getById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      if (!isValidObjectId(id)) {
        res.status(400).json({ success: false, message: 'Invalid section ID format' });
        return;
      }

      const section = await SectionService.getById(id);
      res.status(200).json({ success: true, message: 'Section retrieved successfully', data: section });
    } catch (error) {
      const statusCode = error instanceof Error && error.message === 'Section not found' ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        message: error instanceof Error ? error.message : 'Internal server error',
      });
    }
  }

  static async getByProgram(req: Request, res: Response): Promise<void> {
    try {
      const { programId } = req.params;
      if (!isValidObjectId(programId)) {
        res.status(400).json({ success: false, message: 'Invalid program ID format' });
        return;
      }

      const sections = await SectionService.getByProgram(programId);
      res.status(200).json({
        success: true,
        message: 'Sections retrieved successfully',
        data: sections,
        count: sections.length,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Internal server error',
      });
    }
  }

  static async getByProgramAndYearLevel(req: Request, res: Response): Promise<void> {
    try {
      const { programId, yearLevel } = req.params;
      if (!isValidObjectId(programId)) {
        res.status(400).json({ success: false, message: 'Invalid program ID format' });
        return;
      }

      const decodedYearLevel = decodeURIComponent(yearLevel);
      const sections = await SectionService.getByProgramAndYearLevel(programId, decodedYearLevel);
      res.status(200).json({
        success: true,
        message: 'Sections retrieved successfully',
        data: sections,
        count: sections.length,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Internal server error',
      });
    }
  }

  static async create(req: Request, res: Response): Promise<void> {
    try {
      const { program, yearLevel, sectionCode, capacity, status } = req.body;

      if (!program || !yearLevel || !sectionCode) {
        res.status(400).json({
          success: false,
          message: 'program, yearLevel, and sectionCode are required',
        });
        return;
      }

      if (!isValidObjectId(program)) {
        res.status(400).json({ success: false, message: 'Invalid program ID format' });
        return;
      }

      const section = await SectionService.create({ program, yearLevel, sectionCode, capacity, status });
      res.status(201).json({ success: true, message: 'Section created successfully', data: section });
    } catch (error) {
      let statusCode = 400;
      if (error instanceof Error) {
        if (error.message === 'Program not found') statusCode = 404;
        else if (error.message.includes('duplicate key') || error.message.includes('E11000')) statusCode = 409;
      }
      res.status(statusCode).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to create section',
      });
    }
  }

  static async update(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      if (!isValidObjectId(id)) {
        res.status(400).json({ success: false, message: 'Invalid section ID format' });
        return;
      }

      const { sectionCode, capacity, status } = req.body;
      const section = await SectionService.update(id, { sectionCode, capacity, status });
      res.status(200).json({ success: true, message: 'Section updated successfully', data: section });
    } catch (error) {
      let statusCode = 400;
      if (error instanceof Error && error.message === 'Section not found') statusCode = 404;
      res.status(statusCode).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to update section',
      });
    }
  }

  static async delete(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      if (!isValidObjectId(id)) {
        res.status(400).json({ success: false, message: 'Invalid section ID format' });
        return;
      }

      await SectionService.delete(id);
      res.status(200).json({ success: true, message: 'Section deleted successfully' });
    } catch (error) {
      let statusCode = 400;
      if (error instanceof Error) {
        if (error.message === 'Section not found') statusCode = 404;
        else if (error.message.includes('Cannot delete')) statusCode = 409;
      }
      res.status(statusCode).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to delete section',
      });
    }
  }
}

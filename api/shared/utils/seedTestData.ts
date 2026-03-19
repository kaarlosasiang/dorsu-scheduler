/**
 * Seed script for DORSU Scheduler
 * Usage: pnpm --filter api seed
 *
 * Seeds programs (courses) then faculty members.
 * Safe to re-run: uses upsert for programs, skips existing faculty by email.
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: resolve(__dirname, '../../.env') });

// ─── Models ──────────────────────────────────────────────────────────────────

import { Course } from '../../models/courseModel.js';
import { Faculty } from '../../models/facultyModel.js';
import { Subject } from '../../models/subjectModel.js';
import { Classroom } from '../../models/classroomModel.js';
import { Schedule } from '../../models/scheduleModel.js';
import { Section } from '../../models/sectionModel.js';

// ─── Seed Data ────────────────────────────────────────────────────────────────

// ─── Classroom Seed Data ─────────────────────────────────────────────────────

type ClassroomSeed = {
  roomNumber: string;
  building?: string;
  capacity: number;
  type?: 'lecture' | 'laboratory' | 'computer-lab' | 'conference' | 'other';
  facilities?: string[];
  status?: 'available' | 'maintenance' | 'reserved';
};

const CLASSROOMS_SEED: ClassroomSeed[] = [
  // ── Main Building ──────────────────────────────────────────────────────────
  { roomNumber: 'MB-101', building: 'Main Building', capacity: 45, type: 'lecture',      facilities: ['projector', 'whiteboard', 'air-conditioning'] },
  { roomNumber: 'MB-102', building: 'Main Building', capacity: 45, type: 'lecture',      facilities: ['projector', 'whiteboard', 'air-conditioning'] },
  { roomNumber: 'MB-103', building: 'Main Building', capacity: 45, type: 'lecture',      facilities: ['projector', 'whiteboard'] },
  { roomNumber: 'MB-104', building: 'Main Building', capacity: 45, type: 'lecture',      facilities: ['projector', 'whiteboard'] },
  { roomNumber: 'MB-105', building: 'Main Building', capacity: 60, type: 'lecture',      facilities: ['projector', 'whiteboard', 'air-conditioning', 'smart-board'] },
  { roomNumber: 'MB-201', building: 'Main Building', capacity: 45, type: 'lecture',      facilities: ['projector', 'whiteboard', 'air-conditioning'] },
  { roomNumber: 'MB-202', building: 'Main Building', capacity: 45, type: 'lecture',      facilities: ['projector', 'whiteboard', 'air-conditioning'] },
  { roomNumber: 'MB-203', building: 'Main Building', capacity: 45, type: 'lecture',      facilities: ['projector', 'whiteboard'] },
  { roomNumber: 'MB-204', building: 'Main Building', capacity: 45, type: 'lecture',      facilities: ['projector', 'whiteboard'] },
  { roomNumber: 'MB-205', building: 'Main Building', capacity: 100, type: 'lecture',     facilities: ['projector', 'whiteboard', 'air-conditioning', 'microphone'] },

  // ── IT Building ────────────────────────────────────────────────────────────
  { roomNumber: 'IT-Lab1', building: 'IT Building', capacity: 40, type: 'computer-lab',  facilities: ['computers', 'projector', 'air-conditioning', 'internet'] },
  { roomNumber: 'IT-Lab2', building: 'IT Building', capacity: 40, type: 'computer-lab',  facilities: ['computers', 'projector', 'air-conditioning', 'internet'] },
  { roomNumber: 'IT-Lab3', building: 'IT Building', capacity: 35, type: 'computer-lab',  facilities: ['computers', 'projector', 'air-conditioning', 'internet'] },
  { roomNumber: 'IT-101',  building: 'IT Building', capacity: 50, type: 'lecture',       facilities: ['projector', 'whiteboard', 'air-conditioning'] },
  { roomNumber: 'IT-102',  building: 'IT Building', capacity: 50, type: 'lecture',       facilities: ['projector', 'whiteboard', 'air-conditioning'] },

  // ── Science Building ───────────────────────────────────────────────────────
  { roomNumber: 'SCI-Lab1', building: 'Science Building', capacity: 30, type: 'laboratory', facilities: ['lab-equipment', 'whiteboard', 'exhaust-fan', 'safety-equipment'] },
  { roomNumber: 'SCI-Lab2', building: 'Science Building', capacity: 30, type: 'laboratory', facilities: ['lab-equipment', 'whiteboard', 'exhaust-fan', 'safety-equipment'] },
  { roomNumber: 'SCI-Lab3', building: 'Science Building', capacity: 30, type: 'laboratory', facilities: ['lab-equipment', 'whiteboard', 'exhaust-fan'] },
  { roomNumber: 'SCI-101',  building: 'Science Building', capacity: 45, type: 'lecture',    facilities: ['projector', 'whiteboard'] },
  { roomNumber: 'SCI-102',  building: 'Science Building', capacity: 45, type: 'lecture',    facilities: ['projector', 'whiteboard'] },

  // ── Agriculture Building ───────────────────────────────────────────────────
  { roomNumber: 'AGR-Lab1', building: 'Agriculture Building', capacity: 30, type: 'laboratory', facilities: ['lab-equipment', 'whiteboard', 'exhaust-fan'] },
  { roomNumber: 'AGR-Lab2', building: 'Agriculture Building', capacity: 30, type: 'laboratory', facilities: ['lab-equipment', 'whiteboard'] },
  { roomNumber: 'AGR-101',  building: 'Agriculture Building', capacity: 40, type: 'lecture',    facilities: ['projector', 'whiteboard'] },
  { roomNumber: 'AGR-102',  building: 'Agriculture Building', capacity: 40, type: 'lecture',    facilities: ['projector', 'whiteboard'] },
  { roomNumber: 'AGR-103',  building: 'Agriculture Building', capacity: 40, type: 'lecture',    facilities: ['whiteboard'] },

  // ── Business Building ──────────────────────────────────────────────────────
  { roomNumber: 'BUS-101', building: 'Business Building', capacity: 50, type: 'lecture',    facilities: ['projector', 'whiteboard', 'air-conditioning'] },
  { roomNumber: 'BUS-102', building: 'Business Building', capacity: 50, type: 'lecture',    facilities: ['projector', 'whiteboard', 'air-conditioning'] },
  { roomNumber: 'BUS-103', building: 'Business Building', capacity: 50, type: 'lecture',    facilities: ['projector', 'whiteboard'] },
  { roomNumber: 'BUS-104', building: 'Business Building', capacity: 50, type: 'lecture',    facilities: ['projector', 'whiteboard'] },
  { roomNumber: 'BUS-Conf', building: 'Business Building', capacity: 20, type: 'conference', facilities: ['projector', 'whiteboard', 'air-conditioning', 'video-conferencing'] },

  // ── Education Building ─────────────────────────────────────────────────────
  { roomNumber: 'ED-101', building: 'Education Building', capacity: 45, type: 'lecture',   facilities: ['projector', 'whiteboard'] },
  { roomNumber: 'ED-102', building: 'Education Building', capacity: 45, type: 'lecture',   facilities: ['projector', 'whiteboard'] },
  { roomNumber: 'ED-103', building: 'Education Building', capacity: 45, type: 'lecture',   facilities: ['projector', 'whiteboard'] },
  { roomNumber: 'ED-104', building: 'Education Building', capacity: 45, type: 'lecture',   facilities: ['whiteboard'] },
  { roomNumber: 'ED-201', building: 'Education Building', capacity: 45, type: 'lecture',   facilities: ['projector', 'whiteboard', 'air-conditioning'] },

  // ── Gymnasium / Multi-purpose ──────────────────────────────────────────────
  { roomNumber: 'GYM-Hall', building: 'Gymnasium', capacity: 200, type: 'other',           facilities: ['microphone', 'sound-system', 'projector'] },
];

const PROGRAMS = [
  { courseCode: 'BSIT',  courseName: 'Bachelor of Science in Information Technology' },
  { courseCode: 'BSA',   courseName: 'Bachelor of Science in Agriculture' },
  { courseCode: 'BSBA',  courseName: 'Bachelor of Science in Business Administration' },
  { courseCode: 'BSEd',  courseName: 'Bachelor of Secondary Education' },
];

// ─── Section Seed Data ───────────────────────────────────────────────────────
// 2 sections per year level for 1st–3rd Year, 1 section for 4th Year

type SectionSeed = {
  program: string; // courseCode
  yearLevel: '1st Year' | '2nd Year' | '3rd Year' | '4th Year';
  sectionCode: string;
};

const SECTIONS_SEED: SectionSeed[] = [
  // ── BSIT ─────────────────────────────────────────────────────────────────
  { program: 'BSIT', yearLevel: '1st Year', sectionCode: 'A' },
  { program: 'BSIT', yearLevel: '1st Year', sectionCode: 'B' },
  { program: 'BSIT', yearLevel: '2nd Year', sectionCode: 'A' },
  { program: 'BSIT', yearLevel: '2nd Year', sectionCode: 'B' },
  { program: 'BSIT', yearLevel: '3rd Year', sectionCode: 'A' },
  { program: 'BSIT', yearLevel: '3rd Year', sectionCode: 'B' },
  { program: 'BSIT', yearLevel: '4th Year', sectionCode: 'A' },
  // ── BSA ──────────────────────────────────────────────────────────────────
  { program: 'BSA', yearLevel: '1st Year', sectionCode: 'A' },
  { program: 'BSA', yearLevel: '1st Year', sectionCode: 'B' },
  { program: 'BSA', yearLevel: '2nd Year', sectionCode: 'A' },
  { program: 'BSA', yearLevel: '2nd Year', sectionCode: 'B' },
  { program: 'BSA', yearLevel: '3rd Year', sectionCode: 'A' },
  { program: 'BSA', yearLevel: '4th Year', sectionCode: 'A' },
  // ── BSBA ─────────────────────────────────────────────────────────────────
  { program: 'BSBA', yearLevel: '1st Year', sectionCode: 'A' },
  { program: 'BSBA', yearLevel: '1st Year', sectionCode: 'B' },
  { program: 'BSBA', yearLevel: '2nd Year', sectionCode: 'A' },
  { program: 'BSBA', yearLevel: '2nd Year', sectionCode: 'B' },
  { program: 'BSBA', yearLevel: '3rd Year', sectionCode: 'A' },
  { program: 'BSBA', yearLevel: '4th Year', sectionCode: 'A' },
  // ── BSEd ─────────────────────────────────────────────────────────────────
  { program: 'BSEd', yearLevel: '1st Year', sectionCode: 'A' },
  { program: 'BSEd', yearLevel: '1st Year', sectionCode: 'B' },
  { program: 'BSEd', yearLevel: '2nd Year', sectionCode: 'A' },
  { program: 'BSEd', yearLevel: '2nd Year', sectionCode: 'B' },
  { program: 'BSEd', yearLevel: '3rd Year', sectionCode: 'A' },
  { program: 'BSEd', yearLevel: '4th Year', sectionCode: 'A' },
];

// ─── Subject Seed Data ───────────────────────────────────────────────────────

type SubjectSeed = {
  subjectCode: string;
  subjectName: string;
  lectureUnits: number;
  labUnits: number;
  yearLevel?: '1st Year' | '2nd Year' | '3rd Year' | '4th Year' | '5th Year';
  semester?: '1st Semester' | '2nd Semester' | 'Summer';
  description?: string;
  program: string; // courseCode
};

const SUBJECTS_SEED: SubjectSeed[] = [
  // ════════════════════════════════════════════════════════════════════════
  // BSA — Bachelor of Science in Agriculture
  // ════════════════════════════════════════════════════════════════════════
  // 1st Year, 1st Semester
  { program: 'BSA', yearLevel: '1st Year', semester: '1st Semester', subjectCode: 'GE101',    subjectName: 'Understanding the Self',              lectureUnits: 3, labUnits: 0 },
  { program: 'BSA', yearLevel: '1st Year', semester: '1st Semester', subjectCode: 'GE102',    subjectName: 'Readings in Philippine History',       lectureUnits: 3, labUnits: 0 },
  { program: 'BSA', yearLevel: '1st Year', semester: '1st Semester', subjectCode: 'MATH101',  subjectName: 'Mathematics in the Modern World',      lectureUnits: 3, labUnits: 0 },
  { program: 'BSA', yearLevel: '1st Year', semester: '1st Semester', subjectCode: 'PE101',    subjectName: 'Physical Education 1',                lectureUnits: 2, labUnits: 0 },
  { program: 'BSA', yearLevel: '1st Year', semester: '1st Semester', subjectCode: 'NSTP101',  subjectName: 'National Service Training Program 1', lectureUnits: 3, labUnits: 0 },
  { program: 'BSA', yearLevel: '1st Year', semester: '1st Semester', subjectCode: 'BSA101',   subjectName: 'Introduction to Agriculture',          lectureUnits: 3, labUnits: 0 },
  { program: 'BSA', yearLevel: '1st Year', semester: '1st Semester', subjectCode: 'BSA102',   subjectName: 'General Biology',                     lectureUnits: 2, labUnits: 1 },
  { program: 'BSA', yearLevel: '1st Year', semester: '1st Semester', subjectCode: 'BSA103',   subjectName: 'General Chemistry',                   lectureUnits: 2, labUnits: 1 },
  // 1st Year, 2nd Semester
  { program: 'BSA', yearLevel: '1st Year', semester: '2nd Semester', subjectCode: 'GE103',    subjectName: 'Purposive Communication',             lectureUnits: 3, labUnits: 0 },
  { program: 'BSA', yearLevel: '1st Year', semester: '2nd Semester', subjectCode: 'GE104',    subjectName: 'The Contemporary World',              lectureUnits: 3, labUnits: 0 },
  { program: 'BSA', yearLevel: '1st Year', semester: '2nd Semester', subjectCode: 'PE102',    subjectName: 'Physical Education 2',                lectureUnits: 2, labUnits: 0 },
  { program: 'BSA', yearLevel: '1st Year', semester: '2nd Semester', subjectCode: 'NSTP102',  subjectName: 'National Service Training Program 2', lectureUnits: 3, labUnits: 0 },
  { program: 'BSA', yearLevel: '1st Year', semester: '2nd Semester', subjectCode: 'BSA104',   subjectName: 'Agricultural Botany',                 lectureUnits: 2, labUnits: 1 },
  { program: 'BSA', yearLevel: '1st Year', semester: '2nd Semester', subjectCode: 'BSA105',   subjectName: 'Organic Chemistry',                   lectureUnits: 2, labUnits: 1 },
  { program: 'BSA', yearLevel: '1st Year', semester: '2nd Semester', subjectCode: 'BSA106',   subjectName: 'Meteorology and Climatology',          lectureUnits: 2, labUnits: 1 },
  // 2nd Year, 1st Semester
  { program: 'BSA', yearLevel: '2nd Year', semester: '1st Semester', subjectCode: 'GE105',    subjectName: 'Art Appreciation',                    lectureUnits: 3, labUnits: 0 },
  { program: 'BSA', yearLevel: '2nd Year', semester: '1st Semester', subjectCode: 'GE106',    subjectName: 'Ethics',                              lectureUnits: 3, labUnits: 0 },
  { program: 'BSA', yearLevel: '2nd Year', semester: '1st Semester', subjectCode: 'PE103',    subjectName: 'Physical Education 3',                lectureUnits: 2, labUnits: 0 },
  { program: 'BSA', yearLevel: '2nd Year', semester: '1st Semester', subjectCode: 'BSA201',   subjectName: 'Soil Science',                        lectureUnits: 2, labUnits: 1 },
  { program: 'BSA', yearLevel: '2nd Year', semester: '1st Semester', subjectCode: 'BSA202',   subjectName: 'Principles of Crop Production',       lectureUnits: 2, labUnits: 1 },
  { program: 'BSA', yearLevel: '2nd Year', semester: '1st Semester', subjectCode: 'BSA203',   subjectName: 'Agricultural Economics',              lectureUnits: 3, labUnits: 0 },
  { program: 'BSA', yearLevel: '2nd Year', semester: '1st Semester', subjectCode: 'BSA204',   subjectName: 'Principles of Animal Science',        lectureUnits: 2, labUnits: 1 },
  // 2nd Year, 2nd Semester
  { program: 'BSA', yearLevel: '2nd Year', semester: '2nd Semester', subjectCode: 'GE107',    subjectName: 'Science, Technology, and Society',   lectureUnits: 3, labUnits: 0 },
  { program: 'BSA', yearLevel: '2nd Year', semester: '2nd Semester', subjectCode: 'PE104',    subjectName: 'Physical Education 4',                lectureUnits: 2, labUnits: 0 },
  { program: 'BSA', yearLevel: '2nd Year', semester: '2nd Semester', subjectCode: 'BSA205',   subjectName: 'Plant Pathology',                     lectureUnits: 2, labUnits: 1 },
  { program: 'BSA', yearLevel: '2nd Year', semester: '2nd Semester', subjectCode: 'BSA206',   subjectName: 'Agricultural Entomology',             lectureUnits: 2, labUnits: 1 },
  { program: 'BSA', yearLevel: '2nd Year', semester: '2nd Semester', subjectCode: 'BSA207',   subjectName: 'Weed Science and Management',         lectureUnits: 2, labUnits: 1 },
  { program: 'BSA', yearLevel: '2nd Year', semester: '2nd Semester', subjectCode: 'BSA208',   subjectName: 'Crop Physiology',                     lectureUnits: 2, labUnits: 1 },
  // 3rd Year, 1st Semester
  { program: 'BSA', yearLevel: '3rd Year', semester: '1st Semester', subjectCode: 'BSA301',   subjectName: 'Fruit Crops Production',              lectureUnits: 2, labUnits: 1 },
  { program: 'BSA', yearLevel: '3rd Year', semester: '1st Semester', subjectCode: 'BSA302',   subjectName: 'Vegetable Crops Production',          lectureUnits: 2, labUnits: 1 },
  { program: 'BSA', yearLevel: '3rd Year', semester: '1st Semester', subjectCode: 'BSA303',   subjectName: 'Farm Machinery and Power',            lectureUnits: 2, labUnits: 1 },
  { program: 'BSA', yearLevel: '3rd Year', semester: '1st Semester', subjectCode: 'BSA304',   subjectName: 'Irrigation and Drainage Engineering', lectureUnits: 2, labUnits: 1 },
  { program: 'BSA', yearLevel: '3rd Year', semester: '1st Semester', subjectCode: 'BSA305',   subjectName: 'Agricultural Statistics',             lectureUnits: 3, labUnits: 0 },
  // 3rd Year, 2nd Semester
  { program: 'BSA', yearLevel: '3rd Year', semester: '2nd Semester', subjectCode: 'BSA306',   subjectName: 'Industrial Crops Production',         lectureUnits: 2, labUnits: 1 },
  { program: 'BSA', yearLevel: '3rd Year', semester: '2nd Semester', subjectCode: 'BSA307',   subjectName: 'Extension Education',                 lectureUnits: 3, labUnits: 0 },
  { program: 'BSA', yearLevel: '3rd Year', semester: '2nd Semester', subjectCode: 'BSA308',   subjectName: 'Post-Harvest Technology',             lectureUnits: 2, labUnits: 1 },
  { program: 'BSA', yearLevel: '3rd Year', semester: '2nd Semester', subjectCode: 'BSA309',   subjectName: 'Soil Fertility and Fertilization',    lectureUnits: 2, labUnits: 1 },
  { program: 'BSA', yearLevel: '3rd Year', semester: '2nd Semester', subjectCode: 'BSA310',   subjectName: 'Research Methods in Agriculture',     lectureUnits: 3, labUnits: 0 },
  // 4th Year, 1st Semester
  { program: 'BSA', yearLevel: '4th Year', semester: '1st Semester', subjectCode: 'BSA401',   subjectName: 'Farming Systems and Sustainable Agriculture', lectureUnits: 3, labUnits: 0 },
  { program: 'BSA', yearLevel: '4th Year', semester: '1st Semester', subjectCode: 'BSA402',   subjectName: 'Agribusiness Management',             lectureUnits: 3, labUnits: 0 },
  { program: 'BSA', yearLevel: '4th Year', semester: '1st Semester', subjectCode: 'BSA403',   subjectName: 'Thesis Writing 1',                    lectureUnits: 3, labUnits: 0 },
  // 4th Year, 2nd Semester
  { program: 'BSA', yearLevel: '4th Year', semester: '2nd Semester', subjectCode: 'BSA404',   subjectName: 'Thesis Writing 2',                    lectureUnits: 3, labUnits: 0 },
  { program: 'BSA', yearLevel: '4th Year', semester: '2nd Semester', subjectCode: 'BSA405',   subjectName: 'On-the-Job Training',                 lectureUnits: 0, labUnits: 6 },

  // ════════════════════════════════════════════════════════════════════════
  // BSIT — Bachelor of Science in Information Technology
  // ════════════════════════════════════════════════════════════════════════
  // 1st Year, 1st Semester
  { program: 'BSIT', yearLevel: '1st Year', semester: '1st Semester', subjectCode: 'GE101',   subjectName: 'Understanding the Self',              lectureUnits: 3, labUnits: 0 },
  { program: 'BSIT', yearLevel: '1st Year', semester: '1st Semester', subjectCode: 'GE102',   subjectName: 'Readings in Philippine History',       lectureUnits: 3, labUnits: 0 },
  { program: 'BSIT', yearLevel: '1st Year', semester: '1st Semester', subjectCode: 'MATH101', subjectName: 'Mathematics in the Modern World',      lectureUnits: 3, labUnits: 0 },
  { program: 'BSIT', yearLevel: '1st Year', semester: '1st Semester', subjectCode: 'PE101',   subjectName: 'Physical Education 1',                lectureUnits: 2, labUnits: 0 },
  { program: 'BSIT', yearLevel: '1st Year', semester: '1st Semester', subjectCode: 'NSTP101', subjectName: 'National Service Training Program 1', lectureUnits: 3, labUnits: 0 },
  { program: 'BSIT', yearLevel: '1st Year', semester: '1st Semester', subjectCode: 'IT101',   subjectName: 'Introduction to Computing',           lectureUnits: 2, labUnits: 1 },
  { program: 'BSIT', yearLevel: '1st Year', semester: '1st Semester', subjectCode: 'IT102',   subjectName: 'Computer Programming 1',              lectureUnits: 2, labUnits: 1 },
  // 1st Year, 2nd Semester
  { program: 'BSIT', yearLevel: '1st Year', semester: '2nd Semester', subjectCode: 'GE103',   subjectName: 'Purposive Communication',             lectureUnits: 3, labUnits: 0 },
  { program: 'BSIT', yearLevel: '1st Year', semester: '2nd Semester', subjectCode: 'GE104',   subjectName: 'The Contemporary World',              lectureUnits: 3, labUnits: 0 },
  { program: 'BSIT', yearLevel: '1st Year', semester: '2nd Semester', subjectCode: 'MATH102', subjectName: 'Statistics and Probability',           lectureUnits: 3, labUnits: 0 },
  { program: 'BSIT', yearLevel: '1st Year', semester: '2nd Semester', subjectCode: 'PE102',   subjectName: 'Physical Education 2',                lectureUnits: 2, labUnits: 0 },
  { program: 'BSIT', yearLevel: '1st Year', semester: '2nd Semester', subjectCode: 'NSTP102', subjectName: 'National Service Training Program 2', lectureUnits: 3, labUnits: 0 },
  { program: 'BSIT', yearLevel: '1st Year', semester: '2nd Semester', subjectCode: 'IT103',   subjectName: 'Computer Programming 2',              lectureUnits: 2, labUnits: 1 },
  { program: 'BSIT', yearLevel: '1st Year', semester: '2nd Semester', subjectCode: 'IT104',   subjectName: 'Computer Hardware Servicing',         lectureUnits: 1, labUnits: 2 },
  // 2nd Year, 1st Semester
  { program: 'BSIT', yearLevel: '2nd Year', semester: '1st Semester', subjectCode: 'GE105',   subjectName: 'Art Appreciation',                    lectureUnits: 3, labUnits: 0 },
  { program: 'BSIT', yearLevel: '2nd Year', semester: '1st Semester', subjectCode: 'GE106',   subjectName: 'Ethics',                              lectureUnits: 3, labUnits: 0 },
  { program: 'BSIT', yearLevel: '2nd Year', semester: '1st Semester', subjectCode: 'PE103',   subjectName: 'Physical Education 3',                lectureUnits: 2, labUnits: 0 },
  { program: 'BSIT', yearLevel: '2nd Year', semester: '1st Semester', subjectCode: 'IT201',   subjectName: 'Data Structures and Algorithms',      lectureUnits: 2, labUnits: 1 },
  { program: 'BSIT', yearLevel: '2nd Year', semester: '1st Semester', subjectCode: 'IT202',   subjectName: 'Database Management',                 lectureUnits: 2, labUnits: 1 },
  { program: 'BSIT', yearLevel: '2nd Year', semester: '1st Semester', subjectCode: 'IT203',   subjectName: 'Discrete Mathematics',                lectureUnits: 3, labUnits: 0 },
  // 2nd Year, 2nd Semester
  { program: 'BSIT', yearLevel: '2nd Year', semester: '2nd Semester', subjectCode: 'GE107',   subjectName: 'Science, Technology, and Society',   lectureUnits: 3, labUnits: 0 },
  { program: 'BSIT', yearLevel: '2nd Year', semester: '2nd Semester', subjectCode: 'PE104',   subjectName: 'Physical Education 4',                lectureUnits: 2, labUnits: 0 },
  { program: 'BSIT', yearLevel: '2nd Year', semester: '2nd Semester', subjectCode: 'IT204',   subjectName: 'Object-Oriented Programming',         lectureUnits: 2, labUnits: 1 },
  { program: 'BSIT', yearLevel: '2nd Year', semester: '2nd Semester', subjectCode: 'IT205',   subjectName: 'Information Management',              lectureUnits: 2, labUnits: 1 },
  { program: 'BSIT', yearLevel: '2nd Year', semester: '2nd Semester', subjectCode: 'IT206',   subjectName: 'Network Fundamentals',                lectureUnits: 2, labUnits: 1 },
  { program: 'BSIT', yearLevel: '2nd Year', semester: '2nd Semester', subjectCode: 'IT207',   subjectName: 'Human-Computer Interaction',          lectureUnits: 3, labUnits: 0 },
  // 3rd Year, 1st Semester
  { program: 'BSIT', yearLevel: '3rd Year', semester: '1st Semester', subjectCode: 'IT301',   subjectName: 'Systems Analysis and Design',         lectureUnits: 3, labUnits: 0 },
  { program: 'BSIT', yearLevel: '3rd Year', semester: '1st Semester', subjectCode: 'IT302',   subjectName: 'Software Engineering',                lectureUnits: 3, labUnits: 0 },
  { program: 'BSIT', yearLevel: '3rd Year', semester: '1st Semester', subjectCode: 'IT303',   subjectName: 'Web Application Development',         lectureUnits: 2, labUnits: 1 },
  { program: 'BSIT', yearLevel: '3rd Year', semester: '1st Semester', subjectCode: 'IT304',   subjectName: 'Advanced Database Systems',           lectureUnits: 2, labUnits: 1 },
  { program: 'BSIT', yearLevel: '3rd Year', semester: '1st Semester', subjectCode: 'IT305',   subjectName: 'Operating Systems',                   lectureUnits: 2, labUnits: 1 },
  // 3rd Year, 2nd Semester
  { program: 'BSIT', yearLevel: '3rd Year', semester: '2nd Semester', subjectCode: 'IT306',   subjectName: 'Mobile Application Development',      lectureUnits: 2, labUnits: 1 },
  { program: 'BSIT', yearLevel: '3rd Year', semester: '2nd Semester', subjectCode: 'IT307',   subjectName: 'Information Security',                lectureUnits: 3, labUnits: 0 },
  { program: 'BSIT', yearLevel: '3rd Year', semester: '2nd Semester', subjectCode: 'IT308',   subjectName: 'Cloud Computing',                     lectureUnits: 2, labUnits: 1 },
  { program: 'BSIT', yearLevel: '3rd Year', semester: '2nd Semester', subjectCode: 'IT309',   subjectName: 'IT Project Management',               lectureUnits: 3, labUnits: 0 },
  { program: 'BSIT', yearLevel: '3rd Year', semester: '2nd Semester', subjectCode: 'IT310',   subjectName: 'Research in IT',                      lectureUnits: 3, labUnits: 0 },
  // 4th Year, 1st Semester
  { program: 'BSIT', yearLevel: '4th Year', semester: '1st Semester', subjectCode: 'IT401',   subjectName: 'Capstone Project 1',                  lectureUnits: 3, labUnits: 0 },
  { program: 'BSIT', yearLevel: '4th Year', semester: '1st Semester', subjectCode: 'IT402',   subjectName: 'Professional Issues in IT',           lectureUnits: 3, labUnits: 0 },
  { program: 'BSIT', yearLevel: '4th Year', semester: '1st Semester', subjectCode: 'IT403',   subjectName: 'IT Audit and Control',                lectureUnits: 3, labUnits: 0 },
  // 4th Year, 2nd Semester
  { program: 'BSIT', yearLevel: '4th Year', semester: '2nd Semester', subjectCode: 'IT404',   subjectName: 'Capstone Project 2',                  lectureUnits: 3, labUnits: 0 },
  { program: 'BSIT', yearLevel: '4th Year', semester: '2nd Semester', subjectCode: 'IT405',   subjectName: 'Practicum / On-the-Job Training',     lectureUnits: 0, labUnits: 6 },
  { program: 'BSIT', yearLevel: '4th Year', semester: '2nd Semester', subjectCode: 'IT406',   subjectName: 'Systems Integration and Architecture', lectureUnits: 3, labUnits: 0 },

  // ════════════════════════════════════════════════════════════════════════
  // BSBA — Bachelor of Science in Business Administration
  // ════════════════════════════════════════════════════════════════════════
  { program: 'BSBA', yearLevel: '1st Year', semester: '1st Semester', subjectCode: 'GE101',   subjectName: 'Understanding the Self',              lectureUnits: 3, labUnits: 0 },
  { program: 'BSBA', yearLevel: '1st Year', semester: '1st Semester', subjectCode: 'MATH101', subjectName: 'Mathematics in the Modern World',      lectureUnits: 3, labUnits: 0 },
  { program: 'BSBA', yearLevel: '1st Year', semester: '1st Semester', subjectCode: 'NSTP101', subjectName: 'National Service Training Program 1', lectureUnits: 3, labUnits: 0 },
  { program: 'BSBA', yearLevel: '1st Year', semester: '1st Semester', subjectCode: 'PE101',   subjectName: 'Physical Education 1',                lectureUnits: 2, labUnits: 0 },
  { program: 'BSBA', yearLevel: '1st Year', semester: '1st Semester', subjectCode: 'BA101',   subjectName: 'Principles of Management',            lectureUnits: 3, labUnits: 0 },
  { program: 'BSBA', yearLevel: '1st Year', semester: '1st Semester', subjectCode: 'BA102',   subjectName: 'Business Communication',              lectureUnits: 3, labUnits: 0 },
  { program: 'BSBA', yearLevel: '1st Year', semester: '2nd Semester', subjectCode: 'GE103',   subjectName: 'Purposive Communication',             lectureUnits: 3, labUnits: 0 },
  { program: 'BSBA', yearLevel: '1st Year', semester: '2nd Semester', subjectCode: 'NSTP102', subjectName: 'National Service Training Program 2', lectureUnits: 3, labUnits: 0 },
  { program: 'BSBA', yearLevel: '1st Year', semester: '2nd Semester', subjectCode: 'PE102',   subjectName: 'Physical Education 2',                lectureUnits: 2, labUnits: 0 },
  { program: 'BSBA', yearLevel: '1st Year', semester: '2nd Semester', subjectCode: 'BA103',   subjectName: 'Financial Accounting',                lectureUnits: 3, labUnits: 0 },
  { program: 'BSBA', yearLevel: '1st Year', semester: '2nd Semester', subjectCode: 'BA104',   subjectName: 'Microeconomics',                      lectureUnits: 3, labUnits: 0 },
  { program: 'BSBA', yearLevel: '1st Year', semester: '2nd Semester', subjectCode: 'BA105',   subjectName: 'Business Mathematics',                lectureUnits: 3, labUnits: 0 },
  { program: 'BSBA', yearLevel: '2nd Year', semester: '1st Semester', subjectCode: 'GE106',   subjectName: 'Ethics',                              lectureUnits: 3, labUnits: 0 },
  { program: 'BSBA', yearLevel: '2nd Year', semester: '1st Semester', subjectCode: 'PE103',   subjectName: 'Physical Education 3',                lectureUnits: 2, labUnits: 0 },
  { program: 'BSBA', yearLevel: '2nd Year', semester: '1st Semester', subjectCode: 'BA201',   subjectName: 'Cost Accounting',                     lectureUnits: 3, labUnits: 0 },
  { program: 'BSBA', yearLevel: '2nd Year', semester: '1st Semester', subjectCode: 'BA202',   subjectName: 'Macroeconomics',                      lectureUnits: 3, labUnits: 0 },
  { program: 'BSBA', yearLevel: '2nd Year', semester: '1st Semester', subjectCode: 'BA203',   subjectName: 'Business Statistics',                 lectureUnits: 3, labUnits: 0 },
  { program: 'BSBA', yearLevel: '2nd Year', semester: '2nd Semester', subjectCode: 'GE107',   subjectName: 'Science, Technology, and Society',   lectureUnits: 3, labUnits: 0 },
  { program: 'BSBA', yearLevel: '2nd Year', semester: '2nd Semester', subjectCode: 'PE104',   subjectName: 'Physical Education 4',                lectureUnits: 2, labUnits: 0 },
  { program: 'BSBA', yearLevel: '2nd Year', semester: '2nd Semester', subjectCode: 'BA204',   subjectName: 'Financial Management',                lectureUnits: 3, labUnits: 0 },
  { program: 'BSBA', yearLevel: '2nd Year', semester: '2nd Semester', subjectCode: 'BA205',   subjectName: 'Human Resource Management',           lectureUnits: 3, labUnits: 0 },
  { program: 'BSBA', yearLevel: '2nd Year', semester: '2nd Semester', subjectCode: 'BA206',   subjectName: 'Operations Management',               lectureUnits: 3, labUnits: 0 },
  { program: 'BSBA', yearLevel: '3rd Year', semester: '1st Semester', subjectCode: 'BA301',   subjectName: 'Marketing Management',                lectureUnits: 3, labUnits: 0 },
  { program: 'BSBA', yearLevel: '3rd Year', semester: '1st Semester', subjectCode: 'BA302',   subjectName: 'Strategic Management',                lectureUnits: 3, labUnits: 0 },
  { program: 'BSBA', yearLevel: '3rd Year', semester: '1st Semester', subjectCode: 'BA303',   subjectName: 'Entrepreneurship',                    lectureUnits: 3, labUnits: 0 },
  { program: 'BSBA', yearLevel: '4th Year', semester: '1st Semester', subjectCode: 'BA401',   subjectName: 'Thesis Writing 1',                    lectureUnits: 3, labUnits: 0 },
  { program: 'BSBA', yearLevel: '4th Year', semester: '2nd Semester', subjectCode: 'BA402',   subjectName: 'Thesis Writing 2',                    lectureUnits: 3, labUnits: 0 },
  { program: 'BSBA', yearLevel: '4th Year', semester: '2nd Semester', subjectCode: 'BA403',   subjectName: 'OJT / Practicum',                     lectureUnits: 0, labUnits: 6 },

  // ════════════════════════════════════════════════════════════════════════
  // BSEd — Bachelor of Secondary Education
  // ════════════════════════════════════════════════════════════════════════
  { program: 'BSEd', yearLevel: '1st Year', semester: '1st Semester', subjectCode: 'GE101',   subjectName: 'Understanding the Self',              lectureUnits: 3, labUnits: 0 },
  { program: 'BSEd', yearLevel: '1st Year', semester: '1st Semester', subjectCode: 'MATH101', subjectName: 'Mathematics in the Modern World',      lectureUnits: 3, labUnits: 0 },
  { program: 'BSEd', yearLevel: '1st Year', semester: '1st Semester', subjectCode: 'NSTP101', subjectName: 'National Service Training Program 1', lectureUnits: 3, labUnits: 0 },
  { program: 'BSEd', yearLevel: '1st Year', semester: '1st Semester', subjectCode: 'PE101',   subjectName: 'Physical Education 1',                lectureUnits: 2, labUnits: 0 },
  { program: 'BSEd', yearLevel: '1st Year', semester: '1st Semester', subjectCode: 'SED101',  subjectName: 'Child and Adolescent Development',    lectureUnits: 3, labUnits: 0 },
  { program: 'BSEd', yearLevel: '1st Year', semester: '1st Semester', subjectCode: 'SED102',  subjectName: 'The Teaching Profession',             lectureUnits: 3, labUnits: 0 },
  { program: 'BSEd', yearLevel: '1st Year', semester: '2nd Semester', subjectCode: 'GE103',   subjectName: 'Purposive Communication',             lectureUnits: 3, labUnits: 0 },
  { program: 'BSEd', yearLevel: '1st Year', semester: '2nd Semester', subjectCode: 'NSTP102', subjectName: 'National Service Training Program 2', lectureUnits: 3, labUnits: 0 },
  { program: 'BSEd', yearLevel: '1st Year', semester: '2nd Semester', subjectCode: 'PE102',   subjectName: 'Physical Education 2',                lectureUnits: 2, labUnits: 0 },
  { program: 'BSEd', yearLevel: '1st Year', semester: '2nd Semester', subjectCode: 'SED103',  subjectName: 'Foundation of Special and Inclusive Education', lectureUnits: 3, labUnits: 0 },
  { program: 'BSEd', yearLevel: '1st Year', semester: '2nd Semester', subjectCode: 'SED104',  subjectName: 'The Teacher and the School Curriculum', lectureUnits: 3, labUnits: 0 },
  { program: 'BSEd', yearLevel: '2nd Year', semester: '1st Semester', subjectCode: 'GE106',   subjectName: 'Ethics',                              lectureUnits: 3, labUnits: 0 },
  { program: 'BSEd', yearLevel: '2nd Year', semester: '1st Semester', subjectCode: 'PE103',   subjectName: 'Physical Education 3',                lectureUnits: 2, labUnits: 0 },
  { program: 'BSEd', yearLevel: '2nd Year', semester: '1st Semester', subjectCode: 'SED201',  subjectName: 'Assessment in Learning 1',            lectureUnits: 3, labUnits: 0 },
  { program: 'BSEd', yearLevel: '2nd Year', semester: '1st Semester', subjectCode: 'SED202',  subjectName: 'Technology for Teaching and Learning 1', lectureUnits: 2, labUnits: 1 },
  { program: 'BSEd', yearLevel: '2nd Year', semester: '1st Semester', subjectCode: 'SED203',  subjectName: 'Professional Ethics for Teachers',    lectureUnits: 3, labUnits: 0 },
  { program: 'BSEd', yearLevel: '2nd Year', semester: '2nd Semester', subjectCode: 'GE107',   subjectName: 'Science, Technology, and Society',   lectureUnits: 3, labUnits: 0 },
  { program: 'BSEd', yearLevel: '2nd Year', semester: '2nd Semester', subjectCode: 'PE104',   subjectName: 'Physical Education 4',                lectureUnits: 2, labUnits: 0 },
  { program: 'BSEd', yearLevel: '2nd Year', semester: '2nd Semester', subjectCode: 'SED204',  subjectName: 'Assessment in Learning 2',            lectureUnits: 3, labUnits: 0 },
  { program: 'BSEd', yearLevel: '2nd Year', semester: '2nd Semester', subjectCode: 'SED205',  subjectName: 'Facilitating Learner-Centered Teaching', lectureUnits: 3, labUnits: 0 },
  { program: 'BSEd', yearLevel: '2nd Year', semester: '2nd Semester', subjectCode: 'SED206',  subjectName: 'Field Study 1',                       lectureUnits: 1, labUnits: 2 },
  { program: 'BSEd', yearLevel: '3rd Year', semester: '2nd Semester', subjectCode: 'SED301',  subjectName: 'Teaching in Secondary Schools',       lectureUnits: 3, labUnits: 0 },
  { program: 'BSEd', yearLevel: '3rd Year', semester: '2nd Semester', subjectCode: 'SED302',  subjectName: 'Major Subject Practicum 1',           lectureUnits: 0, labUnits: 3 },
  { program: 'BSEd', yearLevel: '4th Year', semester: '1st Semester', subjectCode: 'SED401',  subjectName: 'Practice Teaching 1',                 lectureUnits: 0, labUnits: 6 },
  { program: 'BSEd', yearLevel: '4th Year', semester: '2nd Semester', subjectCode: 'SED402',  subjectName: 'Practice Teaching 2',                 lectureUnits: 0, labUnits: 6 },
  { program: 'BSEd', yearLevel: '4th Year', semester: '2nd Semester', subjectCode: 'SED403',  subjectName: 'Research in Education',               lectureUnits: 3, labUnits: 0 },
];

// Faculty seed list — realistic DORSU roster
// program: matched by courseCode below
const FACULTY_SEED = [
  // ── BSA ──────────────────────────────────────────────────────────────────
  {
    name: { first: 'Marlone', middle: 'M', last: 'Barrete' },
    email: 'marlone.barrete@dorsu.edu.ph',
    program: 'BSA',
    employmentType: 'full-time' as const,
    designation: 'Program Chair',
    adminLoad: 3,
    minLoad: 18, maxLoad: 26, status: 'active' as const,
  },
  {
    name: { first: 'Rosario', middle: 'C', last: 'Dela Cruz' },
    email: 'rosario.delacruz@dorsu.edu.ph',
    program: 'BSA',
    employmentType: 'full-time' as const,
    minLoad: 18, maxLoad: 26, status: 'active' as const,
  },
  {
    name: { first: 'Eduardo', middle: 'L', last: 'Salva' },
    email: 'eduardo.salva@dorsu.edu.ph',
    program: 'BSA',
    employmentType: 'full-time' as const,
    minLoad: 18, maxLoad: 26, status: 'active' as const,
  },
  {
    name: { first: 'Marites', middle: 'A', last: 'Sumagaysay' },
    email: 'marites.sumagaysay@dorsu.edu.ph',
    program: 'BSA',
    employmentType: 'part-time' as const,
    minLoad: 18, maxLoad: 18, status: 'active' as const,
  },

  // ── BSIT ─────────────────────────────────────────────────────────────────
  {
    name: { first: 'Jerome', middle: 'P', last: 'Magno' },
    email: 'jerome.magno@dorsu.edu.ph',
    program: 'BSIT',
    employmentType: 'full-time' as const,
    designation: 'Program Chair',
    adminLoad: 3,
    minLoad: 18, maxLoad: 26, status: 'active' as const,
  },
  {
    name: { first: 'Analyn', middle: 'S', last: 'Tutor' },
    email: 'analyn.tutor@dorsu.edu.ph',
    program: 'BSIT',
    employmentType: 'full-time' as const,
    minLoad: 18, maxLoad: 26, status: 'active' as const,
  },
  {
    name: { first: 'Renato', middle: 'E', last: 'Cabilao' },
    email: 'renato.cabilao@dorsu.edu.ph',
    program: 'BSIT',
    employmentType: 'full-time' as const,
    minLoad: 18, maxLoad: 26, status: 'active' as const,
  },
  {
    name: { first: 'Glenda', middle: 'V', last: 'Ybañez' },
    email: 'glenda.ybanez@dorsu.edu.ph',
    program: 'BSIT',
    employmentType: 'part-time' as const,
    minLoad: 18, maxLoad: 18, status: 'active' as const,
  },

  // ── BSBA ─────────────────────────────────────────────────────────────────
  {
    name: { first: 'Norma', middle: 'G', last: 'Cabugwas' },
    email: 'norma.cabugwas@dorsu.edu.ph',
    program: 'BSBA',
    employmentType: 'full-time' as const,
    designation: 'Program Chair',
    adminLoad: 3,
    minLoad: 18, maxLoad: 26, status: 'active' as const,
  },
  {
    name: { first: 'Albert', middle: 'N', last: 'Liban' },
    email: 'albert.liban@dorsu.edu.ph',
    program: 'BSBA',
    employmentType: 'full-time' as const,
    minLoad: 18, maxLoad: 26, status: 'active' as const,
  },
  {
    name: { first: 'Marilou', middle: 'O', last: 'Panes' },
    email: 'marilou.panes@dorsu.edu.ph',
    program: 'BSBA',
    employmentType: 'part-time' as const,
    minLoad: 18, maxLoad: 18, status: 'active' as const,
  },

  // ── BSEd ─────────────────────────────────────────────────────────────────
  {
    name: { first: 'Ricardo', middle: 'U', last: 'Amodia' },
    email: 'ricardo.amodia@dorsu.edu.ph',
    program: 'BSEd',
    employmentType: 'full-time' as const,
    designation: 'Program Chair',
    adminLoad: 3,
    minLoad: 18, maxLoad: 26, status: 'active' as const,
  },
  {
    name: { first: 'Shirley', middle: 'W', last: 'Cuizon' },
    email: 'shirley.cuizon@dorsu.edu.ph',
    program: 'BSEd',
    employmentType: 'full-time' as const,
    minLoad: 18, maxLoad: 26, status: 'active' as const,
  },
  {
    name: { first: 'Edgar', middle: 'K', last: 'Abatayo' },
    email: 'edgar.abatayo@dorsu.edu.ph',
    program: 'BSEd',
    employmentType: 'part-time' as const,
    minLoad: 18, maxLoad: 18, status: 'active' as const,
  },
];

// ─── Main ─────────────────────────────────────────────────────────────────────

async function seed() {
  const mongoURI = process.env.MONGODB_URI;
  if (!mongoURI) throw new Error('MONGODB_URI not set in .env');

  const shouldReset = process.argv.includes('--reset');

  console.log('🔌 Connecting to MongoDB…');
  await mongoose.connect(mongoURI);
  console.log('✅ Connected\n');

  // ── Optional reset ────────────────────────────────────────────────────────
  if (shouldReset) {
    console.log('🗑️  Resetting faculty, schedules, and sections…');
    const { deletedCount: schedDel } = await Schedule.deleteMany({});
    const { deletedCount: facDel  } = await Faculty.deleteMany({});
    const { deletedCount: sectDel } = await Section.deleteMany({});
    console.log(`   Deleted ${schedDel} schedule(s), ${facDel} faculty member(s), and ${sectDel} section(s)\n`);
  }

  // ── 1. Upsert programs ────────────────────────────────────────────────────
  console.log('📚 Seeding programs…');
  const programMap: Record<string, mongoose.Types.ObjectId> = {};

  for (const prog of PROGRAMS) {
    const doc = await Course.findOneAndUpdate(
      { courseCode: prog.courseCode },
      { $setOnInsert: prog },
      { upsert: true, new: true }
    );
    programMap[prog.courseCode] = doc._id as mongoose.Types.ObjectId;
    console.log(`   ${doc.courseCode}  →  ${doc._id}`);
  }

  // ── 2. Seed faculty ───────────────────────────────────────────────────────
  console.log('\n👨‍🏫 Seeding faculty…');
  let created = 0;
  let skipped = 0;

  for (const f of FACULTY_SEED) {
    const existing = await Faculty.findOne({ email: f.email });
    if (existing) {
      console.log(`   ⏭  Skipped  ${f.name.last}, ${f.name.first} (already exists)`);
      skipped++;
      continue;
    }

    const { program: progCode, ...rest } = f;
    const programId = programMap[progCode];
    if (!programId) {
      console.warn(`   ⚠  No program found for code "${progCode}", skipping ${f.name.last}`);
      continue;
    }

    await Faculty.create({ ...rest, program: programId });
    console.log(`   ✅  Created  ${f.name.last}, ${f.name.first}  (${progCode})`);
    created++;
  }

  // ── 3. Seed subjects ─────────────────────────────────────────────────────
  console.log('\n📖 Seeding subjects…');
  let subjCreated = 0;
  let subjSkipped = 0;

  for (const s of SUBJECTS_SEED) {
    const programId = programMap[s.program];
    if (!programId) {
      console.warn(`   ⚠  No program found for code "${s.program}", skipping ${s.subjectCode}`);
      continue;
    }

    const { program: _p, ...rest } = s;
    const units = (rest.lectureUnits ?? 0) + (rest.labUnits ?? 0);

    const result = await Subject.findOneAndUpdate(
      { course: programId, subjectCode: rest.subjectCode },
      { $setOnInsert: { ...rest, course: programId, units } },
      { upsert: true, new: false, lean: true }
    );

    if (result) {
      console.log(`   ⏭  Skipped  [${s.program}] ${s.subjectCode}`);
      subjSkipped++;
    } else {
      console.log(`   ✅  Created  [${s.program}] ${s.subjectCode} — ${s.subjectName}`);
      subjCreated++;
    }
  }

  // ── 4. Seed classrooms ──────────────────────────────────────────────────────
  console.log('\n🏫 Seeding classrooms…');
  let roomCreated = 0;
  let roomSkipped = 0;

  for (const room of CLASSROOMS_SEED) {
    const filter: Record<string, any> = { roomNumber: room.roomNumber };
    if (room.building) filter.building = room.building;

    const result = await Classroom.findOneAndUpdate(
      filter,
      { $setOnInsert: room },
      { upsert: true, new: false, lean: true }
    );

    if (result) {
      console.log(`   ⏭  Skipped  ${room.building ? room.building + ' ' : ''}${room.roomNumber}`);
      roomSkipped++;
    } else {
      console.log(`   ✅  Created  ${room.building ? room.building + ' ' : ''}${room.roomNumber} (${room.type}, cap: ${room.capacity})`);
      roomCreated++;
    }
  }

  // ── 5. Seed sections ──────────────────────────────────────────────────────
  console.log('\n🗂️  Seeding sections…');
  let sectCreated = 0;
  let sectSkipped = 0;

  for (const s of SECTIONS_SEED) {
    const programId = programMap[s.program];
    if (!programId) {
      console.warn(`   ⚠  No program found for code "${s.program}", skipping section`);
      continue;
    }

    const existing = await Section.findOne({ program: programId, yearLevel: s.yearLevel, sectionCode: s.sectionCode });
    if (existing) {
      console.log(`   ⏭  Skipped  ${existing.name} (already exists)`);
      sectSkipped++;
      continue;
    }

    const section = new Section({ program: programId, yearLevel: s.yearLevel, sectionCode: s.sectionCode });
    await section.save();
    console.log(`   ✅  Created  ${section.name}  (${s.program} ${s.yearLevel})`);
    sectCreated++;
  }

  // ── Summary ───────────────────────────────────────────────────────────────
  console.log(`\n🎉 Done!`);
  console.log(`   Programs:   ${Object.keys(programMap).length} upserted`);
  console.log(`   Faculty:    ${created} created, ${skipped} skipped`);
  console.log(`   Subjects:   ${subjCreated} created, ${subjSkipped} skipped`);
  console.log(`   Classrooms: ${roomCreated} created, ${roomSkipped} skipped`);
  console.log(`   Sections:   ${sectCreated} created, ${sectSkipped} skipped`);
  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  mongoose.disconnect();
  process.exit(1);
});

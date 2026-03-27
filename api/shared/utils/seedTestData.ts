/**
 * Seed script for DORSU Scheduler — Baganga Campus
 * Usage: pnpm --filter api seed
 *        pnpm --filter api seed --reset   (wipe faculty, users, sections, schedules first)
 *
 * Seeds programs, faculty (with linked User accounts), subjects, classrooms, sections.
 * Safe to re-run: upsert for programs/subjects/classrooms, skip-if-exists for faculty/users/sections.
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
import { User } from '../../models/userModel.js';

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
  { courseCode: 'BSA',  courseName: 'Bachelor of Science in Agriculture' },
  { courseCode: 'BSAM', courseName: 'Bachelor of Science in Agribusiness Management' },
  { courseCode: 'BSES', courseName: 'Bachelor of Science in Environmental Science' },
  { courseCode: 'BSHM', courseName: 'Bachelor of Science in Hospitality Management' },
  { courseCode: 'BSIT', courseName: 'Bachelor of Science in Information Technology' },
  { courseCode: 'BSM',  courseName: 'Bachelor of Science in Mathematics' },
  { courseCode: 'GE',   courseName: 'General Education' },
];

// ─── Section Seed Data ───────────────────────────────────────────────────────

type SectionSeed = {
  program: string;
  yearLevel: '1st Year' | '2nd Year' | '3rd Year' | '4th Year';
  sectionCode: string;
};

const SECTIONS_SEED: SectionSeed[] = [
  // ── BSA ──────────────────────────────────────────────────────────────────
  { program: 'BSA', yearLevel: '1st Year', sectionCode: 'BGA1A' },
  { program: 'BSA', yearLevel: '2nd Year', sectionCode: 'BGA2A' },
  { program: 'BSA', yearLevel: '3rd Year', sectionCode: 'BGA3A' },
  { program: 'BSA', yearLevel: '4th Year', sectionCode: 'BGA4A' },

  // ── BSAM ─────────────────────────────────────────────────────────────────
  { program: 'BSAM', yearLevel: '1st Year', sectionCode: 'AM1AB' },
  { program: 'BSAM', yearLevel: '1st Year', sectionCode: 'AM1BB' },
  { program: 'BSAM', yearLevel: '2nd Year', sectionCode: 'AM2AB' },
  { program: 'BSAM', yearLevel: '2nd Year', sectionCode: 'AM2BB' },
  { program: 'BSAM', yearLevel: '2nd Year', sectionCode: 'AM2CB' },
  { program: 'BSAM', yearLevel: '3rd Year', sectionCode: 'AM3AB' },
  { program: 'BSAM', yearLevel: '3rd Year', sectionCode: 'AM3BB' },
  { program: 'BSAM', yearLevel: '4th Year', sectionCode: 'AM4AB' },

  // ── BSES ─────────────────────────────────────────────────────────────────
  { program: 'BSES', yearLevel: '1st Year', sectionCode: 'ES1AB' },
  { program: 'BSES', yearLevel: '1st Year', sectionCode: 'ES1BB' },
  { program: 'BSES', yearLevel: '1st Year', sectionCode: 'ES1BG' },
  { program: 'BSES', yearLevel: '2nd Year', sectionCode: 'ES2BG' },
  { program: 'BSES', yearLevel: '3rd Year', sectionCode: 'ES3BG' },
  { program: 'BSES', yearLevel: '4th Year', sectionCode: 'ES4BG' },

  // ── BSHM ─────────────────────────────────────────────────────────────────
  { program: 'BSHM', yearLevel: '1st Year', sectionCode: 'HM1AB' },
  { program: 'BSHM', yearLevel: '1st Year', sectionCode: 'HM1BB' },
  { program: 'BSHM', yearLevel: '1st Year', sectionCode: 'HM1BG' },
  { program: 'BSHM', yearLevel: '2nd Year', sectionCode: 'HM2BG' },
  { program: 'BSHM', yearLevel: '3rd Year', sectionCode: 'HM3BG' },
  { program: 'BSHM', yearLevel: '4th Year', sectionCode: 'HM4BG' },

  // ── BSIT ─────────────────────────────────────────────────────────────────
  { program: 'BSIT', yearLevel: '3rd Year', sectionCode: 'IT3BG' },
  { program: 'BSIT', yearLevel: '4th Year', sectionCode: 'IT4A'  },
  { program: 'BSIT', yearLevel: '4th Year', sectionCode: 'IT4B'  },

  // ── BSM ──────────────────────────────────────────────────────────────────
  { program: 'BSM', yearLevel: '2nd Year', sectionCode: 'BGM2A' },
  { program: 'BSM', yearLevel: '3rd Year', sectionCode: 'BGM3A' },
  { program: 'BSM', yearLevel: '4th Year', sectionCode: 'BGM4A' },
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
  program: string;
};

const SUBJECTS_SEED: SubjectSeed[] = [
  // ════════════════════════════════════════════════════════════════════════
  // GE — General Education (cross-program subjects)
  // ════════════════════════════════════════════════════════════════════════
  { program: 'GE', subjectCode: 'GE-PerDev10',  subjectName: 'Understanding the Self',                         lectureUnits: 3, labUnits: 0 },
  { program: 'GE', subjectCode: 'GE-Eng10',     subjectName: 'Purposive Communication',                        lectureUnits: 3, labUnits: 0 },
  { program: 'GE', subjectCode: 'GE-Hum10',     subjectName: 'Art Appreciation',                               lectureUnits: 3, labUnits: 0 },
  { program: 'GE', subjectCode: 'GE-Lit10',     subjectName: 'Literature in Mindanao',                         lectureUnits: 3, labUnits: 0 },
  { program: 'GE', subjectCode: 'GE-Math15',    subjectName: 'Mathematics in the Modern World',                lectureUnits: 3, labUnits: 0 },
  { program: 'GE', subjectCode: 'GE-STS10',     subjectName: 'Science, Technology & Society',                  lectureUnits: 3, labUnits: 0 },
  { program: 'GE', subjectCode: 'GE-STS11',     subjectName: 'People and the Earth\'s Ecosystem',              lectureUnits: 3, labUnits: 0 },
  { program: 'GE', subjectCode: 'GE-Philo10',   subjectName: 'Ethics',                                         lectureUnits: 3, labUnits: 0 },
  { program: 'GE', subjectCode: 'GE-Hist10',    subjectName: 'The Life and Works of Rizal',                    lectureUnits: 3, labUnits: 0 },
  { program: 'GE', subjectCode: 'GE-Hist11',    subjectName: 'Readings in Philippine History',                 lectureUnits: 3, labUnits: 0 },
  { program: 'GE', subjectCode: 'GE-SocSci10',  subjectName: 'The Contemporary World',                         lectureUnits: 3, labUnits: 0 },
  { program: 'GE', subjectCode: 'GE-SocSci11',  subjectName: 'Peace, Development & Indigenous Communities',    lectureUnits: 3, labUnits: 0 },
  { program: 'GE', subjectCode: 'GE-Spear1',    subjectName: 'Movement Enhancement (PATHFIT 1)',               lectureUnits: 0, labUnits: 2 },
  { program: 'GE', subjectCode: 'GE-Spear2',    subjectName: 'Fitness Exercises (PATHFIT 2)',                  lectureUnits: 0, labUnits: 2 },
  { program: 'GE', subjectCode: 'GE-Spear3',    subjectName: 'Physical Activity Towards Health & Fitness 1',  lectureUnits: 0, labUnits: 2 },
  { program: 'GE', subjectCode: 'GE-Spear4',    subjectName: 'Physical Activity Towards Health & Fitness 2',  lectureUnits: 0, labUnits: 2 },
  { program: 'GE', subjectCode: 'GE-NSTP1',     subjectName: 'NSTP 1 (LTS/CWTS/ROTC)',                        lectureUnits: 0, labUnits: 3 },
  { program: 'GE', subjectCode: 'GE-NSTP2',     subjectName: 'NSTP 2 (CWTS)',                                  lectureUnits: 0, labUnits: 3 },
  { program: 'GE', subjectCode: 'GE-FL10',      subjectName: 'Foreign Language',                               lectureUnits: 3, labUnits: 0 },

  // ════════════════════════════════════════════════════════════════════════
  // BSA — Bachelor of Science in Agriculture
  // ════════════════════════════════════════════════════════════════════════
  // 1st Semester subjects
  { program: 'BSA', yearLevel: '1st Year', semester: '1st Semester', subjectCode: 'Ag1',       subjectName: 'Introduction to Agriculture',                      lectureUnits: 3, labUnits: 0 },
  { program: 'BSA', yearLevel: '1st Year', semester: '1st Semester', subjectCode: 'AS1',       subjectName: 'Introduction to Animal Science',                   lectureUnits: 2, labUnits: 1 },
  { program: 'BSA', yearLevel: '1st Year', semester: '1st Semester', subjectCode: 'CS1',       subjectName: 'Principles of Crop Production',                    lectureUnits: 2, labUnits: 1 },
  { program: 'BSA', yearLevel: '1st Year', semester: '1st Semester', subjectCode: 'CP1',       subjectName: 'Principles of Crop Protection',                    lectureUnits: 2, labUnits: 1 },
  { program: 'BSA', yearLevel: '1st Year', semester: '1st Semester', subjectCode: 'Chem102',   subjectName: 'Organic Chemistry',                                lectureUnits: 2, labUnits: 1 },
  // 2nd Semester subjects
  { program: 'BSA', yearLevel: '1st Year', semester: '2nd Semester', subjectCode: 'SS1',       subjectName: 'Principles of Soil Science',                       lectureUnits: 2, labUnits: 1 },
  { program: 'BSA', yearLevel: '1st Year', semester: '2nd Semester', subjectCode: 'Ag2',       subjectName: 'Introduction to Organic Agriculture',              lectureUnits: 3, labUnits: 0 },
  { program: 'BSA', yearLevel: '1st Year', semester: '2nd Semester', subjectCode: 'AS2',       subjectName: 'Introduction to Livestock & Poultry Production',  lectureUnits: 2, labUnits: 1 },
  { program: 'BSA', yearLevel: '1st Year', semester: '2nd Semester', subjectCode: 'CS2',       subjectName: 'Practices of Crop Science & Management',           lectureUnits: 2, labUnits: 1 },
  { program: 'BSA', yearLevel: '1st Year', semester: '2nd Semester', subjectCode: 'CP2',       subjectName: 'Approaches & Practices in Pest Management',        lectureUnits: 2, labUnits: 1 },
  // 2nd Year
  { program: 'BSA', yearLevel: '2nd Year', semester: '1st Semester', subjectCode: 'Ag3',       subjectName: 'Slaughter of Animals & Animal Products Processing', lectureUnits: 2, labUnits: 1 },
  { program: 'BSA', yearLevel: '2nd Year', semester: '1st Semester', subjectCode: 'Chem104',   subjectName: 'General Biochemistry',                             lectureUnits: 2, labUnits: 1 },
  { program: 'BSA', yearLevel: '2nd Year', semester: '1st Semester', subjectCode: 'SS2',       subjectName: 'Soil Fertility, Conservation & Management',        lectureUnits: 2, labUnits: 1 },
  { program: 'BSA', yearLevel: '2nd Year', semester: '1st Semester', subjectCode: 'AgEx1',     subjectName: 'Principles of Agricultural Extension & Communication', lectureUnits: 3, labUnits: 0 },
  { program: 'BSA', yearLevel: '2nd Year', semester: '2nd Semester', subjectCode: 'Ag5',       subjectName: 'Principles of Genetics',                           lectureUnits: 2, labUnits: 1 },
  { program: 'BSA', yearLevel: '2nd Year', semester: '2nd Semester', subjectCode: 'Ag7',       subjectName: 'Basic Farm Machineries, Mechanization & Water Management', lectureUnits: 3, labUnits: 0 },
  { program: 'BSA', yearLevel: '2nd Year', semester: '2nd Semester', subjectCode: 'Ag9',       subjectName: 'Postharvest Handling & Seed Technology',           lectureUnits: 2, labUnits: 1 },
  { program: 'BSA', yearLevel: '2nd Year', semester: '2nd Semester', subjectCode: 'Ag6',       subjectName: 'Methods of Agricultural Research',                 lectureUnits: 2, labUnits: 1 },
  { program: 'BSA', yearLevel: '2nd Year', semester: '2nd Semester', subjectCode: 'Ag8',       subjectName: 'Natural Resource & Environmental Management',      lectureUnits: 3, labUnits: 0 },
  { program: 'BSA', yearLevel: '2nd Year', semester: '2nd Semester', subjectCode: 'Ag4',       subjectName: 'Introduction to Agriculture Community Systems',    lectureUnits: 2, labUnits: 1 },
  // 3rd Year
  { program: 'BSA', yearLevel: '3rd Year', semester: '1st Semester', subjectCode: 'AgCS101',   subjectName: 'Plant Propagation & Nursery Management',           lectureUnits: 2, labUnits: 1 },
  { program: 'BSA', yearLevel: '3rd Year', semester: '1st Semester', subjectCode: 'AgCS102',   subjectName: 'Vegetable Crops Production',                       lectureUnits: 2, labUnits: 1 },
  { program: 'BSA', yearLevel: '3rd Year', semester: '1st Semester', subjectCode: 'Ag10',      subjectName: 'Seminar A',                                        lectureUnits: 1, labUnits: 0 },
  { program: 'BSA', yearLevel: '3rd Year', semester: '1st Semester', subjectCode: 'Ag11a',     subjectName: 'Thesis 1 (Outline) / Major Farm Practice',         lectureUnits: 0, labUnits: 2 },
  { program: 'BSA', yearLevel: '3rd Year', semester: '1st Semester', subjectCode: 'Ag12',      subjectName: 'Agricultural Biotechnology',                       lectureUnits: 2, labUnits: 1 },
  { program: 'BSA', yearLevel: '3rd Year', semester: '2nd Semester', subjectCode: 'AgCS104',   subjectName: 'Perennial Industrial Crops Production',            lectureUnits: 2, labUnits: 1 },
  { program: 'BSA', yearLevel: '3rd Year', semester: '2nd Semester', subjectCode: 'Ag15',      subjectName: 'Beneficial Arthropods & Microorganisms',           lectureUnits: 2, labUnits: 1 },
  { program: 'BSA', yearLevel: '3rd Year', semester: '2nd Semester', subjectCode: 'Ag11b',     subjectName: 'Thesis 2 (Experimentation) / Major Farm Practice', lectureUnits: 0, labUnits: 2 },
  { program: 'BSA', yearLevel: '3rd Year', semester: '2nd Semester', subjectCode: 'AgCS103',   subjectName: 'Ornamentals & Landscape Horticulture',             lectureUnits: 2, labUnits: 1 },
  { program: 'BSA', yearLevel: '3rd Year', semester: '2nd Semester', subjectCode: 'Ag13',      subjectName: 'Introduction to Agricultural Policy & Development', lectureUnits: 3, labUnits: 0 },
  { program: 'BSA', yearLevel: '3rd Year', semester: '2nd Semester', subjectCode: 'Ag14',      subjectName: 'Seminar B',                                        lectureUnits: 1, labUnits: 0 },
  // 4th Year
  { program: 'BSA', yearLevel: '4th Year', semester: '2nd Semester', subjectCode: 'Ag19b',     subjectName: 'Competency Skills Appraisal in Agriculture II',    lectureUnits: 3, labUnits: 0 },
  { program: 'BSA', yearLevel: '4th Year', semester: '2nd Semester', subjectCode: 'Ag18',      subjectName: 'Apprenticeship / OJT / Industry Exposure (240 hrs)', lectureUnits: 0, labUnits: 3 },
  { program: 'BSA', yearLevel: '4th Year', semester: '1st Semester', subjectCode: 'Entrep1',   subjectName: 'Principles of Agricultural Entrepreneurship & Enterprise Development', lectureUnits: 3, labUnits: 0 },

  // ════════════════════════════════════════════════════════════════════════
  // BSAM — Bachelor of Science in Agribusiness Management
  // ════════════════════════════════════════════════════════════════════════
  // 1st Year
  { program: 'BSAM', yearLevel: '1st Year', semester: '1st Semester', subjectCode: 'AM110',    subjectName: 'Concepts and Dynamics of Management',              lectureUnits: 3, labUnits: 0 },
  { program: 'BSAM', yearLevel: '1st Year', semester: '1st Semester', subjectCode: 'AM111',    subjectName: 'Principles of Accounting',                         lectureUnits: 3, labUnits: 0 },
  { program: 'BSAM', yearLevel: '1st Year', semester: '1st Semester', subjectCode: 'AM112',    subjectName: 'Principles of Economics',                          lectureUnits: 3, labUnits: 0 },
  { program: 'BSAM', yearLevel: '1st Year', semester: '1st Semester', subjectCode: 'Agri101',  subjectName: 'Introduction to Agriculture',                      lectureUnits: 1, labUnits: 0 },
  { program: 'BSAM', yearLevel: '1st Year', semester: '1st Semester', subjectCode: 'CropSci101',subjectName: 'Fundamentals of Crop Science',                    lectureUnits: 2, labUnits: 1 },
  { program: 'BSAM', yearLevel: '1st Year', semester: '2nd Semester', subjectCode: 'AM113',    subjectName: 'Managerial Accounting',                            lectureUnits: 3, labUnits: 0 },
  { program: 'BSAM', yearLevel: '1st Year', semester: '2nd Semester', subjectCode: 'AM114',    subjectName: 'Business and Income Taxation',                     lectureUnits: 3, labUnits: 0 },
  { program: 'BSAM', yearLevel: '1st Year', semester: '2nd Semester', subjectCode: 'AM115',    subjectName: 'Intermediate Microeconomics Theory',               lectureUnits: 3, labUnits: 0 },
  { program: 'BSAM', yearLevel: '1st Year', semester: '2nd Semester', subjectCode: 'AM116',    subjectName: 'Intro to Agribusiness Management',                 lectureUnits: 3, labUnits: 0 },
  { program: 'BSAM', yearLevel: '1st Year', semester: '2nd Semester', subjectCode: 'AnSci101', subjectName: 'Introduction to Animal Science',                   lectureUnits: 2, labUnits: 1 },
  { program: 'BSAM', yearLevel: '1st Year', semester: '2nd Semester', subjectCode: 'AgEng101', subjectName: 'Agricultural Engineering',                         lectureUnits: 2, labUnits: 1 },
  { program: 'BSAM', yearLevel: '1st Year', semester: '2nd Semester', subjectCode: 'SoilSci101',subjectName: 'Principles of Soil Science',                      lectureUnits: 2, labUnits: 1 },
  { program: 'BSAM', yearLevel: '1st Year', semester: '2nd Semester', subjectCode: 'CropProt101',subjectName: 'Entomology',                                     lectureUnits: 2, labUnits: 1 },
  { program: 'BSAM', yearLevel: '1st Year', semester: '2nd Semester', subjectCode: 'CropSci102',subjectName: 'Fundamentals of Horticulture',                    lectureUnits: 2, labUnits: 1 },
  // 2nd Year
  { program: 'BSAM', yearLevel: '2nd Year', semester: '1st Semester', subjectCode: 'AM120',    subjectName: 'Introduction to Entrepreneurship',                 lectureUnits: 3, labUnits: 0 },
  { program: 'BSAM', yearLevel: '2nd Year', semester: '1st Semester', subjectCode: 'AM121',    subjectName: 'Introduction to Human Behavior in Organization',   lectureUnits: 3, labUnits: 0 },
  { program: 'BSAM', yearLevel: '2nd Year', semester: '1st Semester', subjectCode: 'AM122',    subjectName: 'Cooperative Management and Governance',            lectureUnits: 3, labUnits: 0 },
  { program: 'BSAM', yearLevel: '2nd Year', semester: '2nd Semester', subjectCode: 'AM123',    subjectName: 'New Enterprise Planning',                          lectureUnits: 3, labUnits: 0 },
  { program: 'BSAM', yearLevel: '2nd Year', semester: '2nd Semester', subjectCode: 'AM124',    subjectName: 'Intro to Human Resource Management',               lectureUnits: 3, labUnits: 0 },
  { program: 'BSAM', yearLevel: '2nd Year', semester: '2nd Semester', subjectCode: 'AM125',    subjectName: 'Intro to Managerial Economics',                    lectureUnits: 3, labUnits: 0 },
  { program: 'BSAM', yearLevel: '2nd Year', semester: '2nd Semester', subjectCode: 'AgExt101', subjectName: 'Agricultural Extension and Communication',         lectureUnits: 3, labUnits: 0 },
  { program: 'BSAM', yearLevel: '2nd Year', semester: '2nd Semester', subjectCode: 'CropProt102',subjectName: 'Plant Pathology',                               lectureUnits: 2, labUnits: 1 },
  { program: 'BSAM', yearLevel: '2nd Year', semester: '2nd Semester', subjectCode: 'AnSci102', subjectName: 'Intro to Livestock and Poultry Production',        lectureUnits: 2, labUnits: 1 },
  // 3rd Year
  { program: 'BSAM', yearLevel: '3rd Year', semester: '1st Semester', subjectCode: 'AM130',    subjectName: 'Introduction to Marketing Management',             lectureUnits: 3, labUnits: 0 },
  { program: 'BSAM', yearLevel: '3rd Year', semester: '1st Semester', subjectCode: 'AM131',    subjectName: 'Intro to Org\'n & Management of Small Business',   lectureUnits: 3, labUnits: 0 },
  { program: 'BSAM', yearLevel: '3rd Year', semester: '1st Semester', subjectCode: 'AM132',    subjectName: 'Agribusiness Research Methodology',                lectureUnits: 3, labUnits: 0 },
  { program: 'BSAM', yearLevel: '3rd Year', semester: '1st Semester', subjectCode: 'AM133',    subjectName: 'Value Chain Management',                           lectureUnits: 3, labUnits: 0 },
  { program: 'BSAM', yearLevel: '3rd Year', semester: '2nd Semester', subjectCode: 'AM135',    subjectName: 'Intro to Financial Management',                    lectureUnits: 3, labUnits: 0 },
  { program: 'BSAM', yearLevel: '3rd Year', semester: '2nd Semester', subjectCode: 'AM136',    subjectName: 'Intro to International Marketing',                 lectureUnits: 3, labUnits: 0 },
  { program: 'BSAM', yearLevel: '3rd Year', semester: '2nd Semester', subjectCode: 'AM137',    subjectName: 'Intro to Prod & Operation Management',             lectureUnits: 3, labUnits: 0 },
  { program: 'BSAM', yearLevel: '3rd Year', semester: '2nd Semester', subjectCode: 'AM134',    subjectName: 'Business Law',                                     lectureUnits: 3, labUnits: 0 },
  { program: 'BSAM', yearLevel: '3rd Year', semester: '2nd Semester', subjectCode: 'AM138',    subjectName: 'Agribusiness Research Methodology',                lectureUnits: 3, labUnits: 0 },
  // 4th Year
  { program: 'BSAM', yearLevel: '4th Year', semester: '1st Semester', subjectCode: 'AM141',    subjectName: 'Agribusiness Finance',                             lectureUnits: 3, labUnits: 0 },
  { program: 'BSAM', yearLevel: '4th Year', semester: '1st Semester', subjectCode: 'AM143',    subjectName: 'Agribusiness Research Methodology',                lectureUnits: 3, labUnits: 0 },
  { program: 'BSAM', yearLevel: '4th Year', semester: '2nd Semester', subjectCode: 'AM144',    subjectName: 'Introduction to Investment Management',            lectureUnits: 3, labUnits: 0 },
  { program: 'BSAM', yearLevel: '4th Year', semester: '2nd Semester', subjectCode: 'AM145',    subjectName: 'Special Problem',                                  lectureUnits: 3, labUnits: 0 },

  // ════════════════════════════════════════════════════════════════════════
  // BSES — Bachelor of Science in Environmental Science
  // ════════════════════════════════════════════════════════════════════════
  { program: 'BSES', yearLevel: '1st Year', semester: '1st Semester', subjectCode: 'Bot100',    subjectName: 'General Botany',                                   lectureUnits: 3, labUnits: 2 },
  { program: 'BSES', yearLevel: '1st Year', semester: '1st Semester', subjectCode: 'Phys110',   subjectName: 'Physics for Environmental Science',                lectureUnits: 3, labUnits: 2 },
  { program: 'BSES', yearLevel: '1st Year', semester: '1st Semester', subjectCode: 'EnviSci100',subjectName: 'Environmental Chemistry and Quality Monitoring',   lectureUnits: 3, labUnits: 2 },
  { program: 'BSES', yearLevel: '1st Year', semester: '1st Semester', subjectCode: 'EnviMgt100',subjectName: 'Principles of Environmental Management',           lectureUnits: 3, labUnits: 0 },
  { program: 'BSES', yearLevel: '1st Year', semester: '1st Semester', subjectCode: 'NatSci102', subjectName: 'Marine Science',                                   lectureUnits: 3, labUnits: 2 },
  { program: 'BSES', yearLevel: '1st Year', semester: '2nd Semester', subjectCode: 'Chem100',   subjectName: 'General & Inorganic Chemistry',                    lectureUnits: 3, labUnits: 2 },
  { program: 'BSES', yearLevel: '1st Year', semester: '2nd Semester', subjectCode: 'Math16',    subjectName: 'College Mathematics for Environmental Science',    lectureUnits: 3, labUnits: 0 },
  { program: 'BSES', yearLevel: '2nd Year', semester: '1st Semester', subjectCode: 'EnviSci196',subjectName: 'Seminar & Research Methods in Environmental Science', lectureUnits: 3, labUnits: 0 },
  { program: 'BSES', yearLevel: '2nd Year', semester: '2nd Semester', subjectCode: 'Bio102',    subjectName: 'General Ecology',                                  lectureUnits: 3, labUnits: 2 },
  { program: 'BSES', yearLevel: '2nd Year', semester: '2nd Semester', subjectCode: 'Math18',    subjectName: 'Statistics for Bioscience',                        lectureUnits: 3, labUnits: 0 },
  { program: 'BSES', yearLevel: '2nd Year', semester: '2nd Semester', subjectCode: 'Chem102ES', subjectName: 'Organic Chemistry',                                lectureUnits: 3, labUnits: 2 },
  { program: 'BSES', yearLevel: '3rd Year', semester: '1st Semester', subjectCode: 'EnviSci196B',subjectName: 'Seminar & Research Methods in Environmental Science II', lectureUnits: 3, labUnits: 0 },
  { program: 'BSES', yearLevel: '4th Year', semester: '2nd Semester', subjectCode: 'EnviSci109',subjectName: 'Environmental Impact Assessment',                  lectureUnits: 3, labUnits: 0 },
  { program: 'BSES', yearLevel: '4th Year', semester: '2nd Semester', subjectCode: 'EnviSci107',subjectName: 'Environmental Psychology',                         lectureUnits: 3, labUnits: 0 },
  { program: 'BSES', yearLevel: '4th Year', semester: '2nd Semester', subjectCode: 'EnviSci106',subjectName: 'Environmental Ethics, Policies & Laws',             lectureUnits: 3, labUnits: 0 },
  { program: 'BSES', yearLevel: '4th Year', semester: '2nd Semester', subjectCode: 'EnviSci108',subjectName: 'Climate Change Studies',                           lectureUnits: 3, labUnits: 0 },

  // ════════════════════════════════════════════════════════════════════════
  // BSHM — Bachelor of Science in Hospitality Management
  // ════════════════════════════════════════════════════════════════════════
  { program: 'BSHM', yearLevel: '1st Year', semester: '1st Semester', subjectCode: 'THC100',   subjectName: 'Macro Perspective of Tourism and Hospitality',    lectureUnits: 3, labUnits: 0 },
  { program: 'BSHM', yearLevel: '1st Year', semester: '1st Semester', subjectCode: 'HPC101',   subjectName: 'Kitchen Essentials & Basic Food Preparation',     lectureUnits: 2, labUnits: 1 },
  { program: 'BSHM', yearLevel: '1st Year', semester: '1st Semester', subjectCode: 'HPC102',   subjectName: 'Fundamentals in FS Operations',                   lectureUnits: 2, labUnits: 1 },
  { program: 'BSHM', yearLevel: '1st Year', semester: '2nd Semester', subjectCode: 'THC103',   subjectName: 'Risk Management as Applied to Safety, Security and Sanitation', lectureUnits: 3, labUnits: 0 },
  { program: 'BSHM', yearLevel: '1st Year', semester: '2nd Semester', subjectCode: 'THC106',   subjectName: 'Micro Perspective of Tourism and Hospitality',    lectureUnits: 3, labUnits: 0 },
  { program: 'BSHM', yearLevel: '1st Year', semester: '2nd Semester', subjectCode: 'THC104',   subjectName: 'Quality Service Management in Tourism and Hospitality', lectureUnits: 3, labUnits: 0 },
  { program: 'BSHM', yearLevel: '1st Year', semester: '2nd Semester', subjectCode: 'HPC107',   subjectName: 'Fundamentals in Lodging Operations',              lectureUnits: 2, labUnits: 1 },
  { program: 'BSHM', yearLevel: '1st Year', semester: '2nd Semester', subjectCode: 'HMPE108',  subjectName: 'Bar and Beverage Management w/ Lab',              lectureUnits: 2, labUnits: 1 },
  { program: 'BSHM', yearLevel: '1st Year', semester: '2nd Semester', subjectCode: 'THC105',   subjectName: 'Philippine Tourism Geography and Culture',        lectureUnits: 3, labUnits: 0 },
  { program: 'BSHM', yearLevel: '1st Year', semester: '2nd Semester', subjectCode: 'BHM109',   subjectName: 'Organization and Management',                     lectureUnits: 3, labUnits: 0 },
  { program: 'BSHM', yearLevel: '2nd Year', semester: '1st Semester', subjectCode: 'HMPE120',  subjectName: 'Culinary Fundamentals w/ Lab',                    lectureUnits: 2, labUnits: 1 },
  { program: 'BSHM', yearLevel: '2nd Year', semester: '1st Semester', subjectCode: 'HMPE121',  subjectName: 'Front Office Operation',                          lectureUnits: 2, labUnits: 1 },
  { program: 'BSHM', yearLevel: '2nd Year', semester: '1st Semester', subjectCode: 'HPC122',   subjectName: 'Foreign Language 1',                              lectureUnits: 3, labUnits: 0 },
  { program: 'BSHM', yearLevel: '2nd Year', semester: '1st Semester', subjectCode: 'BHM123',   subjectName: 'Applied Economics',                               lectureUnits: 3, labUnits: 0 },
  { program: 'BSHM', yearLevel: '2nd Year', semester: '1st Semester', subjectCode: 'BHM124',   subjectName: 'Business Finance',                                lectureUnits: 3, labUnits: 0 },
  { program: 'BSHM', yearLevel: '2nd Year', semester: '2nd Semester', subjectCode: 'HPC125',   subjectName: 'Foreign Language 2',                              lectureUnits: 3, labUnits: 0 },
  { program: 'BSHM', yearLevel: '2nd Year', semester: '2nd Semester', subjectCode: 'HPC126',   subjectName: 'Supply Chain Management in Hospitality Industry', lectureUnits: 3, labUnits: 0 },
  { program: 'BSHM', yearLevel: '2nd Year', semester: '2nd Semester', subjectCode: 'BHM126',   subjectName: 'Business Marketing',                              lectureUnits: 3, labUnits: 0 },
  { program: 'BSHM', yearLevel: '2nd Year', semester: '2nd Semester', subjectCode: 'HPC128',   subjectName: 'Applied Business Tools and Technologies PMS w/ Lab', lectureUnits: 2, labUnits: 1 },
  { program: 'BSHM', yearLevel: '2nd Year', semester: '2nd Semester', subjectCode: 'BHM129',   subjectName: 'Fundamentals of Accounting',                      lectureUnits: 3, labUnits: 0 },
  { program: 'BSHM', yearLevel: '3rd Year', semester: '1st Semester', subjectCode: 'BME130',   subjectName: 'Operations Management in Tourism and Hospitality Industry', lectureUnits: 3, labUnits: 0 },
  { program: 'BSHM', yearLevel: '3rd Year', semester: '1st Semester', subjectCode: 'THC131',   subjectName: 'Tourism and Hospitality Marketing',               lectureUnits: 3, labUnits: 0 },
  { program: 'BSHM', yearLevel: '3rd Year', semester: '1st Semester', subjectCode: 'HPC132',   subjectName: 'Introduction to MICE',                            lectureUnits: 2, labUnits: 1 },
  { program: 'BSHM', yearLevel: '3rd Year', semester: '1st Semester', subjectCode: 'HMPE133',  subjectName: 'Cost Control',                                    lectureUnits: 2, labUnits: 1 },
  { program: 'BSHM', yearLevel: '3rd Year', semester: '1st Semester', subjectCode: 'THC134',   subjectName: 'Professional Development & Applied Ethics',       lectureUnits: 3, labUnits: 0 },
  { program: 'BSHM', yearLevel: '3rd Year', semester: '1st Semester', subjectCode: 'HPC135',   subjectName: 'Research in Hospitality',                         lectureUnits: 3, labUnits: 0 },
  { program: 'BSHM', yearLevel: '3rd Year', semester: '2nd Semester', subjectCode: 'THC139',   subjectName: 'Legal Aspects in Tourism and Hospitality',        lectureUnits: 3, labUnits: 0 },
  { program: 'BSHM', yearLevel: '3rd Year', semester: '2nd Semester', subjectCode: 'BME126',   subjectName: 'Strategic Management in Tourism and Hospitality', lectureUnits: 3, labUnits: 0 },
  { program: 'BSHM', yearLevel: '3rd Year', semester: '2nd Semester', subjectCode: 'HMPE127',  subjectName: 'Catering Management',                             lectureUnits: 2, labUnits: 1 },
  { program: 'BSHM', yearLevel: '3rd Year', semester: '2nd Semester', subjectCode: 'HPC140',   subjectName: 'Ergonomics & Facilities Planning for Hospitality Industry', lectureUnits: 3, labUnits: 0 },
  { program: 'BSHM', yearLevel: '3rd Year', semester: '2nd Semester', subjectCode: 'THC138',   subjectName: 'Entrepreneurship in Tourism and Hospitality',     lectureUnits: 3, labUnits: 0 },
  { program: 'BSHM', yearLevel: '3rd Year', semester: '2nd Semester', subjectCode: 'THC141',   subjectName: 'Multicultural Diversity in Workplace for Tourism Professional', lectureUnits: 3, labUnits: 0 },
  { program: 'BSHM', yearLevel: '4th Year', semester: '2nd Semester', subjectCode: 'PRACB',    subjectName: 'Practicum B',                                     lectureUnits: 0, labUnits: 3 },

  // ════════════════════════════════════════════════════════════════════════
  // BSIT — Bachelor of Science in Information Technology
  // ════════════════════════════════════════════════════════════════════════
  { program: 'BSIT', yearLevel: '3rd Year', semester: '1st Semester', subjectCode: 'ITP131',   subjectName: 'Networking 2',                                    lectureUnits: 2, labUnits: 1 },
  { program: 'BSIT', yearLevel: '3rd Year', semester: '1st Semester', subjectCode: 'ITP132',   subjectName: 'Advanced Database Systems',                       lectureUnits: 2, labUnits: 1 },
  { program: 'BSIT', yearLevel: '3rd Year', semester: '1st Semester', subjectCode: 'ITP130',   subjectName: 'Social & Professional Issues',                    lectureUnits: 3, labUnits: 0 },
  { program: 'BSIT', yearLevel: '3rd Year', semester: '1st Semester', subjectCode: 'ITFreeElec1',subjectName: 'IT Professional Free Elective 1',                lectureUnits: 3, labUnits: 0 },
  { program: 'BSIT', yearLevel: '3rd Year', semester: '1st Semester', subjectCode: 'ITFreeElec2',subjectName: 'IT Professional Free Elective 2',                lectureUnits: 2, labUnits: 1 },
  { program: 'BSIT', yearLevel: '3rd Year', semester: '1st Semester', subjectCode: 'ITP133',   subjectName: 'Systems Integration & Architecture 1',            lectureUnits: 2, labUnits: 1 },
  { program: 'BSIT', yearLevel: '3rd Year', semester: '1st Semester', subjectCode: 'ITPE130',  subjectName: 'Integrative Programming & Technologies 2',        lectureUnits: 2, labUnits: 1 },
  { program: 'BSIT', yearLevel: '4th Year', semester: '2nd Semester', subjectCode: 'ITP142',   subjectName: 'Practicum (486 hrs)',                              lectureUnits: 0, labUnits: 6 },

  // ════════════════════════════════════════════════════════════════════════
  // BSM — Bachelor of Science in Mathematics
  // ════════════════════════════════════════════════════════════════════════
  { program: 'BSM', yearLevel: '2nd Year', semester: '1st Semester', subjectCode: 'Math110',   subjectName: 'Calculus III',                                    lectureUnits: 4, labUnits: 0 },
  { program: 'BSM', yearLevel: '2nd Year', semester: '1st Semester', subjectCode: 'Math111',   subjectName: 'Set Theory',                                      lectureUnits: 3, labUnits: 0 },
  { program: 'BSM', yearLevel: '2nd Year', semester: '1st Semester', subjectCode: 'Math112',   subjectName: 'Linear Algebra',                                  lectureUnits: 3, labUnits: 0 },
  { program: 'BSM', yearLevel: '2nd Year', semester: '1st Semester', subjectCode: 'Phys10',    subjectName: 'General Physics',                                 lectureUnits: 3, labUnits: 1 },
  { program: 'BSM', yearLevel: '2nd Year', semester: '1st Semester', subjectCode: 'Math127',   subjectName: 'Statistical Theory',                              lectureUnits: 3, labUnits: 0 },
  { program: 'BSM', yearLevel: '3rd Year', semester: '1st Semester', subjectCode: 'Math134',   subjectName: 'Number Theory',                                   lectureUnits: 3, labUnits: 0 },
  { program: 'BSM', yearLevel: '3rd Year', semester: '1st Semester', subjectCode: 'Math118',   subjectName: 'Abstract Algebra II',                             lectureUnits: 3, labUnits: 0 },
  { program: 'BSM', yearLevel: '3rd Year', semester: '1st Semester', subjectCode: 'Math126',   subjectName: 'Discrete Mathematics',                            lectureUnits: 3, labUnits: 0 },
  { program: 'BSM', yearLevel: '3rd Year', semester: '1st Semester', subjectCode: 'Math137',   subjectName: 'Actuarial Mathematics I',                         lectureUnits: 3, labUnits: 0 },
  { program: 'BSM', yearLevel: '3rd Year', semester: '2nd Semester', subjectCode: 'Math113',   subjectName: 'Advanced Calculus I',                             lectureUnits: 3, labUnits: 0 },
  { program: 'BSM', yearLevel: '3rd Year', semester: '2nd Semester', subjectCode: 'Math135',   subjectName: 'Graph Theory and Analysis',                       lectureUnits: 3, labUnits: 0 },
  { program: 'BSM', yearLevel: '3rd Year', semester: '2nd Semester', subjectCode: 'Math133',   subjectName: 'Mathematical Modeling',                           lectureUnits: 3, labUnits: 2 },
  { program: 'BSM', yearLevel: '3rd Year', semester: '2nd Semester', subjectCode: 'Math131',   subjectName: 'Numerical Analysis',                              lectureUnits: 3, labUnits: 0 },
  { program: 'BSM', yearLevel: '4th Year', semester: '2nd Semester', subjectCode: 'Math146',   subjectName: 'Modern Geometry',                                 lectureUnits: 3, labUnits: 0 },
  { program: 'BSM', yearLevel: '4th Year', semester: '2nd Semester', subjectCode: 'Math145',   subjectName: 'Topology',                                        lectureUnits: 3, labUnits: 0 },
  { program: 'BSM', yearLevel: '4th Year', semester: '2nd Semester', subjectCode: 'Math199',   subjectName: 'Thesis B',                                        lectureUnits: 3, labUnits: 0 },
];

// Faculty seed list — Baganga Campus (BGA), real roster merged from 1st & 2nd semesters
const FACULTY_SEED = [
  // ── Full-time ─────────────────────────────────────────────────────────────
  {
    name: { first: 'Jeoffrey', last: 'Acebes' },
    email: 'jeoffrey.acebes@dorsu.edu.ph',
    program: 'BSA',
    employmentType: 'full-time' as const,
    minLoad: 18, maxLoad: 26, status: 'active' as const,
  },
  {
    name: { first: 'Marlone', middle: 'M', last: 'Barrete' },
    email: 'marlone.barrete@dorsu.edu.ph',
    program: 'BSES',
    employmentType: 'full-time' as const,
    designation: 'Auxiliary Program Head, BSES',
    adminLoad: 3,
    minLoad: 18, maxLoad: 26, status: 'active' as const,
  },
  {
    name: { first: 'Joe Arvie', middle: 'C', last: 'Cagulangan' },
    email: 'joe.cagulangan@dorsu.edu.ph',
    program: 'GE',
    employmentType: 'full-time' as const,
    designation: 'Admission Designate, Guidance Advocate & Gen. Ed Coordinator',
    adminLoad: 6,
    minLoad: 18, maxLoad: 26, status: 'active' as const,
  },
  {
    name: { first: 'Prince Jerald', middle: 'A', last: 'Cordova' },
    email: 'prince.cordova@dorsu.edu.ph',
    program: 'GE',
    employmentType: 'full-time' as const,
    designation: 'Scholarship In-Charge and NSTP Coordinator',
    adminLoad: 6,
    minLoad: 18, maxLoad: 26, status: 'active' as const,
  },
  {
    name: { first: 'Jhon Lloyd', middle: 'D', last: 'Flores' },
    email: 'jhon.flores@dorsu.edu.ph',
    program: 'BSA',
    employmentType: 'full-time' as const,
    designation: 'NSTP & RIE Coordinator',
    adminLoad: 6,
    minLoad: 18, maxLoad: 26, status: 'active' as const,
  },
  {
    name: { first: 'Vincent', middle: 'S', last: 'Languay' },
    email: 'vincent.languay@dorsu.edu.ph',
    program: 'BSAM',
    employmentType: 'full-time' as const,
    designation: 'Property Custodian and Sociocultural Coordinator',
    adminLoad: 6,
    minLoad: 18, maxLoad: 26, status: 'active' as const,
  },
  {
    name: { first: 'James Karlo', middle: 'S', last: 'Maiso' },
    email: 'james.maiso@dorsu.edu.ph',
    program: 'BSA',
    employmentType: 'full-time' as const,
    designation: 'Program Coordinator',
    adminLoad: 6,
    minLoad: 18, maxLoad: 26, status: 'active' as const,
  },
  {
    name: { first: 'Mohamid', middle: 'R', last: 'Masukat' },
    email: 'mohamid.masukat@dorsu.edu.ph',
    program: 'BSIT',
    employmentType: 'full-time' as const,
    designation: 'Program Head, ICT Coordinator',
    adminLoad: 6,
    minLoad: 18, maxLoad: 26, status: 'active' as const,
  },
  {
    name: { first: 'Jerel', middle: 'M', last: 'Menendez' },
    email: 'jerel.menendez@dorsu.edu.ph',
    program: 'BSES',
    employmentType: 'full-time' as const,
    minLoad: 18, maxLoad: 26, status: 'active' as const,
  },
  {
    name: { first: 'Israel', middle: 'B', last: 'Obedencio' },
    email: 'israel.obedencio@dorsu.edu.ph',
    program: 'BSAM',
    employmentType: 'full-time' as const,
    designation: 'Program Coordinator, BSAM',
    adminLoad: 6,
    minLoad: 18, maxLoad: 26, status: 'active' as const,
  },
  {
    name: { first: 'Ace', last: 'Palma Gil' },
    email: 'ace.palmagil@dorsu.edu.ph',
    program: 'BSES',
    employmentType: 'full-time' as const,
    minLoad: 18, maxLoad: 26, status: 'active' as const,
  },
  {
    name: { first: 'Purisima', middle: 'N', last: 'Tampus' },
    email: 'purisima.tampus@dorsu.edu.ph',
    program: 'BSAM',
    employmentType: 'full-time' as const,
    designation: 'Campus Administrator',
    adminLoad: 9,
    minLoad: 18, maxLoad: 26, status: 'active' as const,
  },

  // ── Part-time ─────────────────────────────────────────────────────────────
  {
    name: { first: 'Michael James', last: 'Adanza' },
    email: 'michael.adanza@dorsu.edu.ph',
    program: 'GE',
    employmentType: 'part-time' as const,
    minLoad: 18, maxLoad: 18, status: 'active' as const,
  },
  {
    name: { first: 'Geneva', last: 'Alba' },
    email: 'geneva.alba@dorsu.edu.ph',
    program: 'BSHM',
    employmentType: 'part-time' as const,
    minLoad: 18, maxLoad: 18, status: 'active' as const,
  },
  {
    name: { first: 'Michael', middle: 'P', last: 'Almine' },
    email: 'michael.almine@dorsu.edu.ph',
    program: 'GE',
    employmentType: 'part-time' as const,
    minLoad: 18, maxLoad: 18, status: 'active' as const,
  },
  {
    name: { first: 'Aila Joy', last: 'Andoyo' },
    email: 'aila.andoyo@dorsu.edu.ph',
    program: 'BSHM',
    employmentType: 'part-time' as const,
    minLoad: 18, maxLoad: 18, status: 'active' as const,
  },
  {
    name: { first: 'Renante', last: 'Andrada' },
    email: 'renante.andrada@dorsu.edu.ph',
    program: 'BSA',
    employmentType: 'part-time' as const,
    minLoad: 18, maxLoad: 18, status: 'active' as const,
  },
  {
    name: { first: 'Shounela', last: 'Batao' },
    email: 'shounela.batao@dorsu.edu.ph',
    program: 'GE',
    employmentType: 'part-time' as const,
    minLoad: 18, maxLoad: 18, status: 'active' as const,
  },
  {
    name: { first: 'Lynn', last: 'Dela Peña' },
    email: 'lynn.delapena@dorsu.edu.ph',
    program: 'GE',
    employmentType: 'part-time' as const,
    minLoad: 18, maxLoad: 18, status: 'active' as const,
  },
  {
    name: { first: 'Rojim', last: 'Ferrel' },
    email: 'rojim.ferrel@dorsu.edu.ph',
    program: 'BSM',
    employmentType: 'part-time' as const,
    minLoad: 18, maxLoad: 18, status: 'active' as const,
  },
  {
    name: { first: 'Juliet', last: 'Gregorio' },
    email: 'juliet.gregorio@dorsu.edu.ph',
    program: 'GE',
    employmentType: 'part-time' as const,
    minLoad: 18, maxLoad: 18, status: 'active' as const,
  },
  {
    name: { first: 'Antonio', last: 'Japson Jr.' },
    email: 'antonio.japson@dorsu.edu.ph',
    program: 'BSA',
    employmentType: 'part-time' as const,
    minLoad: 18, maxLoad: 18, status: 'active' as const,
  },
  {
    name: { first: 'Norma', last: 'Japson' },
    email: 'norma.japson@dorsu.edu.ph',
    program: 'BSHM',
    employmentType: 'part-time' as const,
    minLoad: 18, maxLoad: 18, status: 'active' as const,
  },
  {
    name: { first: 'Calixto', last: 'Licong Jr.' },
    email: 'calixto.licong@dorsu.edu.ph',
    program: 'BSA',
    employmentType: 'part-time' as const,
    minLoad: 18, maxLoad: 18, status: 'active' as const,
  },
  {
    name: { first: 'France', last: 'Manguiob' },
    email: 'france.manguiob@dorsu.edu.ph',
    program: 'BSHM',
    employmentType: 'part-time' as const,
    minLoad: 18, maxLoad: 18, status: 'active' as const,
  },
  {
    name: { first: 'Darryl Jay', last: 'Medrano' },
    email: 'darryl.medrano@dorsu.edu.ph',
    program: 'GE',
    employmentType: 'part-time' as const,
    minLoad: 18, maxLoad: 18, status: 'active' as const,
  },
  {
    name: { first: 'Ralph', last: 'Monday' },
    email: 'ralph.monday@dorsu.edu.ph',
    program: 'GE',
    employmentType: 'part-time' as const,
    designation: 'Atty.',
    minLoad: 18, maxLoad: 18, status: 'active' as const,
  },
  {
    name: { first: 'Emma', last: 'Morales' },
    email: 'emma.morales@dorsu.edu.ph',
    program: 'GE',
    employmentType: 'part-time' as const,
    minLoad: 18, maxLoad: 18, status: 'active' as const,
  },
  {
    name: { first: 'Giovanni', last: 'Morales' },
    email: 'giovanni.morales@dorsu.edu.ph',
    program: 'GE',
    employmentType: 'part-time' as const,
    designation: 'Atty.',
    minLoad: 18, maxLoad: 18, status: 'active' as const,
  },
  {
    name: { first: 'Arnold John', last: 'Morales' },
    email: 'arnoldjohn.morales@dorsu.edu.ph',
    program: 'BSA',
    employmentType: 'part-time' as const,
    minLoad: 18, maxLoad: 18, status: 'active' as const,
  },
  {
    name: { first: 'Armilyn', last: 'Pabalay' },
    email: 'armilyn.pabalay@dorsu.edu.ph',
    program: 'GE',
    employmentType: 'part-time' as const,
    minLoad: 18, maxLoad: 18, status: 'active' as const,
  },
  {
    name: { first: 'Gemar', last: 'Petere' },
    email: 'gemar.petere@dorsu.edu.ph',
    program: 'BSIT',
    employmentType: 'part-time' as const,
    minLoad: 18, maxLoad: 18, status: 'active' as const,
  },
  {
    name: { first: 'Ever Louie', last: 'Pogosa' },
    email: 'ever.pogosa@dorsu.edu.ph',
    program: 'BSIT',
    employmentType: 'part-time' as const,
    minLoad: 18, maxLoad: 18, status: 'active' as const,
  },
  {
    name: { first: 'Reginrex', last: 'Pusta' },
    email: 'reginrex.pusta@dorsu.edu.ph',
    program: 'BSES',
    employmentType: 'part-time' as const,
    minLoad: 18, maxLoad: 18, status: 'active' as const,
  },
  {
    name: { first: 'Elma', last: 'Reyes' },
    email: 'elma.reyes@dorsu.edu.ph',
    program: 'GE',
    employmentType: 'part-time' as const,
    minLoad: 18, maxLoad: 18, status: 'active' as const,
  },
  {
    name: { first: 'Lerma', last: 'Reyes' },
    email: 'lerma.reyes@dorsu.edu.ph',
    program: 'GE',
    employmentType: 'part-time' as const,
    minLoad: 18, maxLoad: 18, status: 'active' as const,
  },
  {
    name: { first: 'Marry Garce', last: 'Rico' },
    email: 'marry.rico@dorsu.edu.ph',
    program: 'BSHM',
    employmentType: 'part-time' as const,
    minLoad: 18, maxLoad: 18, status: 'active' as const,
  },
  {
    name: { first: 'Lourie Ann', last: 'Salamanes' },
    email: 'lourie.salamanes@dorsu.edu.ph',
    program: 'BSHM',
    employmentType: 'part-time' as const,
    minLoad: 18, maxLoad: 18, status: 'active' as const,
  },
  {
    name: { first: 'Princess Kharylle', last: 'Tindugan' },
    email: 'princess.tindugan@dorsu.edu.ph',
    program: 'GE',
    employmentType: 'part-time' as const,
    minLoad: 18, maxLoad: 18, status: 'active' as const,
  },
  {
    name: { first: 'Manuel', last: 'Valejo' },
    email: 'manuel.valejo@dorsu.edu.ph',
    program: 'BSM',
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
    console.log('🗑️  Resetting faculty, schedules, sections, and faculty users…');
    const { deletedCount: schedDel } = await Schedule.deleteMany({});
    const { deletedCount: facDel  } = await Faculty.deleteMany({});
    const { deletedCount: sectDel } = await Section.deleteMany({});
    const { deletedCount: userDel } = await User.deleteMany({ role: 'faculty' });
    console.log(`   Deleted ${schedDel} schedule(s), ${facDel} faculty member(s), ${sectDel} section(s), ${userDel} faculty user(s)\n`);
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
  let usersCreated = 0;
  let usersSkipped = 0;

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

    const newFaculty = await Faculty.create({ ...rest, program: programId });
    console.log(`   ✅  Created  ${f.name.last}, ${f.name.first}  (${progCode})`);
    created++;

    // Create a login account for the faculty member
    let user = await User.findOne({ email: f.email });
    if (!user) {
      user = new User({ email: f.email, password: 'faculty123', role: 'faculty' });
      await user.save(); // triggers bcrypt pre-save hook
      console.log(`   👤  User     ${f.email}`);
      usersCreated++;
    } else {
      usersSkipped++;
    }
    await Faculty.findByIdAndUpdate(newFaculty._id, { userId: user._id });
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
  console.log(`   Programs:        ${Object.keys(programMap).length} upserted`);
  console.log(`   Faculty:         ${created} created, ${skipped} skipped`);
  console.log(`   Users (faculty): ${usersCreated} created, ${usersSkipped} skipped`);
  console.log(`   Subjects:        ${subjCreated} created, ${subjSkipped} skipped`);
  console.log(`   Classrooms:      ${roomCreated} created, ${roomSkipped} skipped`);
  console.log(`   Sections:        ${sectCreated} created, ${sectSkipped} skipped`);
  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  mongoose.disconnect();
  process.exit(1);
});

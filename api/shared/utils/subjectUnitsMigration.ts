/**
 * Migration script to update existing subjects from single units field
 * to separate lectureUnits and labUnits fields
 */

import { Subject } from '../../models/subjectModel';
import mongoose from 'mongoose';

export async function migrateSubjectUnits() {
  console.log('Starting subject units migration...');

  try {
    // Find all subjects that don't have lectureUnits or labUnits defined
    const subjects = await Subject.find({
      $or: [
        { lectureUnits: { $exists: false } },
        { labUnits: { $exists: false } }
      ]
    });

    console.log(`Found ${subjects.length} subjects to migrate`);

    let migrated = 0;
    let failed = 0;

    for (const subject of subjects) {
      try {
        const oldUnits = (subject as any).units || 0;
        const wasLaboratory = (subject as any).isLaboratory || false;

        // Migration logic:
        // If subject was marked as laboratory and has units, split them
        // Common pattern: 3 lecture + 1 lab = 4 total units (but some use 4.25)
        // If not laboratory, all units are lecture units

        if (wasLaboratory && oldUnits > 0) {
          // If units is 4.25 or similar, use 3 lecture + 1.25 lab
          if (oldUnits > 4) {
            subject.lectureUnits = 3;
            subject.labUnits = oldUnits - 3;
          } else if (oldUnits === 4) {
            // Standard 3 lecture + 1 lab
            subject.lectureUnits = 3;
            subject.labUnits = 1;
          } else {
            // Smaller units, split proportionally (70% lecture, 30% lab)
            subject.lectureUnits = Math.round(oldUnits * 0.7 * 10) / 10;
            subject.labUnits = Math.round(oldUnits * 0.3 * 10) / 10;
          }
        } else {
          // Not a laboratory subject, all units are lecture units
          subject.lectureUnits = oldUnits;
          subject.labUnits = 0;
        }

        // Save the updated subject
        await subject.save();
        migrated++;

        console.log(`✓ Migrated: ${subject.subjectCode} - ${subject.subjectName} (${subject.lectureUnits}L + ${subject.labUnits}Lab = ${subject.units} units)`);
      } catch (error) {
        failed++;
        console.error(`✗ Failed to migrate ${subject.subjectCode}:`, error);
      }
    }

    console.log('\n=== Migration Summary ===');
    console.log(`Total subjects: ${subjects.length}`);
    console.log(`Successfully migrated: ${migrated}`);
    console.log(`Failed: ${failed}`);
    console.log('=========================\n');

    return {
      total: subjects.length,
      migrated,
      failed
    };
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
}

/**
 * Run this migration manually if needed
 * Usage: node -r ts-node/register api/shared/utils/subjectUnitsMigration.ts
 */
if (require.main === module) {
  const dbConfig = require('../../config/db');

  dbConfig.connectDB()
    .then(() => migrateSubjectUnits())
    .then(() => {
      console.log('Migration completed successfully');
      process.exit(0);
    })
    .catch((error: Error) => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}


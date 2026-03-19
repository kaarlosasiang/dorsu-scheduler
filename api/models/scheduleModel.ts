import mongoose, { Schema, Document, Model } from "mongoose";
import { ISchedule, ITimeSlot } from "../shared/interfaces/ISchedule.js";
import { formatTime12h } from "../shared/utils/timeUtils.js";

// Extend ISchedule with Mongoose Document
export interface IScheduleDocument extends Omit<ISchedule, '_id' | 'subject' | 'faculty' | 'classroom' | 'department' | 'section'>, Document {
  _id: mongoose.Types.ObjectId;
  subject: mongoose.Types.ObjectId;
  faculty: mongoose.Types.ObjectId;
  classroom: mongoose.Types.ObjectId;
  department: mongoose.Types.ObjectId;
  section?: mongoose.Types.ObjectId;
}

// Static methods interface
interface IScheduleModel extends Model<IScheduleDocument> {
  getStats(filter?: any): Promise<any>;
  findConflicts(scheduleData: Partial<ISchedule>): Promise<any[]>;
}

// TimeSlot sub-schema
const timeSlotSchema = new Schema<ITimeSlot>({
  day: {
    type: String,
    required: [true, 'Day is required'],
    enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
    lowercase: true
  },
  days: [{
    type: String,
    enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
    lowercase: true
  }], // Optional array for patterns like MW, TTh
  startTime: {
    type: String,
    required: [true, 'Start time is required'],
    match: [/^([01]\d|2[0-3]):([0-5]\d)$/, 'Start time must be in HH:mm format']
  },
  endTime: {
    type: String,
    required: [true, 'End time is required'],
    match: [/^([01]\d|2[0-3]):([0-5]\d)$/, 'End time must be in HH:mm format']
  }
}, { _id: false });

// Schedule schema
const scheduleSchema = new Schema<IScheduleDocument>({
  subject: {
    type: Schema.Types.ObjectId,
    ref: 'Subject',
    required: [true, 'Subject is required'],
    index: true
  },
  faculty: {
    type: Schema.Types.ObjectId,
    ref: 'Faculty',
    required: [true, 'Faculty is required'],
    index: true
  },
  classroom: {
    type: Schema.Types.ObjectId,
    ref: 'Classroom',
    required: [true, 'Classroom is required'],
    index: true
  },
  department: {
    type: Schema.Types.ObjectId,
    ref: 'Department',
    required: false,
    index: true
  },
  timeSlot: {
    type: timeSlotSchema,
    required: [true, 'Time slot is required']
  },
  scheduleType: {
    type: String,
    required: [true, 'Schedule type is required'],
    enum: ['lecture', 'laboratory'],
    default: 'lecture',
    index: true
  },
  semester: {
    type: String,
    required: [true, 'Semester is required'],
    trim: true,
    index: true
  },
  academicYear: {
    type: String,
    required: [true, 'Academic year is required'],
    trim: true,
    index: true
  },
  yearLevel: {
    type: String,
    trim: true,
    enum: ['1st Year', '2nd Year', '3rd Year', '4th Year', '5th Year', null],
    index: true
  },
  section: {
    type: Schema.Types.ObjectId,
    ref: 'Section',
    required: false,
    index: true,
  },
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'draft',
    index: true
  },
  isGenerated: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: function(doc, ret) {
      ret.id = ret._id.toString();
      delete (ret as any)._id;
      delete (ret as any).__v;
      // Format times as 12-hour for API responses; 24-hour stays in DB for calculations
      if (ret.timeSlot?.startTime) ret.timeSlot.startTime = formatTime12h(ret.timeSlot.startTime);
      if (ret.timeSlot?.endTime)   ret.timeSlot.endTime   = formatTime12h(ret.timeSlot.endTime);
      return ret;
    }
  },
  toObject: { virtuals: true }
});

// Compound indexes for efficient queries
scheduleSchema.index({ semester: 1, academicYear: 1 });
scheduleSchema.index({ faculty: 1, 'timeSlot.day': 1, 'timeSlot.startTime': 1 });
scheduleSchema.index({ classroom: 1, 'timeSlot.day': 1, 'timeSlot.startTime': 1 });
scheduleSchema.index({ department: 1, yearLevel: 1, section: 1 });

// Unique constraint: One section cannot be scheduled at the same time slot
scheduleSchema.index(
  {
    section: 1,
    'timeSlot.day': 1,
    'timeSlot.startTime': 1,
    semester: 1,
    academicYear: 1,
  },
  {
    unique: true,
    sparse: true,
    partialFilterExpression: { status: { $ne: 'archived' }, section: { $exists: true, $ne: null } },
  }
);

// Unique constraint: One classroom can only be used once at a time
scheduleSchema.index(
  {
    classroom: 1,
    'timeSlot.day': 1,
    'timeSlot.startTime': 1,
    semester: 1,
    academicYear: 1
  },
  {
    unique: true,
    partialFilterExpression: { status: { $ne: 'archived' } }
  }
);

// Virtual for display name
scheduleSchema.virtual('displayName').get(function() {
  return `${this.timeSlot.day} ${this.timeSlot.startTime}-${this.timeSlot.endTime}`;
});

// Pre-save validation
scheduleSchema.pre('save', async function(next) {
  // Validate time slot
  const start = this.timeSlot.startTime.split(':').map(Number);
  const end = this.timeSlot.endTime.split(':').map(Number);
  const startMinutes = start[0] * 60 + start[1];
  const endMinutes = end[0] * 60 + end[1];

  if (endMinutes <= startMinutes) {
    next(new Error('End time must be after start time'));
    return;
  }

  next();
});

// Static method to find conflicts
scheduleSchema.statics.findConflicts = async function(scheduleData: Partial<ISchedule>) {
  const conflicts: any[] = [];

  const { faculty, classroom, timeSlot, semester, academicYear, _id } = scheduleData;

  if (!timeSlot || !semester || !academicYear) {
    return conflicts;
  }

  const query: any = {
    'timeSlot.day': timeSlot.day,
    semester,
    academicYear,
    status: { $ne: 'archived' }
  };

  // Exclude current schedule if updating
  if (_id) {
    query._id = { $ne: _id };
  }

  // Check for time overlap
  const existingSchedules = await this.find(query)
    .populate('subject', 'subjectCode subjectName')
    .populate('faculty', 'name')
    .populate('classroom', 'roomNumber building');

  for (const existing of existingSchedules) {
    const hasTimeOverlap = checkTimeOverlap(
      timeSlot.startTime,
      timeSlot.endTime,
      existing.timeSlot.startTime,
      existing.timeSlot.endTime
    );

    if (!hasTimeOverlap) continue;

    // Faculty conflict
    if (faculty && existing.faculty._id.toString() === faculty.toString()) {
      conflicts.push({
        type: 'faculty',
        severity: 'error',
        message: `Faculty is already scheduled at this time`,
        schedule: existing,
        details: {
          faculty: existing.faculty,
          subject: existing.subject,
          time: `${existing.timeSlot.startTime}-${existing.timeSlot.endTime}`
        }
      });
    }

    // Classroom conflict
    if (classroom && existing.classroom._id.toString() === classroom.toString()) {
      conflicts.push({
        type: 'classroom',
        severity: 'error',
        message: `Classroom is already occupied at this time`,
        schedule: existing,
        details: {
          classroom: existing.classroom,
          subject: existing.subject,
          time: `${existing.timeSlot.startTime}-${existing.timeSlot.endTime}`
        }
      });
    }
  }

  return conflicts;
};

// Helper function to check time overlap
function checkTimeOverlap(start1: string, end1: string, start2: string, end2: string): boolean {
  const toMinutes = (time: string) => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  };

  const start1Min = toMinutes(start1);
  const end1Min = toMinutes(end1);
  const start2Min = toMinutes(start2);
  const end2Min = toMinutes(end2);

  return start1Min < end2Min && end1Min > start2Min;
}

// Static method to get statistics
scheduleSchema.statics.getStats = async function(filter: any = {}) {
  const matchStage = filter.semester || filter.academicYear || filter.status
    ? {
        ...(filter.semester && { semester: filter.semester }),
        ...(filter.academicYear && { academicYear: filter.academicYear }),
        ...(filter.status && { status: filter.status })
      }
    : {};

  const stats = await this.aggregate([
    ...(Object.keys(matchStage).length > 0 ? [{ $match: matchStage }] : []),
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        published: {
          $sum: { $cond: [{ $eq: ['$status', 'published'] }, 1, 0] }
        },
        draft: {
          $sum: { $cond: [{ $eq: ['$status', 'draft'] }, 1, 0] }
        },
        generated: {
          $sum: { $cond: ['$isGenerated', 1, 0] }
        },
        manual: {
          $sum: { $cond: [{ $not: '$isGenerated' }, 1, 0] }
        }
      }
    }
  ]);

  // Count by department
  const byDepartment = await this.aggregate([
    ...(Object.keys(matchStage).length > 0 ? [{ $match: matchStage }] : []),
    {
      $group: {
        _id: '$department',
        count: { $sum: 1 }
      }
    },
    {
      $lookup: {
        from: 'departments',
        localField: '_id',
        foreignField: '_id',
        as: 'department'
      }
    },
    {
      $unwind: '$department'
    },
    {
      $project: {
        name: '$department.name',
        code: '$department.code',
        count: 1
      }
    }
  ]);

  return {
    total: stats[0]?.total || 0,
    published: stats[0]?.published || 0,
    draft: stats[0]?.draft || 0,
    generated: stats[0]?.generated || 0,
    manual: stats[0]?.manual || 0,
    byDepartment
  };
};

export const Schedule = mongoose.model<IScheduleDocument, IScheduleModel>('Schedule', scheduleSchema);


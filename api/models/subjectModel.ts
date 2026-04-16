import mongoose, { Schema, Document, Model } from "mongoose";
import { ISubject } from "../shared/interfaces/ISubject.js";

// Extend ISubject with Mongoose Document
export interface ISubjectDocument extends Omit<ISubject, '_id' | 'courseOfferings' | 'department' | 'prerequisites' | 'hasLaboratory' | 'lectureHours' | 'labHours' | 'totalTeachingHours'>, Document {
  _id: mongoose.Types.ObjectId;
  courseOfferings: Array<{ course: mongoose.Types.ObjectId; yearLevel?: string }>;
  department?: mongoose.Types.ObjectId;
  prerequisites?: mongoose.Types.ObjectId[];
}

// Static methods interface
interface ISubjectModel extends Model<ISubjectDocument> {
  getStats(filter?: any): Promise<any>;
}

// Subject schema
const subjectSchema = new Schema<ISubjectDocument>({
  subjectCode: {
    type: String,
    required: [true, 'Subject code is required'],
    trim: true,
    uppercase: true,
    index: true
  },
  subjectName: {
    type: String,
    required: [true, 'Subject name is required'],
    trim: true,
    index: true
  },
  lectureUnits: {
    type: Number,
    required: [true, 'Lecture units are required'],
    min: [0, 'Lecture units must be at least 0'],
    max: [12, 'Lecture units cannot exceed 12'],
    default: 0
  },
  labUnits: {
    type: Number,
    required: [true, 'Lab units are required'],
    min: [0, 'Lab units must be at least 0'],
    max: [12, 'Lab units cannot exceed 12'],
    default: 0
  },
  units: {
    type: Number,
    required: false, // Computed field
    min: [0, 'Units must be at least 0'],
    max: [12, 'Units cannot exceed 12']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [1000, 'Subject description cannot exceed 1000 characters']
  },
  courseOfferings: {
    type: [{
      course: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
      yearLevel: {
        type: String,
        enum: ['1st Year', '2nd Year', '3rd Year', '4th Year', '5th Year', null],
        default: null
      }
    }],
    validate: {
      validator: (v: any[]) => Array.isArray(v) && v.length >= 1,
      message: 'At least one course offering is required',
    },
    index: true,
  },
  department: {
    type: Schema.Types.ObjectId,
    ref: 'Department',
    index: true
  },
  semester: {
    type: String,
    enum: ['1st Semester', '2nd Semester', 'Summer', null],
    trim: true,
    index: true
  },
  prerequisites: [{
    type: Schema.Types.ObjectId,
    ref: 'Subject'
  }]
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc, ret) {
      ret.id = ret._id.toString();
      delete (ret as any)._id;
      delete (ret as any).__v;
      return ret;
    }
  }
});

// Unique index: one subject per (subjectCode, semester) combination
subjectSchema.index({ subjectCode: 1, semester: 1 }, { unique: true });

// Virtual for display name
subjectSchema.virtual('displayName').get(function() {
  return `${this.subjectCode} - ${this.subjectName}`;
});

// Virtual for hasLaboratory (true if labUnits > 0)
subjectSchema.virtual('hasLaboratory').get(function() {
  return (this.labUnits || 0) > 0;
});

// Virtual for lectureHours (1:1 ratio)
subjectSchema.virtual('lectureHours').get(function() {
  return (this.lectureUnits || 0) * 1;
});

// Virtual for labHours (1:0.75 ratio, so 1 unit = 1.333... hours)
subjectSchema.virtual('labHours').get(function() {
  return (this.labUnits || 0) / 0.75;
});

// Virtual for totalTeachingHours
subjectSchema.virtual('totalTeachingHours').get(function() {
  const lectureHours = (this.lectureUnits || 0) * 1;
  const labHours = (this.labUnits || 0) / 0.75;
  return lectureHours + labHours;
});

// Pre-save middleware: compute units and normalize
subjectSchema.pre('save', async function(next) {
  // Normalize
  if (this.subjectCode && typeof this.subjectCode === 'string') {
    this.subjectCode = this.subjectCode.trim().toUpperCase();
  }
  if (this.subjectName && typeof this.subjectName === 'string') {
    this.subjectName = this.subjectName.trim();
  }

  // Compute total units from lectureUnits and labUnits
  const lectureUnits = this.lectureUnits || 0;
  const labUnits = this.labUnits || 0;
  this.units = lectureUnits + labUnits;

  // Validate that at least one type of units is specified
  if (lectureUnits === 0 && labUnits === 0) {
    next(new Error('Subject must have at least lecture units or lab units'));
    return;
  }

  // Ensure no duplicate (subjectCode, semester) — handled by unique index; pre-save check is redundant.
  // Duplicate course offerings within the same subject are prevented at the application layer (seed / service).

  next();
});

// Static method to get statistics
subjectSchema.statics.getStats = async function(filter: any = {}) {
  const matchStage: any = {};
  
  if (filter.courseId) matchStage['courseOfferings.course'] = mongoose.Types.ObjectId.createFromHexString(filter.courseId);
  if (filter.department) matchStage.department = mongoose.Types.ObjectId.createFromHexString(filter.department);
  if (filter.semester) matchStage.semester = filter.semester;

  const pipeline: any[] = [];
  
  if (Object.keys(matchStage).length > 0) {
    pipeline.push({ $match: matchStage });
  }

  pipeline.push({
    $group: {
      _id: null,
      total: { $sum: 1 },
      avgUnits: { $avg: '$units' },
      totalUnits: { $sum: '$units' },
      laboratoryCount: {
        $sum: { $cond: ['$isLaboratory', 1, 0] }
      }
    }
  });

  const stats = await this.aggregate(pipeline);
  
  return stats[0] || { 
    total: 0, 
    avgUnits: 0,
    totalUnits: 0,
    laboratoryCount: 0
  };
};

export const Subject = mongoose.model<ISubjectDocument, ISubjectModel>('Subject', subjectSchema);


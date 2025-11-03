import mongoose, { Schema, Document, Model } from "mongoose";
import { ISubject } from "../shared/interfaces/ISubject";

// Extend ISubject with Mongoose Document
export interface ISubjectDocument extends Omit<ISubject, '_id' | 'course' | 'department' | 'prerequisites'>, Document {
  _id: mongoose.Types.ObjectId;
  course: mongoose.Types.ObjectId;
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
  units: {
    type: Number,
    required: [true, 'Units are required'],
    min: [0, 'Units must be at least 0'],
    max: [12, 'Units cannot exceed 12']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [1000, 'Subject description cannot exceed 1000 characters']
  },
  course: {
    type: Schema.Types.ObjectId,
    ref: 'Course',
    required: [true, 'Course is required'],
    index: true
  },
  department: {
    type: Schema.Types.ObjectId,
    ref: 'Department',
    index: true
  },
  yearLevel: {
    type: String,
    enum: ['1st Year', '2nd Year', '3rd Year', '4th Year', '5th Year', null],
    trim: true,
    index: true
  },
  semester: {
    type: String,
    enum: ['1st Semester', '2nd Semester', 'Summer', null],
    trim: true,
    index: true
  },
  isLaboratory: {
    type: Boolean,
    default: false
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

// Compound index: ensure subjectCode is unique within a course
subjectSchema.index({ course: 1, subjectCode: 1 }, { unique: true });

// Virtual for display name
subjectSchema.virtual('displayName').get(function() {
  return `${this.subjectCode} - ${this.subjectName}`;
});

// Pre-save middleware: normalize code and name
subjectSchema.pre('save', async function(next) {
  // Normalize
  if (this.subjectCode && typeof this.subjectCode === 'string') {
    this.subjectCode = this.subjectCode.trim().toUpperCase();
  }
  if (this.subjectName && typeof this.subjectName === 'string') {
    this.subjectName = this.subjectName.trim();
  }

  // Ensure no duplicate subjectCode within the same course
  try {
    if (this.isModified('subjectCode') || this.isModified('course')) {
      const query: any = { 
        subjectCode: this.subjectCode,
        course: this.course
      };
      
      // Exclude self when updating
      if (this._id) {
        query._id = { $ne: this._id };
      }

      const existing = await mongoose.model('Subject').findOne(query).exec();
      if (existing) {
        next(new Error('Subject with this code already exists in the specified course'));
        return;
      }
    }
  } catch (err) {
    return next(err as Error);
  }

  next();
});

// Static method to get statistics
subjectSchema.statics.getStats = async function(filter: any = {}) {
  const matchStage: any = {};
  
  if (filter.course) matchStage.course = mongoose.Types.ObjectId.createFromHexString(filter.course);
  if (filter.department) matchStage.department = mongoose.Types.ObjectId.createFromHexString(filter.department);
  if (filter.yearLevel) matchStage.yearLevel = filter.yearLevel;
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


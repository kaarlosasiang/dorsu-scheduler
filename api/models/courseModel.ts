import mongoose, { Schema, Document, Model } from "mongoose";
import { ICourse } from "../shared/interfaces/ICourse.js";

// Extend ICourse with Mongoose Document
export interface ICourseDocument extends Omit<ICourse, '_id' | 'department'>, Document {
  _id: mongoose.Types.ObjectId;
  department?: mongoose.Types.ObjectId;
}

// Static methods interface
interface ICourseModel extends Model<ICourseDocument> {
  getStats(): Promise<any>;
}

// Course schema
const courseSchema = new Schema<ICourseDocument>({
  courseCode: {
    type: String,
    required: [true, 'Course code is required'],
    trim: true,
    uppercase: true
  },
  courseName: {
    type: String,
    required: [true, 'Course name is required'],
    trim: true
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
    maxlength: [500, 'Course description cannot exceed 500 characters']
  },
  department: {
    type: Schema.Types.ObjectId,
    ref: 'Department',
    required: false
  }
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

// Compound index: ensure courseCode is unique within a department when department is provided
courseSchema.index({ department: 1, courseCode: 1 }, { unique: true, sparse: true });
courseSchema.index({ courseCode: 1 });

// Virtual for display name
courseSchema.virtual('displayName').get(function() {
  return `${this.courseCode} - ${this.courseName}`;
});

// Pre-save middleware: normalize code and name and ensure uniqueness when necessary
courseSchema.pre('save', async function(next) {
  // normalize
  if (this.courseCode && typeof this.courseCode === 'string') {
    this.courseCode = this.courseCode.trim().toUpperCase();
  }
  if (this.courseName && typeof this.courseName === 'string') {
    this.courseName = this.courseName.trim();
  }

  // If department is provided, ensure no other course in same department has same code
  try {
    if (this.isModified('courseCode') || this.isModified('department')) {
      const query: any = { courseCode: this.courseCode };
      if (this.department) {
        query.department = this.department;
      }
      // exclude self when updating
      if (this._id) {
        query._id = { $ne: this._id };
      }

      const existing = await mongoose.model('Course').findOne(query).exec();
      if (existing) {
        next(new Error('Course with this code already exists in the specified department'));
        return;
      }
    }
  } catch (err) {
    return next(err as Error);
  }

  next();
});

// Static method to get simple statistics about courses
courseSchema.statics.getStats = async function() {
  const stats = await this.aggregate([
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        avgUnits: { $avg: '$units' }
      }
    }
  ]);

  return stats[0] || { total: 0, avgUnits: 0 };
};

export const Course = mongoose.model<ICourseDocument, ICourseModel>('Course', courseSchema);

import mongoose, { Schema, Document } from "mongoose";
import { IFaculty, IName } from "../shared/interfaces/IFaculty.js";

// Extend IFaculty with Mongoose Document
export interface IFacultyDocument extends Omit<IFaculty, '_id'>, Document {
  _id: mongoose.Types.ObjectId;
}

// Name sub-schema
const nameSchema = new Schema<IName>({
  first: {
    type: String,
    required: [true, 'First name is required'],
    trim: true,
    minlength: [2, 'First name must be at least 2 characters long'],
    maxlength: [50, 'First name cannot exceed 50 characters']
  },
  middle: {
    type: String,
    trim: true,
    maxlength: [50, 'Middle name cannot exceed 50 characters']
  },
  last: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true,
    minlength: [2, 'Last name must be at least 2 characters long'],
    maxlength: [50, 'Last name cannot exceed 50 characters']
  },
  ext: {
    type: String,
    trim: true,
    maxlength: [10, 'Extension cannot exceed 10 characters']
  }
}, { _id: false });

// Faculty schema
const facultySchema = new Schema<IFacultyDocument>({
  name: {
    type: nameSchema,
    required: [true, 'Faculty name is required']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email address']
  },
  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    required: [true, 'Department is required'],
    index: true
  } as any,
  employmentType: {
    type: String,
    required: [true, 'Employment type is required'],
    enum: ['full-time', 'part-time'],
    default: 'full-time'
  },
  image: {
    type: String,
    trim: true
  },
  minLoad: {
    type: Number,
    default: 18,
    min: [18, 'Minimum load must be at least 18 units'],
    max: [26, 'Minimum load cannot exceed 26 units']
  },
  maxLoad: {
    type: Number,
    default: 26,
    min: [18, 'Max load must be at least 18 units'],
    max: [26, 'Max load cannot exceed 26 units']
  },
  currentLoad: {
    type: Number,
    default: 0,
    min: [0, 'Current load cannot be negative']
  },
  maxPreparations: {
    type: Number,
    default: 4,
    min: [1, 'Max preparations must be at least 1'],
    max: [4, 'Max preparations cannot exceed 4']
  },
  currentPreparations: {
    type: Number,
    default: 0,
    min: [0, 'Current preparations cannot be negative']
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc: any, ret: any) {
      ret.id = ret._id.toString();
      delete ret._id;
      delete ret.__v;
      return ret;
    }
  }
});

// Indexes for efficient lookups
facultySchema.index({ department: 1 });
facultySchema.index({ status: 1 });
facultySchema.index({ employmentType: 1 });
facultySchema.index({ email: 1 });
facultySchema.index({ department: 1, status: 1 });
facultySchema.index({ 'name.last': 1, 'name.first': 1 });

// Virtual for available load
facultySchema.virtual('availableLoad').get(function(this: IFacultyDocument) {
  return (this.maxLoad || 26) - (this.currentLoad || 0);
});

// Virtual for available preparations
facultySchema.virtual('availablePreparations').get(function(this: IFacultyDocument) {
  return (this.maxPreparations || 4) - (this.currentPreparations || 0);
});

// Virtual for full name
facultySchema.virtual('fullName').get(function(this: IFacultyDocument) {
  const parts = [this.name.first];
  if (this.name.middle) parts.push(this.name.middle);
  parts.push(this.name.last);
  if (this.name.ext) parts.push(this.name.ext);
  return parts.join(' ');
});

// Virtual for availability (all faculty available 8am - 5pm)
facultySchema.virtual('availability').get(function() {
  return {
    startTime: '08:00',
    endTime: '17:00',
    workDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
  };
});

// Method to check if faculty is available at specific time
facultySchema.methods.isAvailableAt = function(time: string, day: string): boolean {
  const workDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  if (!workDays.includes(day)) return false;
  
  const timeNum = parseInt(time.replace(':', ''));
  return timeNum >= 800 && timeNum <= 1700;
};

// Pre-save middleware to validate loads and preparations
facultySchema.pre('save', function(this: IFacultyDocument, next) {
  // Validate current load doesn't exceed max load
  if ((this.currentLoad || 0) > (this.maxLoad || 26)) {
    next(new Error('Current load cannot exceed maximum load'));
    return;
  }
  
  // Validate min load is not greater than max load
  if ((this.minLoad || 18) > (this.maxLoad || 26)) {
    next(new Error('Minimum load cannot exceed maximum load'));
    return;
  }
  
  // Validate current preparations don't exceed max preparations
  if ((this.currentPreparations || 0) > (this.maxPreparations || 4)) {
    next(new Error('Current preparations cannot exceed maximum preparations'));
    return;
  }
  
  next();
});

export const Faculty = mongoose.model<IFacultyDocument>('Faculty', facultySchema);

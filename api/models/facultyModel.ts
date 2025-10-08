import mongoose, { Schema, Document } from "mongoose";
import { IFaculty, IAvailability } from "../shared/interfaces/IFaculty.js";

// Extend IFaculty with Mongoose Document
export interface IFacultyDocument extends Omit<IFaculty, '_id'>, Document {
  _id: mongoose.Types.ObjectId;
}

// Availability sub-schema
const availabilitySchema = new Schema<IAvailability>({
  day: {
    type: String,
    required: true,
    enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
  },
  startTime: {
    type: String,
    required: true,
    match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
  },
  endTime: {
    type: String,
    required: true,
    match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
  }
}, { _id: false });

// Faculty schema
const facultySchema = new Schema<IFacultyDocument>({
  name: {
    type: String,
    required: [true, 'Faculty name is required'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters long'],
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  department: {
    type: String,
    required: [true, 'Department is required'],
    trim: true,
    minlength: [2, 'Department must be at least 2 characters long'],
    maxlength: [50, 'Department cannot exceed 50 characters']
  },
  availability: {
    type: [availabilitySchema],
    default: []
  },
  maxLoad: {
    type: Number,
    default: 18,
    min: [1, 'Max load must be at least 1 hour'],
    max: [40, 'Max load cannot exceed 40 hours']
  },
  currentLoad: {
    type: Number,
    default: 0,
    min: [0, 'Current load cannot be negative']
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
    transform: function(doc, ret) {
      ret.id = ret._id.toString();
      delete (ret as any)._id;
      delete (ret as any).__v;
      return ret;
    }
  }
});

// Indexes for efficient lookups
facultySchema.index({ department: 1 });
facultySchema.index({ status: 1 });
facultySchema.index({ department: 1, status: 1 });

// Virtual for available load
facultySchema.virtual('availableLoad').get(function() {
  return (this.maxLoad || 18) - (this.currentLoad || 0);
});

// Pre-save middleware to validate availability
facultySchema.pre('save', function(next) {
  if ((this.currentLoad || 0) > (this.maxLoad || 18)) {
    next(new Error('Current load cannot exceed maximum load'));
  }
  next();
});

export const Faculty = mongoose.model<IFacultyDocument>('Faculty', facultySchema);

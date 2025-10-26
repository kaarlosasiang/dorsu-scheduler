import mongoose, { Schema, Document, Model } from "mongoose";
import { IDepartment } from "../shared/interfaces/IDepartment.js";

// Extend IDepartment with Mongoose Document
export interface IDepartmentDocument extends Omit<IDepartment, '_id'>, Document {
  _id: mongoose.Types.ObjectId;
}

// Static methods interface
interface IDepartmentModel extends Model<IDepartmentDocument> {
  getStats(): Promise<any>;
}

// Department schema
const departmentSchema = new Schema<IDepartmentDocument>({
  name: {
    type: String,
    required: [true, 'Department name is required'],
    unique: true,
    trim: true,
    minlength: [2, 'Department name must be at least 2 characters long'],
    maxlength: [100, 'Department name cannot exceed 100 characters'],
    index: true
  },
  code: {
    type: String,
    required: [true, 'Department code is required'],
    unique: true,
    trim: true,
    uppercase: true,
    minlength: [2, 'Department code must be at least 2 characters long'],
    maxlength: [10, 'Department code cannot exceed 10 characters'],
    match: [/^[A-Z0-9]+$/, 'Department code must contain only uppercase letters and numbers'],
    index: true
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
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
departmentSchema.index({ name: 1 });
departmentSchema.index({ code: 1 });

// Virtual for faculty count (to be populated when needed)
departmentSchema.virtual('facultyCount', {
  ref: 'Faculty',
  localField: '_id',
  foreignField: 'department',
  count: true
});

// Virtual for full display name (code + name)
departmentSchema.virtual('displayName').get(function() {
  return `${this.code} - ${this.name}`;
});

// Pre-save middleware to ensure unique department code and name
departmentSchema.pre('save', async function(next) {
  if (this.isModified('name')) {
    const existingByName = await mongoose.model('Department').findOne({
      name: new RegExp(`^${this.name}$`, 'i'),
      _id: { $ne: this._id }
    });
    if (existingByName) {
      next(new Error('Department with this name already exists'));
      return;
    }
  }
  
  if (this.isModified('code')) {
    const existingByCode = await mongoose.model('Department').findOne({
      code: this.code.toUpperCase(),
      _id: { $ne: this._id }
    });
    if (existingByCode) {
      next(new Error('Department with this code already exists'));
      return;
    }
  }
  
  next();
});

// Static method to get department statistics
departmentSchema.statics.getStats = async function() {
  const stats = await this.aggregate([
    {
      $group: {
        _id: null,
        total: { $sum: 1 }
      }
    }
  ]);

  const result = stats[0] || { total: 0 };
  return result;
};

export const Department = mongoose.model<IDepartmentDocument, IDepartmentModel>('Department', departmentSchema);
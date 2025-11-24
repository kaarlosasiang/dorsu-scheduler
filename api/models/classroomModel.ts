import mongoose, { Schema, Document, Model } from "mongoose";
import { IClassroom } from "../shared/interfaces/IClassroom.js";

// Extend IClassroom with Mongoose Document
export interface IClassroomDocument extends Omit<IClassroom, '_id'>, Document {
  _id: mongoose.Types.ObjectId;
}

// Static methods interface
interface IClassroomModel extends Model<IClassroomDocument> {
  getStats(): Promise<any>;
}

// Classroom schema
const classroomSchema = new Schema<IClassroomDocument>({
  roomNumber: {
    type: String,
    required: [true, 'Room number is required'],
    trim: true,
    index: true
  },
  building: {
    type: String,
    trim: true,
    maxlength: [100, 'Building name cannot exceed 100 characters']
  },
  capacity: {
    type: Number,
    required: [true, 'Capacity is required'],
    min: [1, 'Capacity must be at least 1'],
    max: [500, 'Capacity cannot exceed 500']
  },
  type: {
    type: String,
    enum: ['lecture', 'laboratory', 'computer-lab', 'conference', 'other'],
    default: 'lecture'
  },
  facilities: {
    type: [String],
    default: []
  },
  status: {
    type: String,
    enum: ['available', 'maintenance', 'reserved'],
    default: 'available',
    index: true
  }
}, {
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: function(doc, ret) {
      ret.id = ret._id.toString();
      delete (ret as any)._id;
      delete (ret as any).__v;
      return ret;
    }
  },
  toObject: { virtuals: true }
});

// Compound index for unique room numbers within buildings
classroomSchema.index({ roomNumber: 1, building: 1 }, { unique: true });

// Virtual for display name
classroomSchema.virtual('displayName').get(function() {
  return this.building
    ? `${this.building} - ${this.roomNumber}`
    : this.roomNumber;
});

// Pre-save middleware to ensure unique room number within building
classroomSchema.pre('save', async function(next) {
  if (this.isModified('roomNumber') || this.isModified('building')) {
    const query: any = { roomNumber: this.roomNumber };

    // If building is specified, check within that building
    if (this.building) {
      query.building = this.building;
    } else {
      // If no building, check for rooms with no building
      query.building = { $exists: false };
    }

    // Exclude current document when updating
    if (this._id) {
      query._id = { $ne: this._id };
    }

    const existing = await mongoose.model('Classroom').findOne(query).exec();
    if (existing) {
      const location = this.building ? `building ${this.building}` : 'without a building';
      next(new Error(`Room ${this.roomNumber} already exists in ${location}`));
      return;
    }
  }

  next();
});

// Static method to get classroom statistics
classroomSchema.statics.getStats = async function() {
  const stats = await this.aggregate([
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        totalCapacity: { $sum: '$capacity' },
        averageCapacity: { $avg: '$capacity' },
        byType: {
          $push: {
            type: '$type',
            count: 1
          }
        },
        byStatus: {
          $push: {
            status: '$status',
            count: 1
          }
        }
      }
    }
  ]);

  // Count by type
  const typeStats = await this.aggregate([
    {
      $group: {
        _id: '$type',
        count: { $sum: 1 }
      }
    }
  ]);

  // Count by status
  const statusStats = await this.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);

  const result = stats[0] || {
    total: 0,
    totalCapacity: 0,
    averageCapacity: 0
  };

  return {
    total: result.total,
    totalCapacity: result.totalCapacity,
    averageCapacity: Math.round(result.averageCapacity || 0),
    byType: typeStats.reduce((acc: any, item: any) => {
      acc[item._id] = item.count;
      return acc;
    }, {}),
    byStatus: statusStats.reduce((acc: any, item: any) => {
      acc[item._id] = item.count;
      return acc;
    }, {})
  };
};

export const Classroom = mongoose.model<IClassroomDocument, IClassroomModel>('Classroom', classroomSchema);


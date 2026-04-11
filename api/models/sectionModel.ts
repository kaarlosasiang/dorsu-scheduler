import mongoose, { Schema, Document, Model } from "mongoose";
import { ISection } from "../shared/interfaces/ISection.js";

export interface ISectionDocument extends Omit<ISection, '_id' | 'program'>, Document {
  _id: mongoose.Types.ObjectId;
  program: mongoose.Types.ObjectId;
}

interface ISectionModel extends Model<ISectionDocument> {}

const sectionSchema = new Schema<ISectionDocument>(
  {
    program: {
      type: Schema.Types.ObjectId,
      ref: 'Course',
      required: [true, 'Program is required'],
      index: true,
    },
    yearLevel: {
      type: String,
      required: [true, 'Year level is required'],
      enum: ['1st Year', '2nd Year', '3rd Year', '4th Year', '5th Year'],
      index: true,
    },
    sectionCode: {
      type: String,
      required: [true, 'Section code is required'],
      trim: true,
      uppercase: true,
    },
    name: {
      type: String,
      trim: true,
      uppercase: true,
    },
    capacity: {
      type: Number,
      min: [1, 'Capacity must be at least 1'],
      max: [500, 'Capacity cannot exceed 500'],
    },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
      index: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: function (doc, ret) {
        ret.id = ret._id.toString();
        delete (ret as any)._id;
        delete (ret as any).__v;
        return ret;
      },
    },
    toObject: { virtuals: true },
  }
);

// Unique: no duplicate section codes for the same program + yearLevel
sectionSchema.index(
  { program: 1, yearLevel: 1, sectionCode: 1 },
  { unique: true }
);

// Pre-save: use sectionCode as the display name
sectionSchema.pre('save', function (next) {
  if (this.isModified('sectionCode') || !this.name) {
    this.name = this.sectionCode.toUpperCase();
  }
  next();
});

export const Section = mongoose.model<ISectionDocument, ISectionModel>('Section', sectionSchema);

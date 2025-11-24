import mongoose, { Schema } from "mongoose";
import bcrypt from "bcryptjs";
import { IUser } from "../shared/interfaces/IUser.js";
import { PASSWORD_CONFIG, USER_ROLES } from "../config/constants.js";

const userSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      trim: true,
      lowercase: true,
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        "Please provide a valid email address"
      ],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [
        PASSWORD_CONFIG.MIN_LENGTH,
        `Password must be at least ${PASSWORD_CONFIG.MIN_LENGTH} characters long`,
      ],
    },
    role: {
      type: String,
      enum: [USER_ROLES.ADMIN, USER_ROLES.FACULTY, USER_ROLES.STAFF],
      default: USER_ROLES.ADMIN,
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: function (doc: any, ret: any) {
        delete ret.password;
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Index for better query performance
userSchema.index({ role: 1 });
userSchema.index({ email: 1 });

// Hash password before saving
userSchema.pre("save", async function (next: any) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified("password")) return next();

  try {
    // Hash password with cost from config
    this.password = await bcrypt.hash(
      this.password,
      PASSWORD_CONFIG.SALT_ROUNDS
    );
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Instance method to compare password
userSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw new Error("Password comparison failed");
  }
};

// Static method to find by email
userSchema.statics.findByEmail = function (email: string) {
  return this.findOne({ email: email.toLowerCase() });
};

export const User = mongoose.model<IUser>("User", userSchema);
export default User;

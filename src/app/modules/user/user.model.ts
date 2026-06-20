import { model, Schema } from "mongoose";
import { IsActive, IUser, Role } from "./user.interface";

const userSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    phone: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },

    password: {
      type: String,
      select: false,
    },

    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },
    
    agentLeader: {
      type: Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },

    role: {
      type: String,
      enum: Object.values(Role),
      default: Role.CUSTOMER,
      index: true,
    },

    picture: {
      type: String,
      default: "",
    },

    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },

    isActive: {
      type: String,
      enum: Object.values(IsActive),
      default: IsActive.ACTIVE,
      index: true,
    },

    isVerified: {
      type: Boolean,
      default: false,
      index: true,
    },

    lastLoginAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

export const User = model<IUser>("User", userSchema);

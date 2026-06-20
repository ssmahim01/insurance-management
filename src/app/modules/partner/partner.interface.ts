import { Types } from "mongoose";

export interface IPartner {
  _id?: Types.ObjectId;

  name: string;

  logo?: string;

  description?: string;

  phone?: string;

  email?: string;

  website?: string;

  isActive: boolean;

  isDeleted: boolean;

  createdBy?: Types.ObjectId;

  createdAt?: Date;
  updatedAt?: Date;
}
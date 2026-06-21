import { Types } from "mongoose";

export interface IMessage {
  _id?: Types.ObjectId;

  message: string;
  phone: string;

  isDeleted: boolean;

  createdAt?: Date;
  updatedAt?: Date;
}
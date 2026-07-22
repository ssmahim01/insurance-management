// import { Types } from "mongoose";

// export enum ConsultationStatus {
//   INITIATED = "INITIATED",
//   ELIGIBLE = "ELIGIBLE",
//   BOOKED = "BOOKED",
//   PAID = "PAID",
//   RINGING = "RINGING",
//   ACCEPTED = "ACCEPTED",
//   REJECTED = "REJECTED",
//   TIMEOUT = "TIMEOUT",
//   COMPLETED = "COMPLETED",
//   CANCELLED = "CANCELLED",
//   POOL_EXHAUSTED = "POOL_EXHAUSTED",
//   FAILED = "FAILED",
// }

// export interface IConsultation {
//   customer: Types.ObjectId;
//   subscription: Types.ObjectId;
//   zaynaxBookingId?: string;
//   zaynaxOrderType?: string;
//   roomId?: string;
//   doctorId?: string;
//   doctorName?: string;
//   status: ConsultationStatus;
//   failureReason?: string;
//   isDeleted: boolean;
// }

// v2

// import { Types } from "mongoose";

// export enum ConsultationStatus {
//   INITIATED = "INITIATED",
//   ELIGIBLE = "ELIGIBLE",
//   BOOKED = "BOOKED",
//   PAID = "PAID",
//   RINGING = "RINGING",
//   ACCEPTED = "ACCEPTED",
//   REJECTED = "REJECTED",
//   TIMEOUT = "TIMEOUT",
//   COMPLETED = "COMPLETED",
//   CANCELLED = "CANCELLED",
//   POOL_EXHAUSTED = "POOL_EXHAUSTED",
//   FAILED = "FAILED",
// }

// export interface IConsultation {
//   customer: Types.ObjectId;
//   subscription: Types.ObjectId;
//   zaynaxBookingId?: string;
//   zaynaxOrderType?: string;
//   roomId?: string;
//   doctorId?: string;
//   doctorName?: string;
//   status: ConsultationStatus;
//   failureReason?: string;
//   // Set when the frontend reports ACCEPTED / COMPLETED respectively.
//   callStartedAt?: Date;
//   callEndedAt?: Date;
//   // Populated whenever a prescription becomes available for this consultation.
//   prescriptionUrl?: string;
//   isDeleted: boolean;
// }


// v3

import { Types } from "mongoose";

export enum ConsultationStatus {
  INITIATED = "INITIATED",
  ELIGIBLE = "ELIGIBLE",
  BOOKED = "BOOKED",
  PAID = "PAID",
  RINGING = "RINGING",
  ACCEPTED = "ACCEPTED",
  REJECTED = "REJECTED",
  TIMEOUT = "TIMEOUT",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
  POOL_EXHAUSTED = "POOL_EXHAUSTED",
  FAILED = "FAILED",
}

export interface IConsultation {
  customer: Types.ObjectId;
  subscription: Types.ObjectId;
  zaynaxBookingId?: string;
  zaynaxOrderType?: string;
  // Stored so we can re-fetch booking details (e.g. for the prescription)
  // after the call ends, without re-authenticating with Zaynax.
  // select: false — never returned unless explicitly requested.
  zaynaxToken?: string;
  roomId?: string;
  doctorId?: string;
  doctorName?: string;
  status: ConsultationStatus;
  failureReason?: string;
  callStartedAt?: Date;
  callEndedAt?: Date;
  prescriptionUrl?: string;
  isDeleted: boolean;
}



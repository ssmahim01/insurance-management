
// import httpStatus from "http-status-codes";
// import AppError from "../../errorHelpers/appError";
// import { ConsultationStatus } from "./consultation.interface";
// import { consultationSearchableFields } from "./consultation.constants";
// import { QueryBuilder } from "../../utils/QueryBuilder";
// import { User } from "../user/user.model";
// import { Subscription } from "../subscription/subscription.model";
// import { Consultation } from "./consultation.model";
// import { SubscriptionStatus } from "../subscription/subscription.interface";
// import { ZaynaxApi } from "../zaynax/zaynax.service";

// /** 
//  * Polls Zaynax until a doctor is assigned to the booking, or times out.
//  * Per Zaynax's docs, doctor assignment happens asynchronously via a queue —
//  * booking details won't have doctorID/doctorInfo populated immediately.
//  */
// const waitForDoctorAssignment = async (
//   token: string,
//   bookingId: string,
//   maxAttempts = 10,
//   delayMs = 3000,
// ): Promise<{
//   id: string;
//   doctorID: string;
//   patientID: string;
//   doctorInfo: {
//     firstName: { en: string; bn: string };
//     lastName: { en: string; bn: string };
//     image: string;
//   };
// }> => {
//   for (let attempt = 1; attempt <= maxAttempts; attempt++) {
//     const details = await ZaynaxApi.getBookingDetails(token, bookingId);

//     if (details.doctorID && details.doctorInfo) {
//       return details as any;
//     }

//     if (attempt < maxAttempts) {
//       await new Promise((resolve) => setTimeout(resolve, delayMs));
//     }
//   }

//   throw new Error("Doctor assignment timed out — please try again shortly");
// };

// const genderMap = {
//   MALE: "Male",
//   FEMALE: "Female",
//   OTHER: "Other",
// } as const;

// const initiateConsultation = async (userId: string) => {
//   const customer = await User.findById(userId);

//   if (!customer) {
//     throw new AppError(httpStatus.NOT_FOUND, "Customer not found");
//   }

//   // Any active subscription works as the reference — this module doesn't
//   // gate on a per-package consultation limit right now, it only records usage.
//   const subscription = await Subscription.findOne({
//     customer: userId,
//     isDeleted: false,
//     status: SubscriptionStatus.ACTIVE,
//   });

//   if (!subscription) {
//     throw new AppError(
//       httpStatus.BAD_REQUEST,
//       "No active subscription found for this customer",
//     );
//   }

//   const consultation = await Consultation.create({
//     customer: userId,
//     subscription: subscription._id,
//     status: ConsultationStatus.INITIATED,
//   });

//   try {
//     // Activate/refresh this patient's Zaynax record under the shared corporate account.
//     const clientSideAppointmentId = String(consultation._id);

//     const subscribeRes = await ZaynaxApi.subscribeCorporatePackage(
//       clientSideAppointmentId,
//       process.env.SUROKKHA_LOGO_URL as string,
//       [
//         {
//           firstName: customer.name?.split(" ")[0] ?? customer.name,
//           lastName: customer.name?.split(" ").slice(1).join(" ") || "-",
//           gender: genderMap[customer.gender as keyof typeof genderMap] ?? "Other",
//           mobileNumber: customer.phone,
//         },
//       ],
//     );

//     if (!subscribeRes.success) {
//       consultation.status = ConsultationStatus.FAILED;
//       consultation.failureReason = "Zaynax subscribe call failed";
//       await consultation.save();

//       throw new AppError(
//         httpStatus.BAD_GATEWAY,
//         "Doctor service unavailable, please try again shortly",
//       );
//     }

//     const patientToken = (
//       await ZaynaxApi.getUserToken(
//         ZaynaxApi.extractTokenFromUrl(subscribeRes.data.URL),
//       )
//     ).data.token;

//     // Shared corporate pool balance safety check.
//     const hasPoolBalance = await ZaynaxApi.checkPackageForCall(patientToken);

//     if (!hasPoolBalance) {
//       consultation.status = ConsultationStatus.POOL_EXHAUSTED;
//       consultation.failureReason = "Zaynax corporate package balance is empty";
//       await consultation.save();

//       throw new AppError(
//         httpStatus.SERVICE_UNAVAILABLE,
//         "Doctor consultation service is temporarily unavailable",
//       );
//     }

//     consultation.status = ConsultationStatus.ELIGIBLE;
//     await consultation.save();

//     // Book the appointment.
//     const booking = await ZaynaxApi.bookQuickAppointment(
//       patientToken,
//       customer.name,
//       clientSideAppointmentId,
//     );

//     consultation.zaynaxBookingId = booking.id;
//     consultation.zaynaxOrderType = booking.orderType; // captured from booking response, not hardcoded
//     consultation.status = ConsultationStatus.BOOKED;
//     await consultation.save();

//     // Pay from the shared package balance — this is the point of truth for
//     // usage count, since Zaynax's own pool balance is deducted here
//     // regardless of whether the doctor later accepts or rejects the call.
//     const paid = await ZaynaxApi.payByPackage(patientToken, booking.id, booking.orderType);

//     if (!paid) {
//       consultation.status = ConsultationStatus.FAILED;
//       consultation.failureReason = "Zaynax payment/by-package returned false";
//       await consultation.save();
//       throw new AppError(httpStatus.BAD_GATEWAY, "Could not start consultation, please retry");
//     }

//     consultation.status = ConsultationStatus.PAID;
//     await consultation.save();

//     // Get booking/doctor details — Zaynax assigns doctors asynchronously via
//     // a queue, so poll until doctorID/doctorInfo show up (or time out).
//     // const details = await waitForDoctorAssignment(patientToken, booking.id);
//     const details = await waitForDoctorAssignment(patientToken, booking.id, 20, 5000);

//     consultation.doctorId = details.doctorID;
//     consultation.doctorName = `${details.doctorInfo.firstName.en} ${details.doctorInfo.lastName.en}`;
//     // consultation.roomId = `${booking.id}${userId}`; // roomID = bookingID + patientUserID, per Zaynax docs
//     consultation.roomId = `${booking.id}${details.patientID}`;
//     await consultation.save();

//     return {
//       consultationId: consultation._id,
//       roomId: consultation.roomId,
//       orderID: booking.id,
//       doctorInfo: details.doctorInfo,
//       zaynaxAuthToken: patientToken, // frontend uses this to open the socket connection directly
//     };
//   } catch (error) {
//     if (consultation.status === ConsultationStatus.INITIATED) {
//       consultation.status = ConsultationStatus.FAILED;
//       consultation.failureReason =
//         error instanceof Error ? error.message : "Unknown error";
//       await consultation.save();
//     }

//     throw error;
//   }
// };


// /**
//  * Frontend calls this as the socket lifecycle progresses
//  * (RINGING / ACCEPTED / REJECTED / TIMEOUT / COMPLETED / CANCELLED).
//  * Doesn't affect any counter — usage is already counted at PAID.
//  */
// const updateConsultationStatus = async (
//   id: string,
//   status: ConsultationStatus,
// ) => {
//   const consultation = await Consultation.findById(id);

//   if (!consultation) {
//     throw new AppError(httpStatus.NOT_FOUND, "Consultation not found");
//   }

//   consultation.status = status;
//   await consultation.save();

//   return consultation;
// };

// const getMyConsultations = async ({
//   query,
//   userId,
// }: {
//   query: Record<string, string>;
//   userId: string;
// }) => {
//   const baseQuery = Consultation.find({ customer: userId, isDeleted: false });

//   const queryBuilder = new QueryBuilder(baseQuery, query);

//   const data = await queryBuilder
//     .filter()
//     .search(consultationSearchableFields)
//     .sort()
//     .fields()
//     .paginate()
//     .build()
//     .populate("subscription", "package status");

//   const meta = await queryBuilder.getMeta();

//   return { data, meta };
// };

// /** Simple usage count — no limit is enforced against this yet, it's tracked for future use. */
// const getMyConsultationCount = async (userId: string) => {
//   const count = await Consultation.countDocuments({
//     customer: userId,
//     isDeleted: false,
//     status: {
//       $in: [
//         ConsultationStatus.PAID,
//         ConsultationStatus.RINGING,
//         ConsultationStatus.ACCEPTED,
//         ConsultationStatus.COMPLETED,
//       ],
//     },
//   });

//   return { count };
// };

// const getSingleConsultation = async (id: string) => {
//   const consultation = await Consultation.findById(id).populate(
//     "subscription",
//     "package status",
//   );

//   if (!consultation) {
//     throw new AppError(httpStatus.NOT_FOUND, "Consultation not found");
//   }

//   return consultation;
// };

// export const ConsultationServices = {
//   initiateConsultation,
//   updateConsultationStatus,
//   getMyConsultations,
//   getMyConsultationCount,
//   getSingleConsultation,
// };


// v2

// import httpStatus from "http-status-codes";
// import AppError from "../../errorHelpers/appError";
// import { ConsultationStatus } from "./consultation.interface";
// import { consultationSearchableFields } from "./consultation.constants";
// import { QueryBuilder } from "../../utils/QueryBuilder";
// import { User } from "../user/user.model";
// import { Subscription } from "../subscription/subscription.model";
// import { SubscriptionStatus } from "../subscription/subscription.interface";
// import { ZaynaxApi } from "../zaynax/zaynax.service";
// import { Consultation } from "./consultation.model";
// import { v2 } from "cloudinary";

// /** 
//  * Polls Zaynax until a doctor is assigned to the booking, or times out.
//  * Per Zaynax's docs, doctor assignment happens asynchronously via a queue —
//  * booking details won't have doctorID/doctorInfo populated immediately.
//  */
// const waitForDoctorAssignment = async (
//   token: string,
//   bookingId: string,
//   maxAttempts = 10,
//   delayMs = 3000,
// ): Promise<{
//   id: string;
//   doctorID: string;
//   patientID: string;
//   doctorInfo: {
//     firstName: { en: string; bn: string };
//     lastName: { en: string; bn: string };
//     image: string;
//   };
// }> => {
//   for (let attempt = 1; attempt <= maxAttempts; attempt++) {
//     const details = await ZaynaxApi.getBookingDetails(token, bookingId);

//     if (details.doctorID && details.doctorInfo) {
//       return details as any;
//     }

//     if (attempt < maxAttempts) {
//       await new Promise((resolve) => setTimeout(resolve, delayMs));
//     }
//   }

//   throw new Error("Doctor assignment timed out — please try again shortly");
// };

// const genderMap = {
//   MALE: "Male",
//   FEMALE: "Female",
//   OTHER: "Other",
// } as const;

// const initiateConsultation = async (userId: string) => {
//   const customer = await User.findById(userId);

//   if (!customer) {
//     throw new AppError(httpStatus.NOT_FOUND, "Customer not found");
//   }

//   // Any active subscription works as the reference — this module doesn't
//   // gate on a per-package consultation limit right now, it only records usage.
//   const subscription = await Subscription.findOne({
//     customer: userId,
//     isDeleted: false,
//     status: SubscriptionStatus.ACTIVE,
//   });

//   if (!subscription) {
//     throw new AppError(
//       httpStatus.BAD_REQUEST,
//       "No active subscription found for this customer",
//     );
//   }

//   const consultation = await Consultation.create({
//     customer: userId,
//     subscription: subscription._id,
//     status: ConsultationStatus.INITIATED,
//   });

//   try {
//     // Activate/refresh this patient's Zaynax record under the shared corporate account.
//     const clientSideAppointmentId = String(consultation._id);

//     const subscribeRes = await ZaynaxApi.subscribeCorporatePackage(
//       clientSideAppointmentId,
//       process.env.SUROKKHA_LOGO_URL as string,
//       [
//         {
//           firstName: customer.name?.split(" ")[0] ?? customer.name,
//           lastName: customer.name?.split(" ").slice(1).join(" ") || "-",
//           gender: genderMap[customer.gender as keyof typeof genderMap] ?? "Other",
//           mobileNumber: customer.phone,
//         },
//       ],
//     );

//     if (!subscribeRes.success) {
//       consultation.status = ConsultationStatus.FAILED;
//       consultation.failureReason = "Zaynax subscribe call failed";
//       await consultation.save();

//       throw new AppError(
//         httpStatus.BAD_GATEWAY,
//         "Doctor service unavailable, please try again shortly",
//       );
//     }

//     const patientToken = (
//       await ZaynaxApi.getUserToken(
//         ZaynaxApi.extractTokenFromUrl(subscribeRes.data.URL),
//       )
//     ).data.token;

//     // Shared corporate pool balance safety check.
//     const hasPoolBalance = await ZaynaxApi.checkPackageForCall(patientToken);

//     if (!hasPoolBalance) {
//       consultation.status = ConsultationStatus.POOL_EXHAUSTED;
//       consultation.failureReason = "Zaynax corporate package balance is empty";
//       await consultation.save();

//       throw new AppError(
//         httpStatus.SERVICE_UNAVAILABLE,
//         "Doctor consultation service is temporarily unavailable",
//       );
//     }

//     consultation.status = ConsultationStatus.ELIGIBLE;
//     await consultation.save();

//     // Book the appointment.
//     const booking = await ZaynaxApi.bookQuickAppointment(
//       patientToken,
//       customer.name,
//       clientSideAppointmentId,
//     );

//     consultation.zaynaxBookingId = booking.id;
//     consultation.zaynaxOrderType = booking.orderType; // captured from booking response, not hardcoded
//     consultation.status = ConsultationStatus.BOOKED;
//     await consultation.save();

//     // Pay from the shared package balance — this is the point of truth for
//     // usage count, since Zaynax's own pool balance is deducted here
//     // regardless of whether the doctor later accepts or rejects the call.
//     const paid = await ZaynaxApi.payByPackage(patientToken, booking.id, booking.orderType);

//     if (!paid) {
//       consultation.status = ConsultationStatus.FAILED;
//       consultation.failureReason = "Zaynax payment/by-package returned false";
//       await consultation.save();
//       throw new AppError(httpStatus.BAD_GATEWAY, "Could not start consultation, please retry");
//     }

//     consultation.status = ConsultationStatus.PAID;
//     await consultation.save();

//     // Get booking/doctor details — Zaynax assigns doctors asynchronously via
//     // a queue, so poll until doctorID/doctorInfo show up (or time out).
//     // const details = await waitForDoctorAssignment(patientToken, booking.id);
//     const details = await waitForDoctorAssignment(patientToken, booking.id, 20, 5000);

//     consultation.doctorId = details.doctorID;
//     consultation.doctorName = `${details.doctorInfo.firstName.en} ${details.doctorInfo.lastName.en}`;
//     // consultation.roomId = `${booking.id}${userId}`; // roomID = bookingID + patientUserID, per Zaynax docs
//     consultation.roomId = `${booking.id}${details.patientID}`;
//     await consultation.save();

//     return {
//       consultationId: consultation._id,
//       roomId: consultation.roomId,
//       orderID: booking.id,
//       doctorInfo: details.doctorInfo,
//       zaynaxAuthToken: patientToken, // frontend uses this to open the socket connection directly
//     };
//   } catch (error) {
//     if (consultation.status === ConsultationStatus.INITIATED) {
//       consultation.status = ConsultationStatus.FAILED;
//       consultation.failureReason =
//         error instanceof Error ? error.message : "Unknown error";
//       await consultation.save();
//     }

//     throw error;
//   }
// };

// interface IUpdateConsultationStatusPayload {
//   status: ConsultationStatus;
//   callStartedAt?: string;
//   callEndedAt?: string;
//   prescriptionUrl?: string;
// }

// /**
//  * Frontend calls this as the socket lifecycle progresses
//  * (RINGING / ACCEPTED / REJECTED / TIMEOUT / COMPLETED / CANCELLED),
//  * optionally carrying callStartedAt (on ACCEPTED) / callEndedAt (on
//  * COMPLETED) / prescriptionUrl (whenever a prescription becomes available).
//  * Doesn't affect any counter — usage is already counted at PAID.
//  */
// const updateConsultationStatus = async (
//   id: string,
//   payload: IUpdateConsultationStatusPayload,
// ) => {
//   const consultation = await Consultation.findById(id);

//   if (!consultation) {
//     throw new AppError(httpStatus.NOT_FOUND, "Consultation not found");
//   }

//   consultation.status = payload.status;
//   if (payload.callStartedAt) consultation.callStartedAt = new Date(payload.callStartedAt);
//   if (payload.callEndedAt) consultation.callEndedAt = new Date(payload.callEndedAt);
//   if (payload.prescriptionUrl) consultation.prescriptionUrl = payload.prescriptionUrl;

//   await consultation.save();

//   return consultation;
// };

// const getMyConsultations = async ({
//   query,
//   userId,
// }: {
//   query: Record<string, string>;
//   userId: string;
// }) => {

//   console.log("userId ", userId)
//   const baseQuery = Consultation.find({ customer: userId });

//   const queryBuilder = new QueryBuilder(baseQuery, query);

//   const data = await queryBuilder
//     .filter()
//     .search(consultationSearchableFields)
//     .sort()
//     .fields()
//     .paginate()
//     .build()
//     .populate("subscription", "package status");

//   const meta = await queryBuilder.getMeta();
// console.log("my consultations", data)
//   return { data, meta };
// };

// /** Simple usage count — no limit is enforced against this yet, it's tracked for future use. */
// const getMyConsultationCount = async (userId: string) => {
//   const count = await Consultation.countDocuments({
//     customer: userId,
//     isDeleted: false,
//     status: {
//       $in: [
//         ConsultationStatus.PAID,
//         ConsultationStatus.RINGING,
//         ConsultationStatus.ACCEPTED,
//         ConsultationStatus.COMPLETED,
//       ],
//     },
//   });

//   return { count };
// };

// const getSingleConsultation = async (id: string) => {
//   const consultation = await Consultation.findById(id).populate(
//     "subscription",
//     "package status",
//   );

//   if (!consultation) {
//     throw new AppError(httpStatus.NOT_FOUND, "Consultation not found");
//   }

//   return consultation;
// };

// export const ConsultationServices = {
//   initiateConsultation,
//   updateConsultationStatus,
//   getMyConsultations,
//   getMyConsultationCount,
//   getSingleConsultation,
// };

// v3

import httpStatus from "http-status-codes";
import AppError from "../../errorHelpers/appError";
import { ConsultationStatus } from "./consultation.interface";
import { consultationSearchableFields } from "./consultation.constants";
import { QueryBuilder } from "../../utils/QueryBuilder";
import { User } from "../user/user.model";
import { Subscription } from "../subscription/subscription.model";
import { Consultation } from "./consultation.model";
import { SubscriptionStatus } from "../subscription/subscription.interface";
import { ZaynaxApi } from "../zaynax/zaynax.service";

/** 
 * Polls Zaynax until a doctor is assigned to the booking, or times out.
 * Per Zaynax's docs, doctor assignment happens asynchronously via a queue —
 * booking details won't have doctorID/doctorInfo populated immediately.
 */
const waitForDoctorAssignment = async (
  token: string,
  bookingId: string,
  maxAttempts = 10,
  delayMs = 3000,
): Promise<{
  id: string;
  doctorID: string;
  patientID: string;
  doctorInfo: {
    firstName: { en: string; bn: string };
    lastName: { en: string; bn: string };
    image: string;
  };
}> => {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const details = await ZaynaxApi.getBookingDetails(token, bookingId);

    if (details.doctorID && details.doctorInfo) {
      return details as any;
    }

    if (attempt < maxAttempts) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  throw new Error("Doctor assignment timed out — please try again shortly");
};

const genderMap = {
  MALE: "Male",
  FEMALE: "Female",
  OTHER: "Other",
} as const;

const initiateConsultation = async (userId: string) => {
  const customer = await User.findById(userId);

  if (!customer) {
    throw new AppError(httpStatus.NOT_FOUND, "Customer not found");
  }

  // Any active subscription works as the reference — this module doesn't
  // gate on a per-package consultation limit right now, it only records usage.
  const subscription = await Subscription.findOne({
    customer: userId,
    isDeleted: false,
    status: SubscriptionStatus.ACTIVE,
  });

  if (!subscription) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "No active subscription found for this customer",
    );
  }

  const consultation = await Consultation.create({
    customer: userId,
    subscription: subscription._id,
    status: ConsultationStatus.INITIATED,
  });

  try {
    // Activate/refresh this patient's Zaynax record under the shared corporate account.
    const clientSideAppointmentId = String(consultation._id);

    const subscribeRes = await ZaynaxApi.subscribeCorporatePackage(
      clientSideAppointmentId,
      process.env.SUROKKHA_LOGO_URL as string,
      [
        {
          firstName: customer.name?.split(" ")[0] ?? customer.name,
          lastName: customer.name?.split(" ").slice(1).join(" ") || "-",
          gender: genderMap[customer.gender as keyof typeof genderMap] ?? "Other",
          mobileNumber: customer.phone,
        },
      ],
    );

    if (!subscribeRes.success) {
      consultation.status = ConsultationStatus.FAILED;
      consultation.failureReason = "Zaynax subscribe call failed";
      await consultation.save();

      throw new AppError(
        httpStatus.BAD_GATEWAY,
        "Doctor service unavailable, please try again shortly",
      );
    }

    const patientToken = (
      await ZaynaxApi.getUserToken(
        ZaynaxApi.extractTokenFromUrl(subscribeRes.data.URL),
      )
    ).data.token;

    // Stored so we can re-fetch booking details (prescription) after the
    // call ends, without re-authenticating with Zaynax. Never returned
    // from normal queries — see consultation.model.ts (select: false).
    consultation.zaynaxToken = patientToken;

    // Shared corporate pool balance safety check.
    const hasPoolBalance = await ZaynaxApi.checkPackageForCall(patientToken);

    if (!hasPoolBalance) {
      consultation.status = ConsultationStatus.POOL_EXHAUSTED;
      consultation.failureReason = "Zaynax corporate package balance is empty";
      await consultation.save();

      throw new AppError(
        httpStatus.SERVICE_UNAVAILABLE,
        "Doctor consultation service is temporarily unavailable",
      );
    }

    consultation.status = ConsultationStatus.ELIGIBLE;
    await consultation.save();

    // Book the appointment.
    const booking = await ZaynaxApi.bookQuickAppointment(
      patientToken,
      customer.name,
      clientSideAppointmentId,
    );

    consultation.zaynaxBookingId = booking.id;
    consultation.zaynaxOrderType = booking.orderType; // captured from booking response, not hardcoded
    consultation.status = ConsultationStatus.BOOKED;
    await consultation.save();

    // Pay from the shared package balance — this is the point of truth for
    // usage count, since Zaynax's own pool balance is deducted here
    // regardless of whether the doctor later accepts or rejects the call.
    const paid = await ZaynaxApi.payByPackage(patientToken, booking.id, booking.orderType);

    if (!paid) {
      consultation.status = ConsultationStatus.FAILED;
      consultation.failureReason = "Zaynax payment/by-package returned false";
      await consultation.save();
      throw new AppError(httpStatus.BAD_GATEWAY, "Could not start consultation, please retry");
    }

    consultation.status = ConsultationStatus.PAID;
    await consultation.save();

    // Get booking/doctor details — Zaynax assigns doctors asynchronously via
    // a queue, so poll until doctorID/doctorInfo show up (or time out).
    // const details = await waitForDoctorAssignment(patientToken, booking.id);
    const details = await waitForDoctorAssignment(patientToken, booking.id, 20, 5000);

    consultation.doctorId = details.doctorID;
    consultation.doctorName = `${details.doctorInfo.firstName.en} ${details.doctorInfo.lastName.en}`;
    // consultation.roomId = `${booking.id}${userId}`; // roomID = bookingID + patientUserID, per Zaynax docs
    consultation.roomId = `${booking.id}${details.patientID}`;
    await consultation.save();

    return {
      consultationId: consultation._id,
      roomId: consultation.roomId,
      orderID: booking.id,
      doctorInfo: details.doctorInfo,
      zaynaxAuthToken: patientToken, // frontend uses this to open the socket connection directly
    };
  } catch (error) {
    if (consultation.status === ConsultationStatus.INITIATED) {
      consultation.status = ConsultationStatus.FAILED;
      consultation.failureReason =
        error instanceof Error ? error.message : "Unknown error";
      await consultation.save();
    }

    throw error;
  }
};

interface IUpdateConsultationStatusPayload {
  status: ConsultationStatus;
  callStartedAt?: string;
  callEndedAt?: string;
  prescriptionUrl?: string;
}

/**
 * Frontend calls this as the socket lifecycle progresses
 * (RINGING / ACCEPTED / REJECTED / TIMEOUT / COMPLETED / CANCELLED),
 * optionally carrying callStartedAt (on ACCEPTED) / callEndedAt (on
 * COMPLETED) / prescriptionUrl (if the caller already has it).
 * Doesn't affect any counter — usage is already counted at PAID.
 *
 * On COMPLETED (and no prescriptionUrl was already supplied), this also
 * tries fetching the booking details from Zaynax one more time to pick up
 * `prescriptions[]`, since the prescription is typically only written
 * after the call has finished. Best-effort — failure here never blocks
 * the status update itself.
 */
const updateConsultationStatus = async (
  id: string,
  payload: IUpdateConsultationStatusPayload,
) => {
  const consultation = await Consultation.findById(id).select("+zaynaxToken");

  if (!consultation) {
    throw new AppError(httpStatus.NOT_FOUND, "Consultation not found");
  }

  consultation.status = payload.status;
  if (payload.callStartedAt) consultation.callStartedAt = new Date(payload.callStartedAt);
  if (payload.callEndedAt) consultation.callEndedAt = new Date(payload.callEndedAt);
  if (payload.prescriptionUrl) consultation.prescriptionUrl = payload.prescriptionUrl;

  if (
    payload.status === ConsultationStatus.COMPLETED &&
    !payload.prescriptionUrl &&
    consultation.zaynaxToken &&
    consultation.zaynaxBookingId
  ) {
    try {
      const details = await ZaynaxApi.getBookingDetails(
        consultation.zaynaxToken,
        consultation.zaynaxBookingId,
      );

      console.log("Detaisl ", details)

      const prescriptionUrl = ZaynaxApi.extractPrescriptionUrl(details.prescriptions);
       console.log("presciption url ", prescriptionUrl)
      if (prescriptionUrl) {
        consultation.prescriptionUrl = prescriptionUrl;
      }
    } catch {
      // Best-effort — prescription may not be written yet, or Zaynax may be
      // briefly unreachable. Don't fail the status update over this.
    }
  }

  await consultation.save();

  return consultation;
};

const getMyConsultations = async ({
  query,
  userId,
}: {
  query: Record<string, string>;
  userId: string;
}) => {
  const baseQuery = Consultation.find({ customer: userId, isDeleted: false });

  const queryBuilder = new QueryBuilder(baseQuery, query);

  const data = await queryBuilder
    .filter()
    .search(consultationSearchableFields)
    .sort()
    .fields()
    .paginate()
    .build()
    .populate("subscription", "package status");

  const meta = await queryBuilder.getMeta();

  return { data, meta };
};

/** Simple usage count — no limit is enforced against this yet, it's tracked for future use. */
const getMyConsultationCount = async (userId: string) => {
  const count = await Consultation.countDocuments({
    customer: userId,
    isDeleted: false,
    status: {
      $in: [
        ConsultationStatus.PAID,
        ConsultationStatus.RINGING,
        ConsultationStatus.ACCEPTED,
        ConsultationStatus.COMPLETED,
      ],
    },
  });

  return { count };
};

const getSingleConsultation = async (id: string) => {
  const consultation = await Consultation.findById(id).populate(
    "subscription",
    "package status",
  );

  if (!consultation) {
    throw new AppError(httpStatus.NOT_FOUND, "Consultation not found");
  }

  return consultation;
};

export const ConsultationServices = {
  initiateConsultation,
  updateConsultationStatus,
  getMyConsultations,
  getMyConsultationCount,
  getSingleConsultation,
};

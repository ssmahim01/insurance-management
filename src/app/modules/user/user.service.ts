/* eslint-disable @typescript-eslint/no-unused-vars */
import httpStatus from "http-status-codes";
import { IsActive, IUser, Role } from "./user.interface";
import { User } from "./user.model";
import AppError from "../../errorHelpers/appError";
import bcryptjs from "bcryptjs";
import { envVars } from "../../config/env";
import { JwtPayload } from "jsonwebtoken";
import { QueryBuilder } from "../../utils/QueryBuilder";
import { userSearchableFields } from "./user.constants copy";
import { Types } from "mongoose";

const createUserService = async (payload: Partial<IUser>) => {
  console.log("User payload ", payload)
  const isExistUser = await User.findOne({
    phone: payload.phone
  });

  if (isExistUser) {
    throw new AppError(httpStatus.BAD_REQUEST, "Phone number already exists");
  }

  const hashedPassword = await bcryptjs.hash(
    payload.password as string,
    Number(envVars.BCRYPT_SALT_ROUND),
  );

  const user = await User.create({
    ...payload,
    password: hashedPassword,
  });

  return user;
};

const getMe = async (userId: string) => {
  const user = await User.findById(userId).select("-password");
  return {
    data: user,
  };
};

const getSingleUser = async (id: string) => {
  const user = await User.findById(id).select("-password");
  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, "User Not Found");
  }
  return {
    data: user,
  };
};

const deleteUser = async (id: string) => {
  const user = await User.findById(id);
  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, "User Not Found");
  }

  await User.findByIdAndUpdate(id, {
    isDeleted: true,
  });

  return {
    data: null,
  };
};

const getAllUsers = async (query: Record<string, string>) => {
  const queryObj: any = {};

  if (query["createdAt[gte]"] || query["createdAt[lte]"]) {
    queryObj.createdAt = {};

    if (query["createdAt[gte]"]) {
      queryObj.createdAt.$gte = new Date(query["createdAt[gte]"]);
    }

    if (query["createdAt[lte]"]) {
      queryObj.createdAt.$lte = new Date(query["createdAt[lte]"]);
    }
  }

  delete query["createdAt[gte]"];
  delete query["createdAt[lte]"];

  const queryBuilder = new QueryBuilder(
    User.find({
      role: { $ne: Role.CUSTOMER },
      isDeleted: false,
    }),
    query,
  );

  const usersData = queryBuilder
    .filter()
    .search(userSearchableFields)
    .sort()
    .fields()
    .paginate();

  const [data, meta] = await Promise.all([
    usersData.build(),
    queryBuilder.getMeta(),
  ]);

  return {
    data,
    meta: {
      ...meta,
    },
  };
};
const getAllTrashUsers = async (query: Record<string, string>) => {
  const queryObj: any = {};

  // DATE FILTER
  if (query["createdAt[gte]"] || query["createdAt[lte]"]) {
    queryObj.createdAt = {};

    if (query["createdAt[gte]"]) {
      queryObj.createdAt.$gte = new Date(query["createdAt[gte]"]);
    }

    if (query["createdAt[lte]"]) {
      queryObj.createdAt.$lte = new Date(query["createdAt[lte]"]);
    }
  }

  // REMOVE SPECIAL FIELDS
  delete query["createdAt[gte]"];
  delete query["createdAt[lte]"];

  const queryBuilder = new QueryBuilder(
    User.find({ role: { $ne: "CUSTOMER" }, isDeleted: true, ...queryObj }),
    query,
  );
  const usersData = queryBuilder
    .filter()
    .search(userSearchableFields)
    .sort()
    .fields()
    .paginate();

  const [data, meta] = await Promise.all([
    usersData.build(),
    queryBuilder.getMeta(),
  ]);

  return {
    data,
    meta,
  };
};

const updateUser = async (
  userId: string,
  payload: Partial<IUser>,
  decodedToken: JwtPayload,
) => {
  const existingUser = await User.findById(userId);

  if (!existingUser) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found");
  }

  const isSuperAdmin = decodedToken.role === Role.SUPER_ADMIN;

  // Non Super Admin can only update themselves
  if (!isSuperAdmin && userId !== decodedToken.userId) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      "You are not authorized to update this user",
    );
  }

  // Restrict sensitive fields for non super admins
  if (!isSuperAdmin) {
    delete payload.role;
    delete payload.isActive;
    delete payload.isDeleted;
    delete payload.isVerified;
    delete payload.password;
    delete payload.createdBy;
  }

  // Prevent Super Admin from changing own role
  if (
    isSuperAdmin &&
    userId === decodedToken.userId &&
    payload.role &&
    payload.role !== Role.SUPER_ADMIN
  ) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "You cannot change your own role",
    );
  }

  // Prevent Super Admin from deleting himself
  if (
    isSuperAdmin &&
    userId === decodedToken.userId &&
    payload.isDeleted === true
  ) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "You cannot delete your own account",
    );
  }

  // Prevent Super Admin from blocking himself
  if (
    isSuperAdmin &&
    userId === decodedToken.userId &&
    payload.isActive === IsActive.BLOCKED
  ) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "You cannot block your own account",
    );
  }

  // Password should only be changed via change-password route
  if (payload.password) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Password must be changed using change password endpoint",
    );
  }

  const updatedUser = await User.findByIdAndUpdate(userId, payload, {
    new: true,
    runValidators: true,
  }).select("-password");

  return {
    data: updatedUser,
  };
};

const updateProfile = async (
  payload: Partial<IUser>,
  decodedToken: JwtPayload,
) => {
  const user = await User.findById(decodedToken.userId);
  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found");
  }

  if (payload.password) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      "You can't change your password here",
    );
  }

  const updatedUser = await User.findByIdAndUpdate(
    decodedToken.userId,
    payload,
    {
      new: true,
      runValidators: true,
    },
  );
  return {
    data: updatedUser,
  };
};

export const UserServices = {
  createUserService,
  getMe,
  getSingleUser,
  updateUser,
  updateProfile,
  getAllUsers,
  getAllTrashUsers,
  deleteUser,
};

/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */

import { NextFunction, Request, Response } from "express";
import { UserServices } from "./user.service";
import httpStatus from "http-status-codes";
import { JwtPayload } from "jsonwebtoken";
import { IUser } from "./user.interface";
import { sendResponse } from "../../utils/sendResponse";
import { catchAsync } from "../../utils/catchAsync";
import { User } from "./user.model";

const createUser = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const payload = req.body;
    const loggedInUserId = req.user.userId;
    payload.createdBy = loggedInUserId;

    const user = await UserServices.createUserService(payload);

    sendResponse(res, {
      statusCode: httpStatus.CREATED,
      success: true,
      message: "User Created Successfully",
      data: user,
    });
  },
);

const getMe = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const decodedToken = req.user as JwtPayload;
    const result = await UserServices.getMe(decodedToken.userId);

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Your profile Retrieved Successfully",
      data: result.data,
    });
  },
);

const getSingleUser = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.params.id as string;
    const result = await UserServices.getSingleUser(userId);

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "User Retrieved Successfully",
      data: result.data,
    });
  },
);

const updateUser = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.params.id as string;
    const payload: IUser = {
      ...req.body,
      picture: req.file?.path,
    };

    const verifiedToken = req.user;

    const user = await UserServices.updateUser(
      userId,
      payload,
      verifiedToken as JwtPayload,
    );
    sendResponse(res, {
      statusCode: httpStatus.CREATED,
      success: true,
      message: "User Updated Successfully",
      data: user,
    });
  },
);


const deleteUser = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.params.id as string;
    const result = await UserServices.deleteUser(userId);

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "User Deleted Successfully",
      data: result.data,
    });
  },
);
const getAllUsers = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const query = req.query;
    const result = await UserServices.getAllUsers(
      query as Record<string, string>,
    );

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.CREATED,
      message: "All Users Retrieved Successfully",
      data: result.data,
      meta: result.meta,
    });
  },
);

const getAllTrashUsers = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const query = req.query;
    const result = await UserServices.getAllTrashUsers(
      query as Record<string, string>,
    );

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.CREATED,
      message: "All Trash Users Retrieved Successfully",
      data: result.data,
      meta: result.meta,
    });
  },
);

const updateProfile = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const payload = req.body;

    if (req.file) {
      payload.picture = (req.file as any).path;
    }
    const verifiedToken = req.user;
    const user = await UserServices.updateProfile(
      payload,
      verifiedToken as JwtPayload,
    );
    sendResponse(res, {
      statusCode: httpStatus.CREATED,
      success: true,
      message: "Profile Updated Successfully",
      data: user,
    });
  },
);

// update customer trash
const updateUserTrash = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string;

  // @ts-expect-error
  const Data = await CommonTrashService(id, User);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Trash Status Updated",
    data: Data,
  });
});

export const UserControllers = {
  createUser,
  getMe,
  getAllUsers,
  getAllTrashUsers,

  getSingleUser,
  updateUser,
  deleteUser,
  updateProfile,
  updateUserTrash,
};

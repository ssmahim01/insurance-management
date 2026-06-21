import { Request, Response } from "express";
import { MessageService } from "./message.service";
import { sendResponse } from "../../utils/sendResponse";
import httpStatus from "http-status-codes";

// CREATE
const createMessage = async (req: Request, res: Response) => {
  const result = await MessageService.createMessage(req.body);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Message created successfully",
    data: result,
  });
};

// GET ALL
const getAllMessages = async (req: Request, res: Response) => {
    const query = req.query;
  const result = await MessageService.getAllMessages(query as Record<string, string>);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Messages retrieved successfully",
    data: result,
  });
};

// GET SINGLE
const getSingleMessage = async (req: Request, res: Response) => {
  const result = await MessageService.getSingleMessage(req.params.id as string);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Message retrieved successfully",
    data: result,
  });
};

// UPDATE
const updateMessage = async (req: Request, res: Response) => {
  const result = await MessageService.updateMessage(
    req.params.id as string,
    req.body
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Message updated successfully",
    data: result,
  });
};

// DELETE
const softDeleteMessage = async (req: Request, res: Response) => {
  const result = await MessageService.softDeleteMessage(req.params.id as string);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Message deleted successfully",
    data: result,
  });
};

export const MessageController = {
  createMessage,
  getAllMessages,
  getSingleMessage,
  updateMessage,
  softDeleteMessage,
};
import httpStatus from "http-status-codes";
import AppError from "../../errorHelpers/appError";
import { QueryBuilder } from "../../utils/QueryBuilder";
import { Message } from "./message.model";
import { messageSearchableFields } from "./message.constants";

const createMessage = async (
  payload: {
    message: string;
    phone: string;
  },
) => {
  const result = await Message.create(payload);
  return result;
};

const getAllMessages = async (query: Record<string, string>) => {
  const baseQuery = Message.find({
    isDeleted: false,
  });

  const queryBuilder = new QueryBuilder(baseQuery, query);

  const data = await queryBuilder
    .search(messageSearchableFields)
    .filter()
    .sort()
    .fields()
    .paginate()
    .build()

  const meta = await queryBuilder.getMeta();

  return {
    data,
    meta,
  };
};

// =============================================================
// GET SINGLE MESSAGE
// =============================================================

const getSingleMessage = async (id: string) => {
  const message = await Message.findById(id);

  if (!message) {
    throw new AppError(httpStatus.NOT_FOUND, "Message not found");
  }

  return message;
};

// =============================================================
// UPDATE MESSAGE
// =============================================================

const updateMessage = async (
  id: string,
  payload: Partial<{ message: string; phone: string }>,
) => {
  const exists = await Message.findById(id);

  if (!exists) {
    throw new AppError(httpStatus.NOT_FOUND, "Message not found");
  }

  return await Message.findByIdAndUpdate(id, payload, {
    new: true,
    runValidators: true,
  });
};

// =============================================================
// SOFT DELETE MESSAGE
// =============================================================

const softDeleteMessage = async (id: string) => {
  const message = await Message.findById(id);

  if (!message) {
    throw new AppError(httpStatus.NOT_FOUND, "Message not found");
  }

  return await Message.findByIdAndUpdate(
    id,
    { isDeleted: true },
    { new: true },
  );
};

// =============================================================
// HARD DELETE MESSAGE
// =============================================================

const deleteMessage = async (id: string) => {
  await Message.findByIdAndDelete(id);
  return null;
};

// =============================================================
// EXPORT
// =============================================================

export const MessageService = {
  createMessage,
  getAllMessages,
  getSingleMessage,
  updateMessage,
  softDeleteMessage,
  deleteMessage,
};
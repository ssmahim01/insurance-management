import httpStatus from "http-status-codes";
import AppError from "../../errorHelpers/appError";
import { Contact } from "./contact.model";
import { QueryBuilder } from "../../utils/QueryBuilder";
import { contactSearchableFields } from "./contact.constants";

const createContact = async (payload: any) => {
  return await Contact.create(payload);
};


const getAllContacts = async ({
  query,
  user,
}: {
  query: Record<string, string>;
  user: {
    userId: string;
    role: string;
  };
}) => {
  const filter: any = { isDeleted: false };

  // ROLE BASED ACCESS
  const isAdmin =
    user.role === "SUPER_ADMIN" || user.role === "ADMIN";

  if (!isAdmin) {
    filter.userId = user.userId;
  }

  // FILTERS
  if (query.isRead !== undefined) {
    filter.isRead = query.isRead === "true";
    delete query.isRead;
  }

  if (query.phone) {
    filter.phone = query.phone;
    delete query.phone;
  }

  const baseQuery = Contact.find(filter);

  const queryBuilder = new QueryBuilder(baseQuery, query);

  const data = await queryBuilder
    .search(contactSearchableFields)
    .filter()
    .sort()
    .fields()
    .paginate()
    .build()
    .populate("userId", "name phone role")
    .populate("relatedPackage", "name")
    .populate("relatedPartner", "name logo");

  const meta = await queryBuilder.getMeta();

  // STATS
  const stats = await Contact.aggregate([
    { $match: filter },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        read: { $sum: { $cond: [{ $eq: ["$isRead", true] }, 1, 0] } },
        unread: { $sum: { $cond: [{ $eq: ["$isRead", false] }, 1, 0] } },
        replied: { $sum: { $cond: [{ $eq: ["$isReplied", true] }, 1, 0] } },
      },
    },
  ]);

  return {
    data,
    meta,
    stats: stats[0] || {
      total: 0,
      read: 0,
      unread: 0,
      replied: 0,
    },
  };
};

const getSingleContact = async (id: string) => {
  const data = await Contact.findById(id)
    .populate("userId", "name phone")
    .populate("relatedPackage")
    .populate("relatedPartner");

  if (!data) {
    throw new AppError(httpStatus.NOT_FOUND, "Contact not found");
  }

  return data;
};

const markAsRead = async (id: string) => {
  const data = await Contact.findByIdAndUpdate(
    id,
    { isRead: true },
    { returnDocument: "after" },
  );

  return data;
};

const markAsReplied = async (id: string) => {
  const data = await Contact.findByIdAndUpdate(
    id,
    { isReplied: true },
    { returnDocument: "after" },
  );

  return data;
};

const softDeleteContact = async (id: string) => {
  const data = await Contact.findByIdAndUpdate(
    id,
    { isDeleted: true },
    { returnDocument: "after" },
  );

  return data;
};

export const ContactService = {
  createContact,
  getAllContacts,
  getSingleContact,
  markAsRead,
  markAsReplied,
  softDeleteContact,
};
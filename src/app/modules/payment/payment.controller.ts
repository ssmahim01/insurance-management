


import { Request, Response } from "express";
import { PaymentService } from "./payment.service";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";

/* =========================
   INVOICE DOWNLOAD
========================= */
const getInvoiceDownloadUrl = catchAsync(
  async (req: Request, res: Response) => {
    const { paymentId } = req.params;

    const result = await PaymentService.getInvoiceDownloadUrl(paymentId as string);

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Invoice download URL retrieved successfully",
      data: result,
    });
  }
);

export const PaymentController = {
  getInvoiceDownloadUrl
};


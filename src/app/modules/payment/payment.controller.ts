
import { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { PaymentService } from "./payment.service";
import { envVars } from "../../config/env";
import { sendResponse } from "../../utils/sendResponse";
import httpStatus from "http-status-codes"

const initPayment = catchAsync(
    async (req: Request, res: Response) => {

        const result =
            await PaymentService.initPayment(
                req.params.enrollmentId as string
            );

        sendResponse(res, {
            success: true,
            statusCode: httpStatus.OK,
            message: "Payment initialized successfully",
            data: result,
        });
    }
);

const successPayment = catchAsync(
    async (req: Request, res: Response) => {
        const query = req.query;

        const result =
            await PaymentService.successPayment(
                query as Record<string, string>
            );

        if (result?.success) {
            res.redirect(`${envVars.SSL.SSL_SUCCESS_FRONTEND_URL}?transactionId=${query.transactionId}&amount=${query.amount}&status=${query.status}`)
        }
    }
);

const failPayment = catchAsync(
    async (req: Request, res: Response) => {
        const query = req.query;

        const result =
            await PaymentService.failPayment(
                query as Record<string, string>
            );

        if (!result.success) {
            res.redirect(`${envVars.SSL.SSL_FAIL_FRONTEND_URL}?transactionId=${query.transactionId}&amount=${query.amount}&status=${query.status}`)
        }
    }
);

const cancelPayment = catchAsync(
    async (req: Request, res: Response) => {

        const query = req.query;

        const result =
            await PaymentService.cancelPayment(
                query as Record<string, string>
            );

        if (result?.success) {
            res.redirect(`${envVars.SSL.SSL_CANCEL_FRONTEND_URL}?transactionId=${query.transactionId}&amount=${query.amount}&status=${query.status}`)
        }
    }
);


const getAllPayments = catchAsync(async (req: Request, res: Response) => {
    const result = await PaymentService.getAllPayments(
        req.query as Record<string, string>
    );

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "All payments retrieved successfully",
        data: result.data,
        meta: result.meta,
        stats: result.stats
    });
});

const getSinglePayment = catchAsync(async (req: Request, res: Response) => {
    const result = await PaymentService.getSinglePayment(req.params.id as string);

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "Payment retrieved successfully",
        data: result.data,
    });
});

const updatePayment = catchAsync(async (req: Request, res: Response) => {
   console.log(req.params.id, req.body);
    const result = await PaymentService.updatePayment(
        req.params.id as string,
        req.body
    );

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "Payment updated successfully",
        data: result.data,
    });
});

const deletePayment = catchAsync(async (req: Request, res: Response) => {
    const result = await PaymentService.deletePayment(req.params.id as string);

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "Payment deleted successfully",
        data: result.data,
    });
});

export const PaymentController = {
    initPayment,   
    successPayment,  
    failPayment,    
    cancelPayment,   
    getAllPayments,   
    getSinglePayment, 
    updatePayment,     
    deletePayment,     
};
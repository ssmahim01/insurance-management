import axios from "axios";
import { envVars } from "../../config/env";
import { ISSLCommerz } from "./sslCommerz.interface";
import AppError from "../../errorHelpers/appError";
import httpStatus from "http-status-codes"
import { PaymentModel } from "../payment/payment.model";

const sslPaymentInit = async (payload: ISSLCommerz) => {

try {
        const data = {
        store_id: envVars.SSL.SSL_STORE_ID,
        store_passwd: envVars.SSL.SSL_STORE_PASS,
        total_amount: payload.amount,
        currency: "BDT",
        tran_id: payload.transactionId,
        success_url: `${envVars.SSL.SSL_SUCCESS_BACKEND_URL}?transactionId=${payload.transactionId}&amount=${payload.amount}&status=success`,
        fail_url: `${envVars.SSL.SSL_FAIL_BACKEND_URL}?transactionId=${payload.transactionId}&amount=${payload.amount}&status=fail`,
        cancel_url: `${envVars.SSL.SSL_CANCEL_BACKEND_URL}?transactionId=${payload.transactionId}&amount=${payload.amount}&status=cancel`,
        ipn_url: envVars.SSL.SSL_IPN_URL,
        cus_name: payload.name,
        cus_email: payload?.email || "N/A",
        cus_add1: payload.address,
        cus_add2: "N/A",
        cus_city: payload.city,
        cus_state: "N/A",
        cus_postcode: "N/A",
        cus_country: "Bangladesh",
        cus_phone: payload.phone,
        cus_fax: "N/A",
        ship_name: "N/A",
        ship_add1: "N/A",
        ship_add2: "N/A",
        ship_city: "N/A",
        ship_state: "N/A",
        ship_postcode: "N/A",
        ship_country: "N/A"
    }

    const response = await axios({
        method: "POST",
        url: envVars.SSL.SSL_PAYMENT_API,
        data: data,
        headers: { "Content-Type": "application/x-www-form-urlencoded" }

    })

    return response.data;
} catch (error: any) {
    console.log("Payment error occurred")
    throw new AppError(httpStatus.BAD_REQUEST, error.message)
}
}

const validatePayment = async (payload: any) => {
    try {
        const response = await axios({
            method: "GET",
            url: `${envVars.SSL.SSL_VALIDATION_API}?val_id=${payload.val_id}&store_id=${envVars.SSL.SSL_STORE_ID}&store_passwd=${envVars.SSL.SSL_STORE_PASS}`
        })

        await PaymentModel.updateOne(
            { transactionId: payload.tran_id },
            { paymentGatewayData: response.data },
            { runValidators: true })
    } catch (error: any) {
        console.log(error);
        throw new AppError(401, `Payment Validation Error, ${error.message}`)
    }
}

export const SSLCommerzService = {
    sslPaymentInit,
    validatePayment
}


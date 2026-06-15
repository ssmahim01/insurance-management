import express from "express";
import { PaymentController } from "./payment.controller";

const router = express.Router();

router.get("/invoice/:paymentId", PaymentController.getInvoiceDownloadUrl);

export const paymentRoutes = router;


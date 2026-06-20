
import express from "express";
import { PaymentController } from "./payment.controller";
import { Role } from "../user/user.interface";
import { checkAuth } from "../../middlewares/checkAuth";

const router = express.Router();

router.post(
    "/init-payment/:enrollmentId",
    PaymentController.initPayment
);

router.post(
    "/success",
    PaymentController.successPayment
);

router.post(
    "/fail",
    PaymentController.failPayment
);

router.post(
    "/cancel",
    PaymentController.cancelPayment
);

router.get("/all-payments", checkAuth(Role.ADMIN, Role.SUPER_ADMIN), PaymentController.getAllPayments);       // ✅
router.get("/:id", checkAuth(Role.ADMIN, Role.CUSTOMER, Role.SUPER_ADMIN), PaymentController.getSinglePayment);              // ✅
router.patch("/:id", checkAuth(Role.ADMIN, Role.SUPER_ADMIN), PaymentController.updatePayment);          // ✅
router.delete("/:id", checkAuth(Role.ADMIN, Role.SUPER_ADMIN), PaymentController.deletePayment);

export const paymentRoutes = router;
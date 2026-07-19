import express from "express";
import { PaymentController } from "./payment.controller";
import { Role } from "../user/user.interface";
import { checkAuth } from "../../middlewares/checkAuth";

const router = express.Router();

router.all(
    "/return",
    PaymentController.paymentReturn
);

router.all(
    "/cancel",
    PaymentController.paymentCancel
);

router.post("/validate-payment", PaymentController.validatePayment)

router.get("/all-payments", checkAuth(Role.ADMIN, Role.SUPER_ADMIN), PaymentController.getAllPayments);
router.get("/all-trash-payments", checkAuth(Role.ADMIN, Role.SUPER_ADMIN), PaymentController.getAllTrashPayments);
router.get("/:id", checkAuth(Role.ADMIN, Role.CUSTOMER, Role.SUPER_ADMIN), PaymentController.getSinglePayment);
router.patch("/:id", checkAuth(Role.ADMIN, Role.SUPER_ADMIN), PaymentController.updatePayment);
router.patch("/restore/:id", checkAuth(Role.ADMIN, Role.SUPER_ADMIN), PaymentController.restorePayment);
router.delete("/soft-delete/:id", checkAuth(Role.ADMIN, Role.SUPER_ADMIN), PaymentController.softDeletePayment);
router.delete("/:id", checkAuth(Role.ADMIN, Role.SUPER_ADMIN), PaymentController.deletePayment);

export const paymentRoutes = router;
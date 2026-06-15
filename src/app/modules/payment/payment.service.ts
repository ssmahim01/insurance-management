
// import AppError from "../../errorHelpers/appError";
// import { Payment } from "./payment.model";
// // import { generatePdf } from "../../utils/generatePdf";
// import { uploadBufferToCloudinary } from "../../config/cloudinary.config";
// import { generatePdf } from "../../utils/generatePdf";

// const getInvoiceDownloadUrl = async (paymentId: string) => {
//   const payment = await Payment.findById(paymentId).populate({
//     path: "order",
//     populate: [
//       { path: "user", select: "fullname email phone address" },
//       { path: "products.product", select: "name" },
//     ],
//   });

//   if (!payment) {
//     throw new AppError(404, "Payment not found");
//   }

//   // 🔁 Already generated
//   if (payment.invoiceUrl) {
//     return { downloadUrl: payment.invoiceUrl };
//   }

//   const order: any = payment.order;

//   if (!order) {
//     throw new AppError(404, "Order not found for this payment");
//   }
// const invoiceBuffer = await generatePdf({
//   orderId: order._id.toString(),
//   customOrderId: order?.customOrderId,
//   orderDate: order.createdAt,
//   orderType: order.orderType,
//   orderStatus: order.status,
//   paymentMethod: payment.paymentMethod,
//   paymentStatus: payment.paymentStatus,
//   transactionId: payment.transactionId as string,
//   amount: payment.amount,
//   currency: "TK",

//   customerName: order?.user?.fullname || "N/A",
//   customerEmail: order?.user?.email || "N/A",
//   customerPhone: order?.user?.phone || "N/A",
//   customerAddress: order?.address || "N/A",

//   products: order.products.map((p: any) => ({
//     name: p.product.name,
//     quantity: p.quantity,
//     price: p.unitPrice,
//     subtotal: p.lineTotal,

//   })),
// });
//   // ☁️ Upload to Cloudinary
//   const cloudinaryResult = await uploadBufferToCloudinary(
//     invoiceBuffer,
//     "invoice"
//   );

//   if (!cloudinaryResult) {
//     throw new AppError(500, "Error uploading invoice to cloud");
//   }

//   // ✅ Save cloud URL
//   payment.invoiceUrl = cloudinaryResult.secure_url;
//   await payment.save();

//   return { downloadUrl: cloudinaryResult.secure_url };
// };


// export const PaymentService = {
//   getInvoiceDownloadUrl,
// };


import AppError from "../../errorHelpers/appError";
import { Payment } from "./payment.model";
import { uploadBufferToCloudinary } from "../../config/cloudinary.config";
import { generatePdf } from "../../utils/generatePdf";

const getInvoiceDownloadUrl = async (paymentId: string) => {

  const payment = await Payment.findById(paymentId).populate({
    path: "order",
    populate: [
      { path: "user", select: "fullname email phone address" },
      { path: "products.product", select: "name" },
    ],
  });

  if (!payment) {
    throw new AppError(404, "Payment not found");
  }

  // already generated
  if (payment.invoiceUrl) {
    return { downloadUrl: payment.invoiceUrl };
  }

  const order: any = payment.order;

  if (!order) {
    throw new AppError(404, "Order not found for this payment");
  }

  const invoiceBuffer = await generatePdf({
    orderId: order._id.toString(),
    customOrderId: order?.customOrderId,
    orderDate: order.createdAt,
    orderType: order.orderType,
    orderStatus: order.status,

    paymentMethod: payment.paymentMethod,
    paymentStatus: payment.paymentStatus,
    transactionId: payment.transactionId as string,
    amount: payment.amount,
    currency: "TK",

    customerName: order?.user?.fullname || "N/A",
    customerEmail: order?.user?.email || "N/A",
    customerPhone: order?.user?.phone || "N/A",
    customerAddress: order?.deliveryAddress || "N/A",

    products: order.products.map((p: any) => ({
      name: p.product?.name || "Unknown product",
      quantity: p.quantity,
      price: p.price,
      subtotal: p.lineTotal,
    })),
  });

  if (!invoiceBuffer) {
    throw new AppError(500, "Invoice generation failed");
  }

  // upload to cloudinary
  const cloudinaryResult = await uploadBufferToCloudinary(
    invoiceBuffer,
    "invoice"
  );

  if (!cloudinaryResult) {
    throw new AppError(500, "Error uploading invoice to cloud");
  }

  payment.invoiceUrl = cloudinaryResult.secure_url;
  await payment.save();

  return {
    downloadUrl: cloudinaryResult.secure_url,
  };
};

export const PaymentService = {
  getInvoiceDownloadUrl,
};
// import httpStatus from "http-status-codes";

// import AppError from "../../errorHelpers/appError";

// import { InsurancePackage } from "./insurancePackage.model";

// import { IInsurancePackage } from "./insurancepackage.interface";

// import { QueryBuilder } from "../../utils/QueryBuilder";

// import { packageSearchableFields } from "./insurancePackage.constants";





// const createPackage = async (payload: IInsurancePackage) => {

//     const existing = await InsurancePackage.findOne({

//         name: payload.name,

//     });



//     if (existing) {

//         throw new AppError(

//             httpStatus.BAD_REQUEST,

//             "Package already exists",

//         );

//     }



//     const result = await InsurancePackage.create(payload);

//     return result;

// };





// const getAllPackages = async (query: Record<string, string>) => {

//     const baseQuery = InsurancePackage.find({

//         isDeleted: false,

//     });



//     const queryBuilder = new QueryBuilder(baseQuery, query);



//     const data = await queryBuilder

//         .filter()

//         .search(packageSearchableFields)

//         .sort()

//         .fields()

//         .paginate()

//         .build();



//     const meta = await queryBuilder.getMeta();



//     return {

//         data,

//         meta,

//     };

// };



// const getAllTrashPackages = async (query: Record<string, string>) => {

//     const baseQuery = InsurancePackage.find({

//         isDeleted: true,

//     });



//     const queryBuilder = new QueryBuilder(baseQuery, query);



//     const data = await queryBuilder

//         .filter()

//         .search(packageSearchableFields)

//         .sort()

//         .fields()

//         .paginate()

//         .build();



//     const meta = await queryBuilder.getMeta();



//     return {

//         data,

//         meta,

//     };

// };



// const getSinglePackage = async (id: string) => {

//     const result = await InsurancePackage.findById(id);



//     if (!result) {

//         throw new AppError(httpStatus.NOT_FOUND, "Package not found");

//     }



//     return result;

// };



// const updatePackage = async (

//     id: string,

//     payload: Partial<IInsurancePackage>,

// ) => {

//     const existing = await InsurancePackage.findById(id);



//     if (!existing) {

//         throw new AppError(httpStatus.NOT_FOUND, "Package not found");

//     }



//     const updated = await InsurancePackage.findByIdAndUpdate(

//         id,

//         payload,

//         {

//             new: true,

//             runValidators: true,

//         },

//     );



//     return updated;

// };



// const softDeletePackage = async (id: string) => {

//     const existing = await InsurancePackage.findById(id);



//     if (!existing) {

//         throw new AppError(httpStatus.NOT_FOUND, "Package not found");

//     }



//     // soft delete

//     const deleted = await InsurancePackage.findByIdAndUpdate(

//         id,

//         { isDeleted: true },

//         { new: true },

//     );



//     return deleted;

// };



// const deletePackage = async (id: string) => {

//     const existing = await InsurancePackage.findById(id);



//     if (!existing) {

//         throw new AppError(httpStatus.NOT_FOUND, "Package not found");

//     }



//     // soft delete

//     const deleted = await InsurancePackage.findByIdAndDelete(id);



//     return null;

// };



// export const PackageServices = {

//     createPackage,

//     getAllPackages,

//     getAllTrashPackages,

//     getSinglePackage,

//     updatePackage,

//     softDeletePackage,

//     deletePackage,

// };,  import { Request, Response } from "express";

// import httpStatus from "http-status-codes";

// import { catchAsync } from "../../utils/catchAsync";

// import { sendResponse } from "../../utils/sendResponse";

// import { PackageServices } from "./insurancePackage.service";



// const createPackage = catchAsync(async (req: Request, res: Response) => {

//     const result = await PackageServices.createPackage(req.body);



//     sendResponse(res, {

//         statusCode: httpStatus.CREATED,

//         success: true,

//         message: "Package created successfully",

//         data: result,

//     });

// });



// const getAllPackages = catchAsync(async (req: Request, res: Response) => {

//     const query = req.query;



//     const result = await PackageServices.getAllPackages(query as Record<string, string>);



//     sendResponse(res, {

//         statusCode: httpStatus.OK,

//         success: true,

//         message: "All packages retrieved successfully",

//         data: result,

//     });

// });



// const getAllTrashPackages = catchAsync(async (req: Request, res: Response) => {

//     const query = req.query;



//     const result = await PackageServices.getAllTrashPackages(query as Record<string, string>);



//     sendResponse(res, {

//         statusCode: httpStatus.OK,

//         success: true,

//         message: "All trash packages retrieved successfully",

//         data: result,

//     });

// });



// const getSinglePackage = catchAsync(async (req: Request, res: Response) => {

//     const result = await PackageServices.getSinglePackage(

//         req.params.id as string,

//     );



//     sendResponse(res, {

//         statusCode: httpStatus.OK,

//         success: true,

//         message: "Package retrieved successfully",

//         data: result,

//     });

// });



// const updatePackage = catchAsync(async (req: Request, res: Response) => {

//     const result = await PackageServices.updatePackage(

//         req.params.id as string,

//         req.body,

//     );



//     sendResponse(res, {

//         statusCode: httpStatus.OK,

//         success: true,

//         message: "Package updated successfully",

//         data: result,

//     });

// });



// const softDeletePackage = catchAsync(async (req: Request, res: Response) => {

//     const result = await PackageServices.softDeletePackage(req.params.id as string);



//     sendResponse(res, {

//         statusCode: httpStatus.OK,

//         success: true,

//         message: "Package moved to trash successfully",

//         data: result,

//     });

// });



// const deletePackage = catchAsync(async (req: Request, res: Response) => {

//     const result = await PackageServices.deletePackage(req.params.id as string);



//     sendResponse(res, {

//         statusCode: httpStatus.OK,

//         success: true,

//         message: "Package moved to trash successfully",

//         data: result,

//     });

// });



// export const PackageControllers = {

//     createPackage,

//     getAllPackages,

//     getAllTrashPackages,

//     getSinglePackage,

//     updatePackage,

//     softDeletePackage,

//     deletePackage,

// };, import express from "express";

// import { checkAuth } from "../../middlewares/checkAuth";

// import { Role } from "../user/user.interface";

// import { validateRequest } from "../../middlewares/validateRequest";

// import { createInsurancePackageValidationSchema, updateInsurancePackageValidationSchema } from "./insurancePackage.valiation";

// import { PackageControllers } from "./insurancePackage.controller";





// const router = express.Router();



// router.post(

//   "/create-package",

//   checkAuth(Role.SUPER_ADMIN, Role.ADMIN),

//   validateRequest(createInsurancePackageValidationSchema),

//   PackageControllers.createPackage,

// );



// router.get(

//   "/all-packages",

//   checkAuth(...Object.values(Role)),

//   PackageControllers.getAllPackages,

// );



// router.get(

//   "/all-trash-packages",

//   checkAuth(Role.ADMIN, Role.SUPER_ADMIN),

//   PackageControllers.getAllTrashPackages,

// );



// router.get(

//   "/:id",

//   checkAuth(...Object.values(Role)),

//   PackageControllers.getSinglePackage,

// );



// router.patch(

//   "/:id",

//   checkAuth(Role.SUPER_ADMIN, Role.ADMIN),

//   validateRequest(updateInsurancePackageValidationSchema),

//   PackageControllers.updatePackage,

// );



// router.patch(

//   "/soft-delete/:id",

//   checkAuth(Role.SUPER_ADMIN, Role.ADMIN),

//   PackageControllers.softDeletePackage,

// );



// router.delete(

//   "/:id",

//   checkAuth(Role.SUPER_ADMIN, Role.ADMIN),

//   PackageControllers.deletePackage,

// );



// export const packageRoutes = router;

// import { Schema, model } from "mongoose";

// import { IInsurancePackage, IPlan, PlanType } from "./insurancepackage.interface";





// const planSchema = new Schema<IPlan>(

//     {

//         type: {

//             type: String,

//             enum: Object.values(PlanType),

//             required: true,

//         },

//         durationInMonths: {

//             type: Number,

//             required: true,

//             min: 1,

//         },

//         price: {

//             type: Number,

//             required: true,

//             min: 0,

//         },

//     },

//     {

//         _id: false,

//     }

// );



// const insurancePackageSchema = new Schema<IInsurancePackage>(

//     {

//         name: {

//             type: String,

//             required: true,

//             trim: true,

//         },



//         slug: {

//             type: String,

//             unique: true,

//             lowercase: true,

//             trim: true,

//         },



//         description: {

//             type: String,

//             required: true,

//             trim: true,

//         },



//         coverageAmount: {

//             type: Number,

//             required: true,

//             min: 0,

//         },



//         plans: {

//             type: [planSchema],

//             required: true,

//         },



//         benefits: {

//             type: [String],

//             default: [],

//         },



//         exclusions: {

//             type: [String],

//             default: [],

//         },



//         isActive: {

//             type: Boolean,

//             default: true,

//         },

//         isDeleted: {

//             type: Boolean,

//             default: false,

//             index: true,

//         },



//     },

//     {

//         timestamps: true,

//     }

// );



// // Auto Generate Slug on Create

// insurancePackageSchema.pre("save", async function () {

//     if (this.isModified("name")) {

//         const baseSlug = this.name

//             .toLowerCase()

//             .replace(/[^a-z0-9]+/g, "-")

//             .replace(/^-+|-+$/g, "");



//         let slug = baseSlug;

//         let counter = 1;



//         const InsurancePackage = model<IInsurancePackage>(

//             "InsurancePackage"

//         );



//         while (await InsurancePackage.exists({ slug })) {

//             slug = `${baseSlug}-${counter++}`;

//         }



//         this.slug = slug;

//     }

// });



// // Auto Generate Slug on Update

// insurancePackageSchema.pre("findOneAndUpdate", async function () {

//     const update = this.getUpdate() as Partial<IInsurancePackage>;



//     if (update.name) {

//         const baseSlug = update.name

//             .toLowerCase()

//             .replace(/[^a-z0-9]+/g, "-")

//             .replace(/^-+|-+$/g, "");



//         let slug = baseSlug;

//         let counter = 1;



//         const InsurancePackage = model<IInsurancePackage>(

//             "InsurancePackage"

//         );



//         while (await InsurancePackage.exists({ slug })) {

//             slug = `${baseSlug}-${counter++}`;

//         }



//         update.slug = slug;

//     }



//     this.setUpdate(update);

// });



// export const InsurancePackage = model<IInsurancePackage>(

//     "InsurancePackage",

//     insurancePackageSchema

// );   
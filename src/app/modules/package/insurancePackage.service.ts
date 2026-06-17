import httpStatus from "http-status-codes";
import AppError from "../../errorHelpers/appError";
import { InsurancePackage } from "./insurancePackage.model";
import { QueryBuilder } from "../../utils/QueryBuilder";
import { packageSearchableFields } from "./insurancePackage.constants";
import { IInsurancePackage } from "./insurancepackage.interface";


const createPackage = async (payload: IInsurancePackage) => {
    const existing = await InsurancePackage.findOne({
        name: payload.name,
    });

    if (existing) {
        throw new AppError(
            httpStatus.BAD_REQUEST,
            "Package already exists",
        );
    }

    const result = await InsurancePackage.create(payload);
    return result;
};


const getAllPackages = async (query: Record<string, string>) => {
    const baseQuery = InsurancePackage.find({
        isDeleted: false,
    });

    const queryBuilder = new QueryBuilder(baseQuery, query);

    const data = await queryBuilder
        .filter()
        .search(packageSearchableFields)
        .sort()
        .fields()
        .paginate()
        .build();

    const meta = await queryBuilder.getMeta();

    return {
        data,
        meta,
    };
};

const getAllTrashPackages = async (query: Record<string, string>) => {
    const baseQuery = InsurancePackage.find({
        isDeleted: true,
    });

    const queryBuilder = new QueryBuilder(baseQuery, query);

    const data = await queryBuilder
        .filter()
        .search(packageSearchableFields)
        .sort()
        .fields()
        .paginate()
        .build();

    const meta = await queryBuilder.getMeta();

    return {
        data,
        meta,
    };
};

const getSinglePackage = async (id: string) => {
    const result = await InsurancePackage.findById(id);

    if (!result) {
        throw new AppError(httpStatus.NOT_FOUND, "Package not found");
    }

    return result;
};

const updatePackage = async (
    id: string,
    payload: Partial<IInsurancePackage>,
) => {
    const existing = await InsurancePackage.findById(id);

    if (!existing) {
        throw new AppError(httpStatus.NOT_FOUND, "Package not found");
    }

    const updated = await InsurancePackage.findByIdAndUpdate(
        id,
        payload,
        {
            new: true,
            runValidators: true,
        },
    );

    return updated;
};

const softDeletePackage = async (id: string) => {
    const existing = await InsurancePackage.findById(id);

    if (!existing) {
        throw new AppError(httpStatus.NOT_FOUND, "Package not found");
    }

    // soft delete
    const deleted = await InsurancePackage.findByIdAndUpdate(
        id,
        { isDeleted: true },
        { new: true },
    );

    return deleted;
};

const deletePackage = async (id: string) => {
    const existing = await InsurancePackage.findById(id);

    if (!existing) {
        throw new AppError(httpStatus.NOT_FOUND, "Package not found");
    }

    const deleted = await InsurancePackage.findByIdAndDelete(id);

    return null;
};

export const PackageServices = {
    createPackage,
    getAllPackages,
    getAllTrashPackages,
    getSinglePackage,
    updatePackage,
    softDeletePackage,
    deletePackage,
};
import { Request, Response } from "express";
import httpStatus from "http-status-codes";

import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";

import { DashboardServices } from "./dashboard.service";

import { Role } from "../user/user.interface";

const getDashboardOverview = catchAsync(
  async (req: Request, res: Response) => {
    const { userId, role } = req.user;

    let result;

    switch (role) {
      case Role.SUPER_ADMIN:
      case Role.ADMIN:
      case Role.MANAGER:
        result = await DashboardServices.getAdminDashboard();
        break;

      case Role.AGENT_LEADER:
        result =
          await DashboardServices.getAgentLeaderDashboard(userId);
        break;

      case Role.AGENT:
        result =
          await DashboardServices.getAgentDashboard(userId);
        break;

      default:
        result = await DashboardServices.getAgentDashboard(userId);
    }

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Dashboard retrieved successfully",
      data: result,
    });
  },
);

export const DashboardControllers = {
  getDashboardOverview,
};
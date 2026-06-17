import { Router } from "express";
import { userRoutes } from "../modules/user/user.route";
import { authRoutes } from "../modules/auth/auth.route";
import { packageRoutes } from "../modules/package/insurancePackage.route";

export const router = Router();

const moduleRoutes = [
  {
    path: "/user",
    route: userRoutes,
  },
  {
    path: "/auth",
    route: authRoutes,
  },
  {
    path: "/package",
    route: packageRoutes
  }
];

moduleRoutes.forEach((route) => {
  router.use(route.path, route.route);
});

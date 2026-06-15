import bcrypt from "bcryptjs";
import { User } from "../modules/user/user.model";
import { Role } from "../modules/user/user.interface";

export const seedAdmin = async () => {
  try {
    const adminExists = await User.findOne({
      role: Role.SUPER_ADMIN,
    });

    if (adminExists) {
      console.log("✅ Super Admin already exists");
      return;
    }

    const hashedPassword = await bcrypt.hash(
      "Admin@123",
      10,
    );

    const admin = await User.create({
      name: "Super Admin",
      phone: "01700000000",
      password: hashedPassword,
      role: Role.SUPER_ADMIN,
      isVerified: true,
    });

    console.log(
      `🔥 Default Super Admin created: ${admin.phone}`,
    );
  } catch (error) {
    console.error(
      "❌ Failed to seed Super Admin:",
      error,
    );
  }
};
const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
require("dotenv").config();

const User = require("../models/User");

const createAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    console.log("🍃 MongoDB connected");

    const email = "admin@weddinghalls.com";
    const phone = "01111111111";
    const password = "Admin@123456";

    const existingAdmin = await User.findOne({
      $or: [
        { email },
        { phone },
      ],
    });

    if (existingAdmin) {
      console.log("⚠️ Admin already exists");
      process.exit(0);
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const admin = await User.create({
      name: "Wedding Halls Admin",
      email,
      phone,
      password: hashedPassword,
      role: "admin",
      isActive: true,
    });

    console.log("=================================");
    console.log("✅ Admin created successfully");
    console.log("=================================");
    console.log("Email:", admin.email);
    console.log("Phone:", admin.phone);
    console.log("Role:", admin.role);
    console.log("=================================");

    process.exit(0);
  } catch (error) {
    console.error("❌ Create Admin Error:", error);
    process.exit(1);
  }
};

createAdmin();
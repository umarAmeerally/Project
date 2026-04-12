require("dotenv").config({ path: "server/.env" });
const mongoose = require("mongoose");
const Lecturer = require("./models/Lecturer");

async function createLecturer() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB connected");

    const email = "lecturer@example.com";

    const existing = await Lecturer.findOne({ email });

    if (existing) {
      console.log("Lecturer already exists");
      process.exit(0);
    }

    const lecturer = new Lecturer({
      name: "Demo Lecturer",
      email: email,
      password: "password123"
    });

    await lecturer.save();

    console.log("Lecturer created successfully");
    console.log("Login with:");
    console.log("Email:", email);
    console.log("Password: password123");

    process.exit(0);

  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

createLecturer();
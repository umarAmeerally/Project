const express = require("express");
const Lecturer = require("../models/Lecturer");

const router = express.Router();

// Lecturer login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const lecturer = await Lecturer.findOne({ email });

    if (!lecturer) {
      return res.status(404).json({ message: "Lecturer not found" });
    }

    if (lecturer.password !== password) {
      return res.status(401).json({ message: "Invalid password" });
    }

    res.json({
      message: "Login successful",
      lecturer: {
        id: lecturer._id,
        name: lecturer.name,
        email: lecturer.email
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create lecturer account (temporary setup route)
router.post("/register", async (req, res) => {
  try {
    const lecturer = new Lecturer(req.body);
    await lecturer.save();
    res.status(201).json(lecturer);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
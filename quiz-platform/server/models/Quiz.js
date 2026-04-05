const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema({
  text: { type: String, required: true },
  options: [{ type: String, required: true }],
  correctAnswer: { type: Number, required: true }
});

const quizSchema = new mongoose.Schema({
  title: { type: String, required: true },
  createdBy: { type: String, default: "Lecturer" },
  questions: [questionSchema]
});

module.exports = mongoose.model("Quiz", quizSchema);
require("dotenv").config({ path: "server/.env" });
const mongoose = require("mongoose");
const Quiz = require("./models/Quiz");

async function createSampleQuiz() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB connected");

    const title = "Basic Algebra Quiz";

    const existing = await Quiz.findOne({ title });

    if (existing) {
      console.log("Sample quiz already exists");
      process.exit(0);
    }

    const quiz = new Quiz({
      title,
      createdBy: "Demo Lecturer",
      questions: [
        {
          text: "What is 2 + 3?",
          options: ["4", "5", "6", "7"],
          correctAnswer: 1
        },
        {
          text: "What is 7 - 4?",
          options: ["2", "3", "4", "5"],
          correctAnswer: 1
        },
        {
          text: "What is 3 × 3?",
          options: ["6", "8", "9", "12"],
          correctAnswer: 2
        },
        {
          text: "What is 12 ÷ 4?",
          options: ["2", "3", "4", "6"],
          correctAnswer: 1
        },
        {
          text: "What is x if x + 5 = 9?",
          options: ["2", "3", "4", "5"],
          correctAnswer: 2
        }
      ]
    });

    await quiz.save();

    console.log("Sample quiz created successfully");
    console.log("Quiz title:", title);

    process.exit(0);
  } catch (error) {
    console.error("Error creating sample quiz:", error);
    process.exit(1);
  }
}

createSampleQuiz();
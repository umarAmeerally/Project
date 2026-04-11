const express = require("express");
const { generateQuestionsFromText } = require("../services/aiQuestionService");

const router = express.Router();

router.post("/generate-questions", async (req, res) => {
  try {
    const {
      lectureText,
      numberOfQuestions = 5,
      difficulty = "medium",
      topic = ""
    } = req.body;

    if (!lectureText || lectureText.trim().length < 30) {
      return res.status(400).json({
        message: "Please provide enough lecture text to generate useful questions."
      });
    }

    const safeQuestionCount = Math.min(Math.max(Number(numberOfQuestions) || 5, 1), 10);

    const questions = await generateQuestionsFromText({
      lectureText,
      numberOfQuestions: safeQuestionCount,
      difficulty,
      topic
    });

    res.json({
      message: "Questions generated successfully",
      questions
    });
  } catch (error) {
    console.error("AI generate questions error:", error);
    res.status(500).json({
      message: error.message || "Server error while generating AI questions"
    });
  }
});

module.exports = router;
const express = require("express");
const Session = require("../models/Session");
const Quiz = require("../models/Quiz");
const Response = require("../models/Response");

const router = express.Router();

function generateCode(length = 6) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < length; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Start a quiz session
router.post("/start", async (req, res) => {
  try {
    const { quizId } = req.body;

    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      return res.status(404).json({ message: "Quiz not found" });
    }

    const session = new Session({
      quizId,
      accessCode: generateCode()
    });

    await session.save();
    res.status(201).json(session);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Join a session
router.post("/join", async (req, res) => {
  try {
    const { accessCode, nickname } = req.body;

    const session = await Session.findOne({ accessCode, isActive: true });

    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

    const cleanedNickname = nickname.trim().toLowerCase();

    const existingParticipant = session.participants.find(
      p => p.nickname.trim().toLowerCase() === cleanedNickname
    );

    if (existingParticipant) {
      return res.status(400).json({ message: "Nickname already taken in this session" });
    }

    session.participants.push({ nickname: nickname.trim() });
    await session.save();

    res.json({
      message: "Joined session successfully",
      session
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get session details by code
router.get("/:code", async (req, res) => {
  try {
    const session = await Session.findOne({
      accessCode: req.params.code
    }).populate("quizId");

    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

    res.json(session);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Submit an answer
router.post("/submit", async (req, res) => {
  try {
    const { accessCode, nickname, questionId, selectedAnswer, responseTime } = req.body;

    const session = await Session.findOne({ accessCode, isActive: true }).populate("quizId");

    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

    const question = session.quizId.questions.id(questionId);

    if (!question) {
      return res.status(404).json({ message: "Question not found" });
    }

    const isCorrect = question.correctAnswer === selectedAnswer;

    // Store response
    const response = new Response({
      participantNickname: nickname,
      sessionId: session._id,
      questionId,
      selectedAnswer,
      isCorrect,
      responseTime: responseTime || 0
    });

    await response.save();

    // Update participant score if correct
    const participant = session.participants.find(p => p.nickname === nickname);

    if (!participant) {
      return res.status(404).json({ message: "Participant not found" });
    }

    if (isCorrect) {
      participant.score += 1;
      await session.save();
    }

    res.json({
      message: "Answer submitted successfully",
      isCorrect,
      currentScore: participant.score
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Start the game/session
router.post("/begin", async (req, res) => {
  try {
    const { accessCode } = req.body;

    const session = await Session.findOne({ accessCode, isActive: true });

    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

    session.status = "live";
    await session.save();

    res.json({ message: "Session started", session });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// End the session
router.post("/end", async (req, res) => {
  try {
    const { accessCode } = req.body;

    const session = await Session.findOne({ accessCode, isActive: true });

    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

    session.status = "ended";
    session.isActive = false;
    await session.save();

    res.json({ message: "Session ended", session });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
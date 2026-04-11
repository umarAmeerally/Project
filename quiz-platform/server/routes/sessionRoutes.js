const express = require("express");
const Session = require("../models/Session");
const Quiz = require("../models/Quiz");
const Response = require("../models/Response");

const {
  getActivePlayers,
  generateDuels,
  resolveDuel,
  findDuelByNickname,
  areAllNonByeDuelsCompleted,
  areAllNonByeDuelsAnsweredForCurrentQuestion,
  applyRoundResults
} = require("../services/battleRoyaleService");

const {
  createTacticalDuel,
  getRemainingTimeSeconds,
  checkTimeoutAndResolve,
  selectAction,
  submitAnswer
} = require("../services/tacticalDuelService");

const router = express.Router();



function generateCode(length = 6) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < length; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

function validateTacticalDuelSession(session) {
  if (!session) {
    return "Session not found";
  }

  if (session.gameMode !== "tacticalDuel") {
    return "This session is not in Tactical Duel mode";
  }

  return null;
}

// Start a quiz session
router.post("/start", async (req, res) => {
  try {
    const { quizId, gameMode } = req.body;

    if (!quizId) {
      return res.status(400).json({ message: "Quiz ID is required" });
    }

    const accessCode = Math.floor(100000 + Math.random() * 900000).toString();

    const session = new Session({
      quizId,
      accessCode,
      gameMode: gameMode || "classic",
      participants: [],
      status: "waiting",
      isActive: true,
      battleState: {
        currentRound: 0,
        currentQuestionIndex: 0,
        phase: "lobby",
        duels: [],
        roundWinners: [],
        eliminatedPlayers: [],
        winner: null
      }
    });

    await session.save();

    res.status(201).json({
      message: "Session created successfully",
      session
    });
  } catch (error) {
    console.error("Start session error:", error);
    res.status(500).json({ message: "Server error while starting session" });
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

router.get("/:accessCode/battle-state", async (req, res) => {
  try {
    const session = await Session.findOne({ accessCode: req.params.accessCode }).populate("quizId");

    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

    res.json({
      accessCode: session.accessCode,
      gameMode: session.gameMode,
      status: session.status,
      participants: session.participants,
      battleState: session.battleState,
      quiz: session.quizId
      
    });
  } catch (error) {
    console.error("Get battle state error:", error);
    res.status(500).json({ message: "Server error while fetching battle state" });
  }

  
});

router.post("/:accessCode/start-battle", async (req, res) => {
  try {
    const session = await Session.findOne({ accessCode: req.params.accessCode }).populate("quizId");

    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

    if (session.gameMode !== "battleRoyale") {
      return res.status(400).json({ message: "This session is not in battle royale mode" });
    }

    if (!session.quizId || !session.quizId.questions || session.quizId.questions.length === 0) {
      return res.status(400).json({ message: "Quiz has no questions" });
    }

    const activePlayers = getActivePlayers(session);

    if (activePlayers.length < 2) {
      return res.status(400).json({ message: "At least 2 players are required to start battle royale" });
    }

    const { duels } = generateDuels(activePlayers);

    session.status = "live";
    session.isActive = true;
    session.battleState.currentRound = 1;
    session.battleState.currentQuestionIndex = 0;
    session.battleState.currentQuestionInRound = 0;
    session.battleState.questionsPerDuel = 2;
    session.battleState.duels = duels;
    session.battleState.phase = "question";
    session.battleState.roundWinners = duels
      .filter((duel) => duel.isBye && duel.winner)
      .map((duel) => duel.winner);

    await session.save();

    res.json({
      message: "Battle royale started",
      session
    });
  } catch (error) {
    console.error("Start battle error:", error);
    res.status(500).json({ message: "Server error while starting battle royale" });
  }

  
});

router.post("/:accessCode/submit-battle-answer", async (req, res) => {
  try {
    const { nickname, selectedAnswer, responseTime } = req.body;

    const session = await Session.findOne({
      accessCode: req.params.accessCode
    }).populate("quizId");

    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

    if (session.gameMode !== "battleRoyale") {
      return res.status(400).json({
        message: "This session is not in battle royale mode"
      });
    }

    if (session.status !== "live" || session.battleState.phase !== "question") {
      return res.status(400).json({
        message: "Battle round is not currently accepting answers"
      });
    }

    const participant = session.participants.find(
      (p) => p.nickname === nickname
    );

    if (!participant) {
      return res.status(404).json({ message: "Participant not found" });
    }

    if (participant.status !== "active") {
      return res.status(400).json({
        message: "Eliminated players cannot answer"
      });
    }

    const duel = findDuelByNickname(session.battleState.duels, nickname);

    if (!duel) {
      return res.status(404).json({
        message: "Duel not found for this player"
      });
    }

    if (duel.isBye) {
      return res.status(400).json({
        message: "This player has a bye and does not answer this round"
      });
    }

    const currentQuestion =
      session.quizId.questions[session.battleState.currentQuestionIndex];

    if (!currentQuestion) {
      return res.status(400).json({
        message: "No question found for current round"
      });
    }

    let duelPlayer;
    if (duel.player1.nickname === nickname) {
      duelPlayer = duel.player1;
    } else if (duel.player2.nickname === nickname) {
      duelPlayer = duel.player2;
    }

    if (!duelPlayer) {
      return res.status(404).json({ message: "Player not found in duel" });
    }

    // Prevent answering the same question twice
    if (duelPlayer.answered) {
      return res.status(400).json({
        message: "Player has already answered this question"
      });
    }

    // Save this player's answer for the current duel question
    const isCorrect = currentQuestion.correctAnswer === selectedAnswer;

    duelPlayer.selectedAnswer = selectedAnswer;
    duelPlayer.responseTime = responseTime ?? 0;
    duelPlayer.isCorrect = isCorrect;
    duelPlayer.answered = true;

    // If both players in this duel have answered this question, update duel score
    if (duel.player1.answered && duel.player2.answered) {
      if (duel.player1.isCorrect) duel.player1Score += 1;
      if (duel.player2.isCorrect) duel.player2Score += 1;
    }

    // Check if all active duels have answered this current question
    if (areAllNonByeDuelsAnsweredForCurrentQuestion(session.battleState.duels)) {
      console.log("ALL DUELS ANSWERED FOR CURRENT QUESTION");
      console.log("Before update:", {
        currentRound: session.battleState.currentRound,
        currentQuestionInRound: session.battleState.currentQuestionInRound,
        currentQuestionIndex: session.battleState.currentQuestionIndex
      });

      // If there is still another question left in this duel
      if (
        session.battleState.currentQuestionInRound <
        session.battleState.questionsPerDuel - 1
      ) {
        session.battleState.currentQuestionInRound += 1;
        session.battleState.currentQuestionIndex += 1;

        console.log("Moved to next question step:", {
          currentRound: session.battleState.currentRound,
          currentQuestionInRound: session.battleState.currentQuestionInRound,
          currentQuestionIndex: session.battleState.currentQuestionIndex
        });

        // Reset per-question answer state for next question in same duel
        session.battleState.duels.forEach((duel) => {
          if (!duel.isBye) {
            duel.player1.answered = false;
            duel.player2.answered = false;

            duel.player1.selectedAnswer = null;
            duel.player2.selectedAnswer = null;

            duel.player1.responseTime = null;
            duel.player2.responseTime = null;

            duel.player1.isCorrect = false;
            duel.player2.isCorrect = false;
          }
        });
      } else {
        console.log("Resolving duel after final question:", {
          currentRound: session.battleState.currentRound,
          currentQuestionInRound: session.battleState.currentQuestionInRound,
          currentQuestionIndex: session.battleState.currentQuestionIndex
        });

        // Final question of duel completed -> resolve all duels
        session.battleState.duels.forEach((duel) => {
          if (!duel.isBye && duel.status !== "completed") {
            let winner;
            let loser;

            if (duel.player1Score > duel.player2Score) {
              winner = duel.player1.nickname;
              loser = duel.player2.nickname;
            } else if (duel.player2Score > duel.player1Score) {
              winner = duel.player2.nickname;
              loser = duel.player1.nickname;
            } else {
              // Tie-break on final question result / response time
              const result = resolveDuel(duel.player1, duel.player2);
              winner = result.winner;
              loser = result.loser;
            }

            duel.winner = winner;
            duel.loser = loser;
            duel.status = "completed";

            const winnerParticipant = session.participants.find(
              (p) => p.nickname === winner
            );

            if (winnerParticipant) {
              winnerParticipant.score += 1;
            }
          }
        });

        applyRoundResults(session);
      }
    }

    await session.save();

    res.json({
      message: "Battle answer submitted successfully",
      isCorrect,
      battleState: session.battleState,
      participants: session.participants
    });
  } catch (error) {
    console.error("Submit battle answer error:", error);
    res.status(500).json({
      message: "Server error while submitting battle answer"
    });
  }
});

router.post("/:accessCode/next-round", async (req, res) => {
  try {
    const session = await Session.findOne({ accessCode: req.params.accessCode }).populate("quizId");

    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

    if (session.gameMode !== "battleRoyale") {
      return res.status(400).json({ message: "This session is not in battle royale mode" });
    }

    if (session.battleState.phase === "finished" || session.status === "ended") {
      return res.status(400).json({ message: "Battle royale is already finished" });
    }

    const activePlayers = getActivePlayers(session);

    if (activePlayers.length <= 1) {
      return res.status(400).json({ message: "Not enough players for a new round" });
    }

    const nextQuestionIndex = session.battleState.currentQuestionIndex + 1;

    if (!session.quizId.questions[nextQuestionIndex]) {
      return res.status(400).json({ message: "No more quiz questions available for the next round" });
    }

    const { duels } = generateDuels(activePlayers);

    session.battleState.currentRound += 1;
    session.battleState.currentQuestionIndex = nextQuestionIndex;
    session.battleState.currentQuestionInRound = 0;
    session.battleState.phase = "question";
    session.battleState.duels = duels;
    session.battleState.roundWinners = duels
      .filter((duel) => duel.isBye && duel.winner)
      .map((duel) => duel.winner);

    await session.save();

    res.json({
      message: "Next round started",
      battleState: session.battleState,
      participants: session.participants
    });
  } catch (error) {
    console.error("Next round error:", error);
    res.status(500).json({ message: "Server error while starting next round" });
  }
});

// =====================
// TACTICAL DUEL ROUTES
// =====================

router.post("/:accessCode/start-tactical-duel", async (req, res) => {
  try {
    const session = await Session.findOne({
      accessCode: req.params.accessCode
    }).populate("quizId");

    const validationError = validateTacticalDuelSession(session);
    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    if (!session.quizId || !session.quizId.questions || session.quizId.questions.length === 0) {
      return res.status(400).json({ message: "Quiz has no questions" });
    }

    const activeParticipants = session.participants.filter((p) => p.status === "active");

    if (activeParticipants.length !== 2) {
      return res.status(400).json({
        message: "Tactical Duel MVP requires exactly 2 active participants"
      });
    }

    createTacticalDuel(session, session.quizId);

    await session.save();

    res.json({
      message: "Tactical Duel started successfully",
      tacticalDuelState: session.tacticalDuelState,
      participants: session.participants
    });
  } catch (error) {
    console.error("Start tactical duel error:", error);
    res.status(500).json({
      message: error.message || "Server error while starting Tactical Duel"
    });
  }
});

router.get("/:accessCode/tactical-duel-state", async (req, res) => {
  try {
    const session = await Session.findOne({
      accessCode: req.params.accessCode
    }).populate("quizId");

    const validationError = validateTacticalDuelSession(session);
    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    checkTimeoutAndResolve(session);
    await session.save();

    const duel = session.tacticalDuelState?.duel || {};
    const remainingTimeSeconds = duel?.phase === "finished"
      ? 0
      : getRemainingTimeSeconds(duel);

    res.json({
      accessCode: session.accessCode,
      gameMode: session.gameMode,
      status: session.status,
      participants: session.participants,
      tacticalDuelState: session.tacticalDuelState,
      remainingTimeSeconds,
      quiz: session.quizId
    });
  } catch (error) {
    console.error("Get tactical duel state error:", error);
    res.status(500).json({
      message: error.message || "Server error while fetching Tactical Duel state"
    });
  }
});

router.post("/:accessCode/tactical-duel/select-action", async (req, res) => {
  try {
    const { nickname, action } = req.body;

    const session = await Session.findOne({
      accessCode: req.params.accessCode
    }).populate("quizId");

    const validationError = validateTacticalDuelSession(session);
    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    checkTimeoutAndResolve(session);

    if (session.tacticalDuelState.duel.phase === "finished") {
      await session.save();
      return res.status(400).json({ message: "Tactical Duel is already finished" });
    }

    const question = selectAction(session, session.quizId, nickname, action);

    await session.save();

    res.json({
      message: "Action selected successfully",
      action,
      question,
      tacticalDuelState: session.tacticalDuelState,
      remainingTimeSeconds: getRemainingTimeSeconds(session.tacticalDuelState.duel)
    });
  } catch (error) {
    console.error("Select tactical action error:", error);
    res.status(500).json({
      message: error.message || "Server error while selecting tactical action"
    });
  }
});

router.post("/:accessCode/tactical-duel/submit-answer", async (req, res) => {
  try {
    const { nickname, selectedAnswer, responseTime } = req.body;

    const session = await Session.findOne({
      accessCode: req.params.accessCode
    }).populate("quizId");

    const validationError = validateTacticalDuelSession(session);
    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    checkTimeoutAndResolve(session);

    if (session.tacticalDuelState.duel.phase === "finished") {
      await session.save();
      return res.status(400).json({ message: "Tactical Duel is already finished" });
    }

    const turnSummary = submitAnswer(
      session,
      session.quizId,
      nickname,
      selectedAnswer,
      responseTime
    );

    checkTimeoutAndResolve(session);

    await session.save();

    res.json({
      message: "Tactical Duel answer submitted successfully",
      turnSummary,
      tacticalDuelState: session.tacticalDuelState,
      participants: session.participants,
      remainingTimeSeconds:
        session.tacticalDuelState.duel.phase === "finished"
          ? 0
          : getRemainingTimeSeconds(session.tacticalDuelState.duel)
    });
  } catch (error) {
    console.error("Submit tactical duel answer error:", error);
    res.status(500).json({
      message: error.message || "Server error while submitting Tactical Duel answer"
    });
  }
});

module.exports = router;
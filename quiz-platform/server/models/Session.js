const mongoose = require("mongoose");

// =====================
// EXISTING BATTLE ROYALE SCHEMAS (UNCHANGED)
// =====================

const duelPlayerSchema = new mongoose.Schema(
  {
    nickname: { type: String, required: true },
    answered: { type: Boolean, default: false },
    selectedAnswer: { type: Number, default: null },
    isCorrect: { type: Boolean, default: false },
    responseTime: { type: Number, default: null }
  },
  { _id: false }
);

const duelSchema = new mongoose.Schema(
  {
    duelId: { type: String, required: true },
    player1: { type: duelPlayerSchema, required: true },
    player2: { type: duelPlayerSchema, default: null },
    winner: { type: String, default: null },
    loser: { type: String, default: null },
    isBye: { type: Boolean, default: false },
    status: {
      type: String,
      enum: ["pending", "completed"],
      default: "pending"
    },
    questionCount: { type: Number, default: 0 },
    maxQuestions: { type: Number, default: 2 },
    player1Score: { type: Number, default: 0 },
    player2Score: { type: Number, default: 0 }
  },
  { _id: false }
);

const participantSchema = new mongoose.Schema(
  {
    nickname: { type: String, required: true },
    score: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ["active", "eliminated", "winner"],
      default: "active"
    },
    streak: { type: Number, default: 0 }
  },
  { _id: false }
);

const battleStateSchema = new mongoose.Schema(
  {
    currentRound: { type: Number, default: 0 },
    currentQuestionIndex: { type: Number, default: 0 },
    currentQuestionInRound: { type: Number, default: 0 },
    questionsPerDuel: { type: Number, default: 2 },
    phase: {
      type: String,
      enum: ["lobby", "question", "roundResults", "finished"],
      default: "lobby"
    },
    duels: {
      type: [duelSchema],
      default: []
    },
    roundWinners: {
      type: [String],
      default: []
    },
    eliminatedPlayers: {
      type: [String],
      default: []
    },
    winner: { type: String, default: null }
  },
  { _id: false }
);

// =====================
// NEW: TACTICAL DUEL MODE
// =====================

const tacticalPlayerStateSchema = new mongoose.Schema(
  {
    nickname: { type: String, required: true },

    hp: { type: Number, default: 100 },

    guardValue: { type: Number, default: 0 }, // visible
    focusBonus: { type: Number, default: 0 }, // visible

    hasCounterAvailable: { type: Boolean, default: true }, // can still use counter
    hiddenCounterArmed: { type: Boolean, default: false }, // counter ready
    hiddenCounterStrength: { type: Number, default: 0 }, // stored value

    lastAction: {
      type: String,
      enum: ["strike", "guard", "focus", "recover", "counter", null],
      default: null
    },

    totalCorrectAnswers: { type: Number, default: 0 },
    totalResponseTime: { type: Number, default: 0 }
  },
  { _id: false }
);

const tacticalDuelSchema = new mongoose.Schema(
  {
    player1: { type: tacticalPlayerStateSchema, default: null },
    player2: { type: tacticalPlayerStateSchema, default: null },

    activeTurnPlayer: { type: String, default: null },

    phase: {
      type: String,
      enum: ["lobby", "actionSelection", "question", "resolution", "finished"],
      default: "lobby"
    },

    turnNumber: { type: Number, default: 1 },

    selectedAction: {
      type: String,
      enum: ["strike", "guard", "focus", "recover", "counter", null],
      default: null
    },

    currentQuestionIndex: { type: Number, default: null },
    currentQuestionId: { type: String, default: null },

    questionOrder: {
      type: [Number],
      default: []
    },

    questionCursor: { type: Number, default: 0 },

    startedAt: { type: Date, default: null },
    endsAt: { type: Date, default: null },
    timeLimitSeconds: { type: Number, default: 180 },

    battleLog: {
      type: [String],
      default: []
    },

    winner: { type: String, default: null }
  },
  { _id: false }
);

const tacticalDuelStateSchema = new mongoose.Schema(
  {
    duel: { type: tacticalDuelSchema, default: () => ({}) }
  },
  { _id: false }
);

// =====================
// SESSION
// =====================

const sessionSchema = new mongoose.Schema(
  {
    quizId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Quiz",
      required: true
    },
    accessCode: {
      type: String,
      required: true,
      unique: true
    },
    gameMode: {
      type: String,
      enum: ["classic", "battleRoyale", "tacticalDuel"],
      default: "classic"
    },
    participants: {
      type: [participantSchema],
      default: []
    },
    status: {
      type: String,
      enum: ["waiting", "live", "ended"],
      default: "waiting"
    },
    isActive: {
      type: Boolean,
      default: true
    },

    // EXISTING
    battleState: {
      type: battleStateSchema,
      default: () => ({})
    },

    // NEW
    tacticalDuelState: {
      type: tacticalDuelStateSchema,
      default: () => ({})
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Session", sessionSchema);
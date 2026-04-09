const mongoose = require("mongoose");

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
    }
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
      enum: ["classic", "battleRoyale"],
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
    battleState: {
      type: battleStateSchema,
      default: () => ({})
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Session", sessionSchema);
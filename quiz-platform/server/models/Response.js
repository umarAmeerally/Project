const mongoose = require("mongoose");

const responseSchema = new mongoose.Schema({
  participantNickname: {
    type: String,
    required: true
  },
  sessionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Session",
    required: true
  },
  questionId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  selectedAnswer: {
    type: Number,
    required: true
  },
  isCorrect: {
    type: Boolean,
    required: true
  },
  responseTime: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

module.exports = mongoose.model("Response", responseSchema);
const mongoose = require("mongoose");

const participantSchema = new mongoose.Schema({
  nickname: String,
  score: { type: Number, default: 0 }
});

const sessionSchema = new mongoose.Schema({
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
  participants: [participantSchema],
  status: {
    type: String,
    enum: ["waiting", "live", "ended"],
    default: "waiting"
  },
  isActive: {
    type: Boolean,
    default: true
  }
});

module.exports = mongoose.model("Session", sessionSchema);
const mongoose = require("mongoose");

const resumeReviewSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    resumeText: { type: String, required: true },
    fileName: String,
    feedback: { type: String, required: true },
    score: Number,
  },
  { timestamps: true }
);

module.exports = mongoose.model("ResumeReview", resumeReviewSchema);

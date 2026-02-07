const mongoose = require("mongoose");

const resumeReviewSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    resumeText: { type: String, required: true },
    jobDescription: String,
    fileName: String,
    feedback: { type: String, required: true },
    score: Number,
    overallScore: Number,
    atsScore: Number,
    analysis: mongoose.Schema.Types.Mixed,
  },
  { timestamps: true }
);

module.exports = mongoose.model("ResumeReview", resumeReviewSchema);

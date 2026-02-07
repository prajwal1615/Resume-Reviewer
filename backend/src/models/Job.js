const mongoose = require("mongoose");

const jobSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    company: String,
    role: String,
    jobDescription: String,
    pinned: {
      type: Boolean,
      default: false
    },
    interviewDate: Date,
    reminderAt: Date,
    status: {
      type: String,
      enum: ["Applied", "Interview", "Offer", "Rejected"],
      default: "Applied"
    },
    appliedDate: Date
  },
  { timestamps: true }
);

module.exports = mongoose.model("Job", jobSchema);

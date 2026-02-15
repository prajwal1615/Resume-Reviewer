const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    isBlocked: {
      type: Boolean,
      default: false,
    },
    title: String,
    location: String,
    phone: String,
    bio: String,
    website: String,
    linkedin: String,
    github: String,
    avatarUrl: String,
    avatarPublicId: String,
    themePreference: {
      type: String,
      enum: ["light", "dark"],
      default: "light"
    },
    languagePreference: {
      type: String,
      enum: ["en", "hi", "kn"],
      default: "en"
    },
    jobListView: {
      type: String,
      enum: ["cards", "table"],
      default: "cards"
    },
    isPremium: {
      type: Boolean,
      default: false
    },
    resumeReviewCount: {
      type: Number,
      default: 0
    },
    premiumUntil: {
      type: Date,
      default: null
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);

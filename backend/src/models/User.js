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
    isPremium: {
      type: Boolean,
      default: false
    },
    resumeReviewCount: {
      type: Number,
      default: 0
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);

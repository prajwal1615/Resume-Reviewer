const User = require("../models/User");
const ResetToken = require("../models/ResetToken");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

exports.register = async (req, res) => {
  const { name, email, password } = req.body;

  const userExists = await User.findOne({ email });
  if (userExists) {
    return res.status(400).json({ message: "User already exists" });
  }

  const user = await User.create({ name, email, password });

  res.status(201).json({ message: "User registered successfully" });
};

exports.login = async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user) return res.status(400).json({ message: "Invalid credentials" });

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

  const token = jwt.sign(
    { id: user._id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );

  res.json({ token });
};

exports.forgotPassword = async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });
  if (!user) {
    return res.status(200).json({ message: "If that email exists, we sent a reset link." });
  }
  const token = crypto.randomBytes(32).toString("hex");
  await ResetToken.create({
    userId: user._id,
    token,
    expiresAt: new Date(Date.now() + 60 * 60 * 1000),
  });
  const resetUrl = `${process.env.FRONTEND_URL || "http://localhost:5173"}/reset-password?token=${token}`;
  if (process.env.SMTP_HOST) {
    // TODO: Send email via nodemailer when SMTP is configured
    console.log("Reset link:", resetUrl);
  } else {
    console.log("Password reset link (add SMTP to send email):", resetUrl);
  }
  res.json({ message: "If that email exists, we sent a reset link." });
};

exports.resetPassword = async (req, res) => {
  const { token, password } = req.body;
  const resetDoc = await ResetToken.findOne({ token });
  if (!resetDoc || resetDoc.expiresAt < new Date()) {
    return res.status(400).json({ message: "Invalid or expired reset link" });
  }
  const user = await User.findById(resetDoc.userId);
  if (!user) return res.status(400).json({ message: "User not found" });
  user.password = password;
  await user.save();
  await ResetToken.deleteOne({ token });
  res.json({ message: "Password updated. You can now sign in." });
};

const User = require("../models/User");
const ResetToken = require("../models/ResetToken");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { sendPasswordResetEmail, smtpEnabled } = require("../services/mailer");

exports.register = async (req, res) => {
  const { name, email, password } = req.body;

  const userExists = await User.findOne({ email });
  if (userExists) {
    return res.status(400).json({ message: "User already exists" });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  await User.insertMany([{ name, email, password: hashedPassword }]);

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
  try {
    await sendPasswordResetEmail({ to: email, resetUrl });
  } catch (err) {
    if (!smtpEnabled()) {
      console.log("Password reset link (add SMTP to send email):", resetUrl);
      return res.status(503).json({
        message:
          "Email service is not configured. Set SMTP settings to send reset links.",
      });
    }
    console.error("Failed to send reset email:", err);
    return res.status(500).json({ message: "Failed to send reset email." });
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
  user.password = await bcrypt.hash(password, 10);
  await user.save();
  await ResetToken.deleteOne({ token });
  res.json({ message: "Password updated. You can now sign in." });
};

exports.testEmail = async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ message: "Email is required." });
  }
  const resetUrl = `${process.env.FRONTEND_URL || "http://localhost:5173"}/reset-password?token=test-token`;
  try {
    await sendPasswordResetEmail({ to: email, resetUrl });
    res.json({ message: "Test email sent." });
  } catch (err) {
    if (!smtpEnabled()) {
      return res.status(503).json({
        message:
          "Email service is not configured. Set SMTP settings to send emails.",
      });
    }
    console.error("Failed to send test email:", err);
    res.status(500).json({ message: "Failed to send test email." });
  }
};

const Job = require("../models/Job");
const User = require("../models/User");

const FREE_JOB_LIMIT = 10;

exports.createJob = async (req, res) => {
  const user = await User.findById(req.user.id).select("role isPremium premiumUntil");
  if (!user) {
    return res.status(404).json({ message: "User not found." });
  }

  const isAdmin = user.role === "admin";
  const premiumActive =
    user.isPremium && (!user.premiumUntil || user.premiumUntil > new Date());

  if (!isAdmin && !premiumActive) {
    const count = await Job.countDocuments({ userId: req.user.id });
    if (count >= FREE_JOB_LIMIT) {
      return res.status(402).json({
        message: `Free job limit reached (${FREE_JOB_LIMIT}). Upgrade to Premium for unlimited jobs.`,
        requiresPremium: true,
        reason: "job_limit_reached",
        freeJobLimit: FREE_JOB_LIMIT,
      });
    }
  }

  const company = String(req.body.company || "").trim();
  const role = String(req.body.role || "").trim();
  if (company && role) {
    const existing = await Job.findOne({
      userId: req.user.id,
      company: { $regex: `^${company}$`, $options: "i" },
      role: { $regex: `^${role}$`, $options: "i" },
    });
    if (existing) {
      return res.status(409).json({
        message: "Duplicate job detected for this company and role.",
      });
    }
  }

  const job = await Job.create({
    ...req.body,
    userId: req.user.id,
    company,
    role,
  });
  res.status(201).json(job);
};

exports.getJobs = async (req, res) => {
  const { q } = req.query;
  const filter = { userId: req.user.id };

  if (q) {
    const escapeRegExp = (value) =>
      value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const term = escapeRegExp(String(q).trim());
    if (term) {
      filter.$or = [
        { company: { $regex: term, $options: "i" } },
        { role: { $regex: term, $options: "i" } },
        { jobDescription: { $regex: term, $options: "i" } },
      ];
    }
  }

  const jobs = await Job.find(filter);
  res.json(jobs);
};

exports.updateJob = async (req, res) => {
  const update = { ...req.body };
  if (update.reminderAt === null || update.reminderAt === "") {
    update.reminderAt = null;
    update.lastSnoozeDays = null;
  }
  const job = await Job.findOneAndUpdate(
    { _id: req.params.id, userId: req.user.id },
    update,
    { new: true }
  );
  res.json(job);
};

exports.deleteJob = async (req, res) => {
  await Job.findOneAndDelete({
    _id: req.params.id,
    userId: req.user.id
  });
  res.json({ message: "Job deleted" });
};

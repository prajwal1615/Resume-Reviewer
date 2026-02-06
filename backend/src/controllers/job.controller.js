const Job = require("../models/Job");

exports.createJob = async (req, res) => {
  const job = await Job.create({
    ...req.body,
    userId: req.user.id
  });
  res.status(201).json(job);
};

exports.getJobs = async (req, res) => {
  const jobs = await Job.find({ userId: req.user.id });
  res.json(jobs);
};

exports.updateJob = async (req, res) => {
  const job = await Job.findOneAndUpdate(
    { _id: req.params.id, userId: req.user.id },
    req.body,
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

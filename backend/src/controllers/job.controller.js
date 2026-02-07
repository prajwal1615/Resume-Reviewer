const Job = require("../models/Job");

exports.createJob = async (req, res) => {
  const job = await Job.create({
    ...req.body,
    userId: req.user.id
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

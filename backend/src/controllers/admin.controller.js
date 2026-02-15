const mongoose = require("mongoose");
const User = require("../models/User");

exports.listUsers = async (req, res) => {
  const q = String(req.query.q || "").trim();
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);

  const filter = {};
  if (q) {
    filter.$or = [
      { name: { $regex: q, $options: "i" } },
      { email: { $regex: q, $options: "i" } },
    ];
  }

  const [items, total] = await Promise.all([
    User.find(filter)
      .select("name email role isBlocked isPremium createdAt updatedAt")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    User.countDocuments(filter),
  ]);

  res.json({
    items,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.max(Math.ceil(total / limit), 1),
    },
  });
};

exports.updateUserBlockStatus = async (req, res) => {
  const { id } = req.params;
  const blocked = req.body?.blocked;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "Invalid user id." });
  }
  if (typeof blocked !== "boolean") {
    return res.status(400).json({ message: "`blocked` must be a boolean." });
  }
  if (req.user.id === id && blocked) {
    return res.status(400).json({ message: "You cannot block your own account." });
  }

  const user = await User.findByIdAndUpdate(
    id,
    { isBlocked: blocked },
    { new: true }
  ).select("name email role isBlocked isPremium createdAt updatedAt");

  if (!user) {
    return res.status(404).json({ message: "User not found." });
  }

  res.json({ message: blocked ? "User blocked." : "User unblocked.", user });
};

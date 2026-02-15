const User = require("../models/User");

const requireAdmin = async (req, res, next) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const user = await User.findById(req.user.id).select("role isBlocked");
    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    if (user.isBlocked) {
      return res.status(403).json({ message: "Your account is blocked." });
    }
    if (user.role !== "admin") {
      return res.status(403).json({ message: "Admin access required." });
    }

    next();
  } catch (err) {
    console.error("[requireAdmin] error:", err);
    res.status(500).json({ message: "Authorization failed." });
  }
};

module.exports = requireAdmin;

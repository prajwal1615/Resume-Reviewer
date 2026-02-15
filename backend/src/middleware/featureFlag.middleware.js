const { isFeatureEnabled } = require("../services/featureFlags");
const User = require("../models/User");

const requireFeatureFlag = (flagKey) => async (req, res, next) => {
  try {
    if (req.user?.id) {
      const user = await User.findById(req.user.id).select("role").lean();
      if (user?.role === "admin") {
        return next();
      }
    }

    const enabled = await isFeatureEnabled(flagKey);
    if (!enabled) {
      return res.status(403).json({
        message: "This feature is currently disabled.",
        featureDisabled: true,
        featureKey: flagKey,
      });
    }
    next();
  } catch (err) {
    console.error("[requireFeatureFlag] error:", err);
    res.status(500).json({ message: "Failed to validate feature access." });
  }
};

module.exports = requireFeatureFlag;

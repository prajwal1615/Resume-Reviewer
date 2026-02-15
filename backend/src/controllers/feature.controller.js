const { getFeatureFlags } = require("../services/featureFlags");

exports.listFeatureFlags = async (req, res) => {
  const { map } = await getFeatureFlags();
  res.json({ flags: map });
};

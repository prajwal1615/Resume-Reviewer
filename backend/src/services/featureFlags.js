const FeatureFlag = require("../models/FeatureFlag");

const FEATURE_FLAG_DEFINITIONS = {
  resume_review: {
    enabled: true,
    description: "Enable resume review in UI and API.",
  },
  chat_widget: {
    enabled: true,
    description: "Enable chatbot widget in UI.",
  },
  premium_pricing: {
    enabled: true,
    description: "Enable pricing and premium upgrade UI.",
  },
};

const getFeatureFlagDefaults = () =>
  Object.entries(FEATURE_FLAG_DEFINITIONS).map(([key, value]) => ({
    key,
    enabled: value.enabled,
    description: value.description,
  }));

const isKnownFeatureFlag = (key) => Boolean(FEATURE_FLAG_DEFINITIONS[key]);

const getFeatureFlags = async () => {
  const docs = await FeatureFlag.find({}).select("key enabled description updatedAt").lean();
  const byKey = new Map(docs.map((doc) => [doc.key, doc]));
  const defaults = getFeatureFlagDefaults();

  const items = defaults.map((def) => {
    const existing = byKey.get(def.key);
    return {
      key: def.key,
      enabled: existing ? existing.enabled : def.enabled,
      description: existing?.description || def.description,
      updatedAt: existing?.updatedAt || null,
    };
  });

  const map = items.reduce((acc, item) => {
    acc[item.key] = item.enabled;
    return acc;
  }, {});

  return { items, map };
};

const isFeatureEnabled = async (key) => {
  if (!isKnownFeatureFlag(key)) return true;
  const doc = await FeatureFlag.findOne({ key }).select("enabled").lean();
  if (!doc) return FEATURE_FLAG_DEFINITIONS[key].enabled;
  return Boolean(doc.enabled);
};

const setFeatureFlag = async (key, enabled) => {
  if (!isKnownFeatureFlag(key)) {
    throw new Error("Unknown feature flag.");
  }

  const defaults = FEATURE_FLAG_DEFINITIONS[key];
  const doc = await FeatureFlag.findOneAndUpdate(
    { key },
    {
      $set: {
        enabled,
        description: defaults.description,
      },
    },
    { new: true, upsert: true }
  ).lean();

  return doc;
};

module.exports = {
  FEATURE_FLAG_DEFINITIONS,
  getFeatureFlags,
  isFeatureEnabled,
  isKnownFeatureFlag,
  setFeatureFlag,
};

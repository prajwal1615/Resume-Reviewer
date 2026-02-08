const User = require("../models/User");
const { cloudinary, hasCloudinary } = require("../config/cloudinary");

const pickProfileFields = (body) => ({
  name: body.name,
  title: body.title,
  location: body.location,
  phone: body.phone,
  bio: body.bio,
  website: body.website,
  linkedin: body.linkedin,
  github: body.github,
});

exports.getMe = async (req, res) => {
  const user = await User.findById(req.user.id).select("-password");
  if (!user) return res.status(404).json({ message: "User not found" });
  res.json(user);
};

exports.updateProfile = async (req, res) => {
  const updates = pickProfileFields(req.body || {});
  Object.keys(updates).forEach((key) => {
    if (updates[key] === undefined) delete updates[key];
  });

  const user = await User.findByIdAndUpdate(req.user.id, updates, {
    new: true,
    runValidators: true,
  }).select("-password");

  res.json(user);
};

exports.updateThemePreference = async (req, res) => {
  const theme = String(req.body?.theme || "").toLowerCase();
  if (!["light", "dark"].includes(theme)) {
    return res.status(400).json({ message: "Invalid theme preference." });
  }

  const user = await User.findByIdAndUpdate(
    req.user.id,
    { themePreference: theme },
    { new: true }
  ).select("-password");

  res.json({ themePreference: user.themePreference });
};

exports.updateLanguagePreference = async (req, res) => {
  const language = String(req.body?.language || "").toLowerCase();
  if (!["en", "hi", "kn"].includes(language)) {
    return res.status(400).json({ message: "Invalid language preference." });
  }

  const user = await User.findByIdAndUpdate(
    req.user.id,
    { languagePreference: language },
    { new: true }
  ).select("-password");

  res.json({ languagePreference: user.languagePreference });
};

exports.uploadAvatar = async (req, res) => {
  if (!hasCloudinary) {
    return res.status(503).json({
      message:
        "Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET.",
    });
  }

  if (!req.file) {
    return res.status(400).json({ message: "Avatar image is required." });
  }

  const dataUri = `data:${req.file.mimetype};base64,${req.file.buffer.toString(
    "base64"
  )}`;

  const existing = await User.findById(req.user.id).select("avatarPublicId");
  if (existing?.avatarPublicId) {
    try {
      await cloudinary.uploader.destroy(existing.avatarPublicId);
    } catch (err) {
      console.error("[avatar] failed to delete previous image:", err.message);
    }
  }

  const upload = await cloudinary.uploader.upload(dataUri, {
    folder: "jobflow/avatars",
    resource_type: "image",
    transformation: [
      { width: 300, height: 300, crop: "fill", gravity: "face" },
      { quality: "auto", fetch_format: "auto" },
    ],
  });

  const user = await User.findByIdAndUpdate(
    req.user.id,
    {
      avatarUrl: upload.secure_url,
      avatarPublicId: upload.public_id,
    },
    { new: true }
  ).select("-password");

  res.json(user);
};

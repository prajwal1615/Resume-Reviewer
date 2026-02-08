const express = require("express");
const multer = require("multer");
const auth = require("../middleware/auth.middleware");
const {
  getMe,
  updateProfile,
  uploadAvatar,
  updateThemePreference,
} = require("../controllers/user.controller");

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype?.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"), false);
    }
  },
});

router.use(auth);

router.get("/me", getMe);
router.put("/me", updateProfile);
router.put("/me/theme", updateThemePreference);
router.post("/me/avatar", (req, res, next) => {
  upload.single("avatar")(req, res, (err) => {
    if (err) {
      return res.status(400).json({ message: err.message || "Upload failed" });
    }
    next();
  });
}, uploadAvatar);

module.exports = router;

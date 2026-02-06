const express = require("express");
const multer = require("multer");
const auth = require("../middleware/auth.middleware");
const { analyzeResume, getReviews } = require("../controllers/resume.controller");

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "application/pdf") {
      cb(null, true);
    } else {
      cb(new Error("Only PDF files are allowed"), false);
    }
  },
});

router.use(auth);

router.post("/analyze", (req, res, next) => {
  upload.single("file")(req, res, (err) => {
    if (err) {
      return res.status(400).json({ message: err.message || "File upload failed" });
    }
    next();
  });
}, analyzeResume);
router.post("/analyze-text", analyzeResume);
router.get("/reviews", getReviews);

module.exports = router;

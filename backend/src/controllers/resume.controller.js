const ResumeReview = require("../models/ResumeReview");
const User = require("../models/User");
const pdfParseModule = require("pdf-parse");

const extractPdfText = async (buffer) => {
  if (typeof pdfParseModule === "function") {
    const data = await pdfParseModule(buffer);
    return data.text;
  }

  const PDFParseClass =
    pdfParseModule?.PDFParse || pdfParseModule?.default?.PDFParse;
  if (typeof PDFParseClass === "function") {
    const parser = new PDFParseClass({ data: buffer });
    const result = await parser.getText();
    if (typeof parser.destroy === "function") {
      await parser.destroy();
    }
    return result.text;
  }

  throw new Error("pdf-parse import failed: unsupported module shape");
};
const { generateAnalysis } = require("../services/aiClient");

exports.analyzeResume = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("isPremium resumeReviewCount");
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }
    if (!user.isPremium) {
      let used = Number.isFinite(user.resumeReviewCount) ? user.resumeReviewCount : 0;
      if (!Number.isFinite(user.resumeReviewCount)) {
        used = await ResumeReview.countDocuments({ userId: req.user.id });
        user.resumeReviewCount = used;
        await user.save();
      }
      if (used >= 1) {
        return res.status(402).json({
          message: "Free resume review limit reached. Please upgrade to Premium.",
          requiresPremium: true,
        });
      }
    }

    let resumeText = req.body.text || "";
    const jobDescription =
      req.body.jobDescription || req.body.job_description || "";

    if (req.file) {
      const buffer = req.file.buffer;
      resumeText = await extractPdfText(buffer);
    }

    if (!resumeText || resumeText.trim().length < 50) {
      return res.status(400).json({
        message: "Resume text is too short. Please upload a PDF or paste more content.",
      });
    }

    const { analysis, feedback } = await generateAnalysis({
      resumeText,
      jobDescription,
    });

    const overallScore = analysis?.overall_score ?? null;
    const atsScore = analysis?.ats_score ?? null;

    const review = await ResumeReview.create({
      userId: req.user.id,
      resumeText: resumeText.slice(0, 5000),
      jobDescription: jobDescription ? jobDescription.slice(0, 5000) : undefined,
      fileName: req.file?.originalname,
      feedback,
      score: overallScore,
      overallScore,
      atsScore,
      analysis,
    });

    if (!user.isPremium) {
      await User.findByIdAndUpdate(req.user.id, { $inc: { resumeReviewCount: 1 } });
    }

    res.json({
      feedback,
      score: overallScore,
      overallScore,
      atsScore,
      analysis,
      reviewId: review._id,
      remainingFreeReviews: user.isPremium ? null : 0,
    });
  } catch (err) {
    console.error("Resume analysis error:", err);
    const message = err.message || "Failed to analyze resume";
    const status = /not configured/i.test(message) ? 503 : 500;
    res.status(status).json({ message });
  }
};

exports.getReviews = async (req, res) => {
  const reviews = await ResumeReview.find({ userId: req.user.id })
    .sort({ createdAt: -1 })
    .limit(20)
    .select("fileName feedback score overallScore atsScore createdAt");
  res.json(reviews);
};

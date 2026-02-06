const ResumeReview = require("../models/ResumeReview");
const pdfParse = require("pdf-parse");
const { OpenAI } = require("openai");

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

const ANALYSIS_PROMPT = `You are an expert career coach and resume reviewer. Analyze this resume and provide:
1. **Overall Score** (1-10) - Rate the resume quality
2. **Strengths** - 3-5 things the candidate did well
3. **Areas for Improvement** - 3-5 specific, actionable suggestions
4. **Keyword Optimization** - Suggest relevant keywords for ATS (Applicant Tracking Systems)
5. **Formatting Tips** - Any layout or structure improvements

Be constructive, professional, and specific. Format your response in clear sections with bullet points.`;

exports.analyzeResume = async (req, res) => {
  try {
    let resumeText = req.body.text || "";

    if (req.file) {
      const buffer = req.file.buffer;
      const data = await pdfParse(buffer);
      resumeText = data.text;
    }

    if (!resumeText || resumeText.trim().length < 50) {
      return res.status(400).json({
        message: "Resume text is too short. Please upload a PDF or paste more content.",
      });
    }

    if (!openai) {
      return res.status(503).json({
        message:
          "AI analysis is not configured. Add OPENAI_API_KEY to your server environment.",
      });
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: ANALYSIS_PROMPT,
        },
        {
          role: "user",
          content: `Analyze this resume:\n\n${resumeText.slice(0, 12000)}`,
        },
      ],
      temperature: 0.7,
    });

    const feedback = completion.choices[0]?.message?.content || "No feedback generated.";
    const scoreMatch = feedback.match(/\*\*Overall Score\*\*[^\d]*(\d+)/i) ||
      feedback.match(/(?:score|rate)[^\d]*(\d+)/i);
    const score = scoreMatch ? parseInt(scoreMatch[1], 10) : null;

    const review = await ResumeReview.create({
      userId: req.user.id,
      resumeText: resumeText.slice(0, 5000),
      fileName: req.file?.originalname,
      feedback,
      score,
    });

    res.json({
      feedback,
      score,
      reviewId: review._id,
    });
  } catch (err) {
    console.error("Resume analysis error:", err);
    res.status(500).json({
      message: err.message || "Failed to analyze resume",
    });
  }
};

exports.getReviews = async (req, res) => {
  const reviews = await ResumeReview.find({ userId: req.user.id })
    .sort({ createdAt: -1 })
    .limit(20)
    .select("fileName feedback score createdAt");
  res.json(reviews);
};

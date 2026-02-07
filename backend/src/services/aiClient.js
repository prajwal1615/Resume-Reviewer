const { OpenAI } = require("openai");
let GoogleGenerativeAI;

try {
  ({ GoogleGenerativeAI } = require("@google/generative-ai"));
} catch (err) {
  GoogleGenerativeAI = null;
}

const providerFromEnv = process.env.AI_PROVIDER?.toLowerCase();
const hasOpenAI = Boolean(process.env.OPENAI_API_KEY);
const hasGemini = Boolean(process.env.GEMINI_API_KEY);

const provider =
  providerFromEnv || (hasOpenAI ? "openai" : hasGemini ? "gemini" : null);

const openai =
  provider === "openai" && hasOpenAI
    ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
    : null;

const gemini =
  provider === "gemini" && hasGemini && GoogleGenerativeAI
    ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
    : null;

const DEFAULT_OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";
const DEFAULT_GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-1.5-flash";

const clampInt = (value, min, max) => {
  const num = Number(value);
  if (!Number.isFinite(num)) return null;
  return Math.min(max, Math.max(min, Math.round(num)));
};

const stripCodeFences = (text) =>
  text.replace(/```(?:json)?/gi, "").replace(/```/g, "").trim();

const extractJson = (text) => {
  if (!text) return null;
  const cleaned = stripCodeFences(text);
  const first = cleaned.indexOf("{");
  const last = cleaned.lastIndexOf("}");
  if (first === -1 || last === -1 || last <= first) return null;
  const slice = cleaned.slice(first, last + 1);
  try {
    return JSON.parse(slice);
  } catch {
    return null;
  }
};

const normalizeAnalysis = (raw, hasJobDescription) => {
  if (!raw || typeof raw !== "object") return null;

  const overallScore =
    clampInt(raw.overall_score ?? raw.overallScore ?? raw.score, 0, 100) ?? null;
  const atsScore = hasJobDescription
    ? clampInt(raw.ats_score ?? raw.atsScore, 0, 100)
    : null;

  const normalizeArray = (value) =>
    Array.isArray(value) ? value.filter(Boolean).map(String) : [];

  return {
    overall_score: overallScore,
    ats_score: atsScore,
    summary: raw.summary ? String(raw.summary) : "",
    strengths: normalizeArray(raw.strengths),
    improvements: normalizeArray(raw.improvements),
    missing_keywords: normalizeArray(raw.missing_keywords),
    matching_keywords: normalizeArray(raw.matching_keywords),
    formatting_tips: normalizeArray(raw.formatting_tips),
    action_plan: normalizeArray(raw.action_plan),
  };
};

const formatFeedback = (analysis) => {
  if (!analysis) return "";
  const lines = [];
  if (analysis.overall_score !== null) {
    lines.push(`Overall Score: ${analysis.overall_score}/100`);
  }
  if (analysis.ats_score !== null) {
    lines.push(`ATS Match Score: ${analysis.ats_score}/100`);
  }
  if (analysis.summary) {
    lines.push("", "Summary:", analysis.summary);
  }
  const pushSection = (label, items) => {
    if (!items?.length) return;
    lines.push("", `${label}:`);
    items.forEach((item) => lines.push(`- ${item}`));
  };
  pushSection("Strengths", analysis.strengths);
  pushSection("Improvements", analysis.improvements);
  pushSection("Missing Keywords", analysis.missing_keywords);
  pushSection("Matching Keywords", analysis.matching_keywords);
  pushSection("Formatting Tips", analysis.formatting_tips);
  pushSection("Action Plan", analysis.action_plan);
  return lines.join("\n");
};

const buildPrompt = ({ resumeText, jobDescription }) => {
  const hasJobDescription = Boolean(jobDescription?.trim());
  return `You are an expert career coach and ATS resume reviewer.
Return ONLY valid JSON with the schema below. Do not include markdown or code fences.

Schema:
{
  "overall_score": number, // 0-100
  "ats_score": number | null, // 0-100 if job description provided
  "summary": string,
  "strengths": string[],
  "improvements": string[],
  "missing_keywords": string[],
  "matching_keywords": string[],
  "formatting_tips": string[],
  "action_plan": string[]
}

Rules:
- Be specific, concise, and actionable.
- If no job description is provided, set ats_score to null and missing/matching keywords to [].
- Focus on changes that improve ATS compatibility and recruiter readability.

RESUME:
${resumeText}

JOB_DESCRIPTION:
${hasJobDescription ? jobDescription : "N/A"}`;
};

const generateWithOpenAI = async ({ resumeText, jobDescription }) => {
  if (!openai) {
    throw new Error("OpenAI client not configured.");
  }

  const systemPrompt = `You are an expert career coach and ATS resume reviewer.
Return only valid JSON. Do not include markdown or code fences.`;

  const userPrompt = buildPrompt({ resumeText, jobDescription });

  const completion = await openai.chat.completions.create({
    model: DEFAULT_OPENAI_MODEL,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    temperature: 0.5,
    max_tokens: 900,
  });

  const rawText = completion.choices[0]?.message?.content?.trim() || "";
  return { rawText, model: DEFAULT_OPENAI_MODEL, provider: "openai" };
};

const generateWithGemini = async ({ resumeText, jobDescription }) => {
  if (!gemini) {
    throw new Error(
      "Gemini client not configured. Install @google/generative-ai and set GEMINI_API_KEY."
    );
  }

  const model = gemini.getGenerativeModel({ model: DEFAULT_GEMINI_MODEL });
  const prompt = buildPrompt({ resumeText, jobDescription });
  const result = await model.generateContent({
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.5,
      maxOutputTokens: 900,
    },
  });

  const rawText = result?.response?.text?.() || "";
  return { rawText, model: DEFAULT_GEMINI_MODEL, provider: "gemini" };
};

const generateAnalysis = async ({ resumeText, jobDescription }) => {
  if (!provider) {
    throw new Error(
      "AI provider not configured. Set OPENAI_API_KEY or GEMINI_API_KEY."
    );
  }

  const trimmedResume = resumeText.trim().slice(0, 12000);
  const trimmedJD = jobDescription ? jobDescription.trim().slice(0, 8000) : "";

  const generate =
    provider === "gemini" ? generateWithGemini : generateWithOpenAI;
  const { rawText, model, provider: usedProvider } = await generate({
    resumeText: trimmedResume,
    jobDescription: trimmedJD,
  });

  const analysis = normalizeAnalysis(
    extractJson(rawText),
    Boolean(trimmedJD)
  );
  const feedback = analysis ? formatFeedback(analysis) : rawText || "";

  return {
    provider: usedProvider,
    model,
    rawText,
    analysis,
    feedback,
  };
};

module.exports = {
  generateAnalysis,
};

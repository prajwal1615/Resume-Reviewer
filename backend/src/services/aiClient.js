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
const DEFAULT_GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";

const clampInt = (value, min, max) => {
  const num = Number(value);
  if (!Number.isFinite(num)) return null;
  return Math.min(max, Math.max(min, Math.round(num)));
};

const stripCodeFences = (text) =>
  text.replace(/```(?:json)?/gi, "").replace(/```/g, "").trim();

const extractBalancedJson = (text) => {
  const cleaned = stripCodeFences(text);
  const start = cleaned.indexOf("{");
  if (start === -1) return null;

  let depth = 0;
  let inString = false;
  let escape = false;

  for (let i = start; i < cleaned.length; i += 1) {
    const ch = cleaned[i];
    if (inString) {
      if (escape) {
        escape = false;
      } else if (ch === "\\") {
        escape = true;
      } else if (ch === "\"") {
        inString = false;
      }
      continue;
    }

    if (ch === "\"") {
      inString = true;
      continue;
    }

    if (ch === "{") depth += 1;
    if (ch === "}") {
      depth -= 1;
      if (depth === 0) {
        const slice = cleaned.slice(start, i + 1);
        try {
          return JSON.parse(slice);
        } catch {
          return null;
        }
      }
    }
  }

  return null;
};

const extractJson = (text) => {
  if (!text) return null;
  const balanced = extractBalancedJson(text);
  if (balanced) return balanced;

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

const extractLooseAnalysis = (text, hasJobDescription) => {
  if (!text) return null;
  const cleaned = text.replace(/\\"/g, "\"");
  const overallMatch = cleaned.match(/"overall_score"\s*:\s*(\d+)/i);
  const atsMatch = cleaned.match(/"ats_score"\s*:\s*(\d+)/i);
  const overallScore = overallMatch ? clampInt(overallMatch[1], 0, 100) : null;
  const atsScore = hasJobDescription
    ? atsMatch
      ? clampInt(atsMatch[1], 0, 100)
      : null
    : null;

  if (overallScore === null && atsScore === null) return null;

  const summaryMatch = cleaned.match(/"summary"\s*:\s*"([^"]*)/i);
  const summary = summaryMatch ? summaryMatch[1].trim() : "";

  return {
    overall_score: overallScore,
    ats_score: atsScore,
    summary,
    strengths: [],
    improvements: [],
    missing_keywords: [],
    matching_keywords: [],
    formatting_tips: [],
    action_plan: [],
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
- Provide 3-5 items for strengths, improvements, missing_keywords, matching_keywords, formatting_tips, and action_plan.
- If no job description is provided, set ats_score to null and missing/matching keywords to [].
- Focus on changes that improve ATS compatibility and recruiter readability.

RESUME:
${resumeText}

JOB_DESCRIPTION:
${hasJobDescription ? jobDescription : "N/A"}`;
};

const extractResponseText = (response) => {
  if (!response) return "";
  if (response.output_text) return String(response.output_text).trim();
  if (response.outputText) return String(response.outputText).trim();

  const output = Array.isArray(response.output) ? response.output : [];
  const chunks = [];
  let refusal = "";

  output.forEach((item) => {
    if (item?.text) {
      chunks.push(String(item.text));
      return;
    }
    if (item?.type === "output_text" && item?.text) {
      chunks.push(String(item.text));
      return;
    }
    const content = Array.isArray(item?.content) ? item.content : [];
    content.forEach((part) => {
      if (part?.text) {
        chunks.push(String(part.text));
      } else if (part?.type === "output_text" && part?.text) {
        chunks.push(String(part.text));
      } else if (part?.type === "refusal" && part?.refusal) {
        refusal = String(part.refusal);
      }
    });
  });

  if (chunks.length) return chunks.join("\n").trim();
  if (refusal) return refusal.trim();
  return "";
};

const generateWithOpenAI = async ({ resumeText, jobDescription }) => {
  if (!openai) {
    throw new Error("OpenAI client not configured.");
  }

  const systemPrompt = `You are an expert career coach and ATS resume reviewer.
Return only valid JSON. Do not include markdown or code fences.`;

  const userPrompt = buildPrompt({ resumeText, jobDescription });

  const isGpt5 = /^gpt-5/i.test(DEFAULT_OPENAI_MODEL);
  let rawText = "";

  if (isGpt5) {
    const response = await openai.responses.create({
      model: DEFAULT_OPENAI_MODEL,
      input: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      reasoning: { effort: "minimal" },
      max_output_tokens: 1200,
      text: { format: { type: "json_object" } },
    });
    rawText = extractResponseText(response);
    if (!rawText) {
      console.error("[openai] empty response", {
        id: response?.id,
        output: response?.output,
      });
      // Fallback to Chat Completions for GPT-5 models if Responses returns no text.
      const fallback = await openai.chat.completions.create({
        model: DEFAULT_OPENAI_MODEL,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        reasoning: { effort: "minimal" },
        response_format: { type: "json_object" },
        max_completion_tokens: 900,
      });
      rawText = fallback.choices[0]?.message?.content?.trim() || "";
    }
  } else {
    const completion = await openai.chat.completions.create({
      model: DEFAULT_OPENAI_MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.5,
      response_format: { type: "json_object" },
      max_tokens: 900,
    });
    rawText = completion.choices[0]?.message?.content?.trim() || "";
  }

  if (!rawText) {
    throw new Error("OpenAI response was empty.");
  }
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
      temperature: 0.4,
      maxOutputTokens: 2000,
      responseMimeType: "application/json",
    },
  });

  const candidate = result?.response?.candidates?.[0];
  const parts = Array.isArray(candidate?.content?.parts)
    ? candidate.content.parts
    : [];
  const rawText =
    parts.map((part) => part?.text || "").join("").trim() ||
    result?.response?.text?.() ||
    "";

  if (!rawText) {
    console.error("[gemini] empty response", {
      finishReason: candidate?.finishReason,
      safetyRatings: candidate?.safetyRatings,
    });
  }
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

  let analysis = normalizeAnalysis(extractJson(rawText), Boolean(trimmedJD));
  if (!analysis) {
    analysis = extractLooseAnalysis(rawText, Boolean(trimmedJD));
  }
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

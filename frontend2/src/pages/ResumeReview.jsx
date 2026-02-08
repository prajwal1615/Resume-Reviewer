import { useState, useRef } from "react";
import api from "../api/axios";

export default function ResumeReview() {
  const [mode, setMode] = useState("upload");
  const [file, setFile] = useState(null);
  const [text, setText] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const fileInputRef = useRef(null);

  const normalizeScore = (value) =>
    Number.isFinite(value) ? Math.max(0, Math.min(100, value)) : null;

  const renderList = (items, emptyLabel) => {
    if (!items || items.length === 0) {
      return <p className="text-sm text-slate-500 dark:text-slate-400">{emptyLabel}</p>;
    }
    return (
      <ul className="mt-2 list-disc pl-5 text-slate-700 dark:text-slate-200">
        {items.map((item, idx) => (
          <li key={`${emptyLabel}-${idx}`}>{item}</li>
        ))}
      </ul>
    );
  };

  const renderChips = (items, emptyLabel) => {
    if (!items || items.length === 0) {
      return <p className="text-sm text-slate-500 dark:text-slate-400">{emptyLabel}</p>;
    }
    return (
      <div className="mt-3 flex flex-wrap gap-2">
        {items.map((item, idx) => (
          <span
            key={`${emptyLabel}-chip-${idx}`}
            className="rounded-full border border-slate-300 bg-slate-100 px-3 py-1 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          >
            {item}
          </span>
        ))}
      </div>
    );
  };

  const handleFileChange = (e) => {
    const f = e.target.files?.[0];
    if (f && f.type === "application/pdf") {
      setFile(f);
      setError("");
    } else {
      setFile(null);
      setError("Please select a PDF file");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setResult(null);
    setLoading(true);

    try {
      if (jobDescription.trim().length < 50) {
        setError("Please paste at least 50 characters of the job description");
        setLoading(false);
        return;
      }
      if (mode === "upload" && file) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("jobDescription", jobDescription.trim());
        const res = await api.post("/resume/analyze", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        setResult(res.data);
      } else if (mode === "paste" && text.trim().length >= 50) {
        const res = await api.post("/resume/analyze-text", {
          text: text.trim(),
          jobDescription: jobDescription.trim(),
        });
        setResult(res.data);
      } else {
        setError(
          mode === "paste"
            ? "Please paste at least 50 characters of your resume"
            : "Please select a PDF file"
        );
      }
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to analyze resume. Make sure OPENAI_API_KEY is set on the server."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-white to-primary-100/40 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Resume Review</h1>
          <p className="text-slate-600 mt-1 dark:text-slate-300">
            Get AI-powered feedback to improve your resume
          </p>
        </div>

        <div className="flex gap-2 mb-6">
          <button
            onClick={() => {
              setMode("upload");
              setFile(null);
              setText("");
              setError("");
              setResult(null);
            }}
            className={`px-4 py-2 rounded-full font-medium transition-all ${
              mode === "upload"
                ? "bg-primary-600 text-white shadow-md shadow-primary-200"
                : "bg-white/80 text-slate-700 hover:bg-white border border-slate-200 dark:bg-slate-900 dark:text-slate-200 dark:border-slate-800 dark:hover:bg-slate-800"
            }`}
          >
            Upload PDF
          </button>
          <button
            onClick={() => {
              setMode("paste");
              setFile(null);
              setError("");
              setResult(null);
            }}
            className={`px-4 py-2 rounded-full font-medium transition-all ${
              mode === "paste"
                ? "bg-primary-600 text-white shadow-md shadow-primary-200"
                : "bg-white/80 text-slate-700 hover:bg-white border border-slate-200 dark:bg-slate-900 dark:text-slate-200 dark:border-slate-800 dark:hover:bg-slate-800"
            }`}
          >
            Paste Text
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-3xl border border-slate-200/80 bg-white/90 p-8 shadow-[0_12px_40px_rgba(15,23,42,0.08)] mb-8 dark:border-slate-800 dark:bg-slate-900/90"
        >
          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">
              Job Description
            </label>
            <textarea
              className="input-field min-h-[160px] resize-y bg-white dark:bg-slate-900"
              placeholder="Paste the job description here..."
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
            />
          </div>
          {mode === "upload" ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-300 rounded-3xl p-10 text-center cursor-pointer hover:border-primary-400 hover:bg-primary-50/40 transition-all bg-white dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800/80"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                onChange={handleFileChange}
                className="hidden"
              />
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-primary-100/70 flex items-center justify-center shadow-inner dark:bg-slate-800">
                <svg
                  className="w-8 h-8 text-primary-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
              </div>
              <p className="font-medium text-slate-800 dark:text-slate-100">
                {file ? file.name : "Click to upload your resume (PDF)"}
              </p>
              <p className="text-sm text-slate-500 mt-1 dark:text-slate-400">Max 5MB</p>
            </div>
          ) : (
            <textarea
              className="input-field min-h-[200px] resize-y bg-white dark:bg-slate-900"
              placeholder="Paste your resume text here..."
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
          )}

          {error && (
            <div className="mt-4 p-4 rounded-2xl bg-red-50 text-red-600 text-sm border border-red-100 dark:bg-red-900/30 dark:text-red-200 dark:border-red-900/40">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary mt-6 w-full sm:w-auto disabled:opacity-60 shadow-md shadow-primary-200"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Analyzing...
              </span>
            ) : (
              "Analyze Resume"
            )}
          </button>
        </form>

        {result && (
          <div className="rounded-3xl border border-slate-200/80 bg-white/95 p-8 shadow-[0_12px_40px_rgba(15,23,42,0.08)] animate-slide-up dark:border-slate-800 dark:bg-slate-900/95">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">AI Feedback</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Detailed review based on your resume and job description
                </p>
              </div>
            </div>

            {result.analysis ? (
              <div className="space-y-8">
                <div className="grid gap-4 sm:grid-cols-2">
                  {(() => {
                    const value = normalizeScore(result.overallScore);
                    return (
                      <div className="rounded-2xl border border-slate-200/80 bg-gradient-to-br from-white to-slate-50 p-5 dark:border-slate-800 dark:from-slate-900 dark:to-slate-800">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                            Resume Score
                          </p>
                          <span className="text-lg font-bold text-slate-900 dark:text-white">
                            {value !== null ? `${value}/100` : "—"}
                          </span>
                        </div>
                        <div className="mt-3 h-2 rounded-full bg-slate-200 dark:bg-slate-700">
                          <div
                            className="h-2 rounded-full bg-primary-600 transition-all"
                            style={{ width: `${value ?? 0}%` }}
                          />
                        </div>
                      </div>
                    );
                  })()}
                  {(() => {
                    const value = normalizeScore(result.atsScore);
                    return (
                      <div className="rounded-2xl border border-emerald-100/80 bg-gradient-to-br from-white to-emerald-50 p-5 dark:border-emerald-900/50 dark:from-slate-900 dark:to-emerald-950/40">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-200">
                            ATS Match Score
                          </p>
                          <span className="text-lg font-bold text-emerald-900 dark:text-emerald-100">
                            {value !== null ? `${value}/100` : "—"}
                          </span>
                        </div>
                        <div className="mt-3 h-2 rounded-full bg-emerald-100 dark:bg-emerald-900/50">
                          <div
                            className="h-2 rounded-full bg-emerald-500 transition-all"
                            style={{ width: `${value ?? 0}%` }}
                          />
                        </div>
                      </div>
                    );
                  })()}
                </div>

                <div className="rounded-2xl border border-slate-200/80 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                    Summary
                  </h3>
                  <p className="mt-2 text-slate-700 dark:text-slate-200">
                    {result.analysis.summary || "Summary not provided."}
                  </p>
                </div>

                <div className="grid gap-6 lg:grid-cols-2">
                  <div className="rounded-2xl border border-slate-200/80 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                      Strengths
                    </h3>
                    {renderList(
                      result.analysis.strengths,
                      "No strengths returned yet."
                    )}
                  </div>
                  <div className="rounded-2xl border border-slate-200/80 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                      Improvements
                    </h3>
                    {renderList(
                      result.analysis.improvements,
                      "No improvements returned yet."
                    )}
                  </div>
                  <div className="rounded-2xl border border-slate-200/80 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                      Missing Keywords
                    </h3>
                    {renderChips(
                      result.analysis.missing_keywords,
                      "No missing keywords returned."
                    )}
                  </div>
                  <div className="rounded-2xl border border-slate-200/80 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                      Matching Keywords
                    </h3>
                    {renderChips(
                      result.analysis.matching_keywords,
                      "No matching keywords returned."
                    )}
                  </div>
                  <div className="rounded-2xl border border-slate-200/80 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                      Formatting Tips
                    </h3>
                    {renderList(
                      result.analysis.formatting_tips,
                      "No formatting tips returned."
                    )}
                  </div>
                  <div className="rounded-2xl border border-slate-200/80 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                      Action Plan
                    </h3>
                    {renderList(
                      result.analysis.action_plan,
                      "No action plan returned."
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="whitespace-pre-wrap text-slate-700 leading-relaxed dark:text-slate-200">
                {result.feedback}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}



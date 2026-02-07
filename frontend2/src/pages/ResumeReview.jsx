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
      return <p className="text-sm text-slate-500">{emptyLabel}</p>;
    }
    return (
      <ul className="mt-2 list-disc pl-5 text-slate-700">
        {items.map((item, idx) => (
          <li key={`${emptyLabel}-${idx}`}>{item}</li>
        ))}
      </ul>
    );
  };

  const renderChips = (items, emptyLabel) => {
    if (!items || items.length === 0) {
      return <p className="text-sm text-slate-500">{emptyLabel}</p>;
    }
    return (
      <div className="mt-3 flex flex-wrap gap-2">
        {items.map((item, idx) => (
          <span
            key={`${emptyLabel}-chip-${idx}`}
            className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-sm text-slate-700"
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-primary-50/30">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-slate-900">Resume Review</h1>
          <p className="text-slate-600 mt-1">
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
            className={`px-4 py-2 rounded-xl font-medium transition-all ${
              mode === "upload"
                ? "bg-primary-600 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
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
            className={`px-4 py-2 rounded-xl font-medium transition-all ${
              mode === "paste"
                ? "bg-primary-600 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            Paste Text
          </button>
        </div>

        <form onSubmit={handleSubmit} className="card p-8 mb-8">
          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Job Description
            </label>
            <textarea
              className="input-field min-h-[160px] resize-y"
              placeholder="Paste the job description here..."
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
            />
          </div>
          {mode === "upload" ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-200 rounded-2xl p-12 text-center cursor-pointer hover:border-primary-400 hover:bg-primary-50/30 transition-all"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                onChange={handleFileChange}
                className="hidden"
              />
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-primary-100 flex items-center justify-center">
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
              <p className="font-medium text-slate-700">
                {file ? file.name : "Click to upload your resume (PDF)"}
              </p>
              <p className="text-sm text-slate-500 mt-1">Max 5MB</p>
            </div>
          ) : (
            <textarea
              className="input-field min-h-[200px] resize-y"
              placeholder="Paste your resume text here..."
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
          )}

          {error && (
            <div className="mt-4 p-4 rounded-xl bg-red-50 text-red-600 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary mt-6 w-full sm:w-auto disabled:opacity-60"
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
          <div className="card p-8 animate-slide-up">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-xl font-bold text-slate-900">AI Feedback</h2>
                <p className="text-sm text-slate-500">
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
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-semibold text-slate-700">
                            Resume Score
                          </p>
                          <span className="text-lg font-bold text-slate-900">
                            {value !== null ? `${value}/100` : "—"}
                          </span>
                        </div>
                        <div className="mt-3 h-2 rounded-full bg-slate-200">
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
                      <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-5">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-semibold text-emerald-800">
                            ATS Match Score
                          </p>
                          <span className="text-lg font-bold text-emerald-900">
                            {value !== null ? `${value}/100` : "—"}
                          </span>
                        </div>
                        <div className="mt-3 h-2 rounded-full bg-emerald-100">
                          <div
                            className="h-2 rounded-full bg-emerald-500 transition-all"
                            style={{ width: `${value ?? 0}%` }}
                          />
                        </div>
                      </div>
                    );
                  })()}
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-6">
                  <h3 className="text-lg font-semibold text-slate-900">
                    Summary
                  </h3>
                  <p className="mt-2 text-slate-700">
                    {result.analysis.summary || "Summary not provided."}
                  </p>
                </div>

                <div className="grid gap-6 lg:grid-cols-2">
                  <div className="rounded-2xl border border-slate-200 bg-white p-6">
                    <h3 className="text-lg font-semibold text-slate-900">
                      Strengths
                    </h3>
                    {renderList(
                      result.analysis.strengths,
                      "No strengths returned yet."
                    )}
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-white p-6">
                    <h3 className="text-lg font-semibold text-slate-900">
                      Improvements
                    </h3>
                    {renderList(
                      result.analysis.improvements,
                      "No improvements returned yet."
                    )}
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-white p-6">
                    <h3 className="text-lg font-semibold text-slate-900">
                      Missing Keywords
                    </h3>
                    {renderChips(
                      result.analysis.missing_keywords,
                      "No missing keywords returned."
                    )}
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-white p-6">
                    <h3 className="text-lg font-semibold text-slate-900">
                      Matching Keywords
                    </h3>
                    {renderChips(
                      result.analysis.matching_keywords,
                      "No matching keywords returned."
                    )}
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-white p-6">
                    <h3 className="text-lg font-semibold text-slate-900">
                      Formatting Tips
                    </h3>
                    {renderList(
                      result.analysis.formatting_tips,
                      "No formatting tips returned."
                    )}
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-white p-6">
                    <h3 className="text-lg font-semibold text-slate-900">
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
              <div className="whitespace-pre-wrap text-slate-700 leading-relaxed">
                {result.feedback}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

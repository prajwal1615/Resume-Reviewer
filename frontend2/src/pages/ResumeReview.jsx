import { useState, useRef } from "react";
import api from "../api/axios";

export default function ResumeReview() {
  const [mode, setMode] = useState("upload");
  const [file, setFile] = useState(null);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const fileInputRef = useRef(null);

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
      if (mode === "upload" && file) {
        const formData = new FormData();
        formData.append("file", file);
        const res = await api.post("/resume/analyze", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        setResult(res.data);
      } else if (mode === "paste" && text.trim().length >= 50) {
        const res = await api.post("/resume/analyze-text", { text: text.trim() });
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
            <div className="flex items-center gap-4 mb-6">
              <h2 className="text-xl font-bold text-slate-900">AI Feedback</h2>
              {result.score && (
                <span className="px-4 py-2 rounded-xl bg-primary-100 text-primary-700 font-bold">
                  Score: {result.score}/10
                </span>
              )}
            </div>
            <div className="prose prose-slate max-w-none">
              <div className="whitespace-pre-wrap text-slate-700 leading-relaxed">
                {result.feedback}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

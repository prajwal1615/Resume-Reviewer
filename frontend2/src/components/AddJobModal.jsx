import { useState } from "react";
import api from "../api/axios";

export default function AddJobModal({ onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    company: "",
    role: "",
    jobDescription: "",
    status: "Applied",
    appliedDate: new Date().toISOString().slice(0, 10),
    interviewDate: "",
    reminderAt: "",
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api.post("/jobs", {
        ...form,
        appliedDate: form.appliedDate || undefined,
        interviewDate: form.interviewDate || undefined,
        reminderAt: form.reminderAt || undefined,
      });
      onSuccess?.();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to add job");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />
      <div className="relative card p-6 w-full max-w-md animate-slide-up">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-slate-900">Add Job Application</h2>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          {error && (
            <p className="text-red-600 text-sm bg-red-50 p-3 rounded-xl">{error}</p>
          )}
          <input
            className="input-field"
            placeholder="Company name"
            value={form.company}
            onChange={(e) => setForm((f) => ({ ...f, company: e.target.value }))}
            required
          />
          <input
            className="input-field"
            placeholder="Job role / position"
            value={form.role}
            onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
            required
          />
          <textarea
            className="input-field min-h-[60px] resize-none"
            placeholder="Job description (optional)"
            value={form.jobDescription}
            onChange={(e) =>
              setForm((f) => ({ ...f, jobDescription: e.target.value }))
            }
          />
          <select
            className="input-field"
            value={form.status}
            onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
          >
            <option value="Applied">Applied</option>
            <option value="Interview">Interview</option>
            <option value="Offer">Offer</option>
            <option value="Rejected">Rejected</option>
          </select>
          <input
            type="date"
            className="input-field"
            value={form.appliedDate}
            onChange={(e) => setForm((f) => ({ ...f, appliedDate: e.target.value }))}
          />
          <input
            type="date"
            className="input-field"
            value={form.interviewDate}
            onChange={(e) =>
              setForm((f) => ({ ...f, interviewDate: e.target.value }))
            }
            placeholder="Interview date (optional)"
          />
          <input
            type="date"
            className="input-field"
            value={form.reminderAt}
            onChange={(e) => setForm((f) => ({ ...f, reminderAt: e.target.value }))}
            placeholder="Reminder date (optional)"
          />
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={loading} className="btn-primary flex-1">
              {loading ? "Adding..." : "Add Job"}
            </button>
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

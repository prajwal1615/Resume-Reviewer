import { useState } from "react";
import api from "../api/axios";
import { useNotifications } from "../context/NotificationsContext";
import { useFeatureFlags } from "../context/FeatureFlagsContext";
import { Link } from "react-router-dom";

export default function AddJobModal({ onClose, onSuccess }) {
  const { addNotification } = useNotifications();
  const { isEnabled } = useFeatureFlags();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [premiumRequired, setPremiumRequired] = useState(false);
  const [form, setForm] = useState({
    company: "",
    role: "",
    jobDescription: "",
    status: "Applied",
    appliedDate: new Date().toISOString().slice(0, 10),
    interviewDate: "",
    reminderAt: "",
    notes: "",
    checklistText: "",
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setPremiumRequired(false);
    setLoading(true);
    try {
      await api.post("/jobs", {
        ...form,
        appliedDate: form.appliedDate || undefined,
        interviewDate: form.interviewDate || undefined,
        reminderAt: form.reminderAt || undefined,
        notes: form.notes || undefined,
        checklist: form.checklistText
          ? form.checklistText
              .split(/\r?\n/)
              .map((line) => line.trim())
              .filter(Boolean)
              .map((text) => ({ text, done: false }))
          : [],
      });
      addNotification({
        title: "Job added",
        message: `${form.company} · ${form.role}`,
        type: "success",
      });
      onSuccess?.();
      onClose();
    } catch (err) {
      const message = err.response?.data?.message || "Failed to add job";
      setError(message);
      if (err.response?.status === 402 && err.response?.data?.requiresPremium) {
        setPremiumRequired(true);
      }
      addNotification({ title: "Add failed", message, type: "error" });
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
      <div className="relative card p-5 w-full max-w-md animate-slide-up max-h-[90vh] overflow-auto">
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

        <form onSubmit={handleSubmit} className="space-y-2">
          {error && (
            <div className="text-red-600 text-sm bg-red-50 p-3 rounded-xl space-y-2">
              <p>{error}</p>
              {premiumRequired && isEnabled("premium_pricing") && (
                <Link to="/pricing" className="inline-flex text-xs font-semibold text-primary-700 hover:text-primary-800">
                  Upgrade to Premium
                </Link>
              )}
            </div>
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
            className="input-field min-h-[44px] resize-none"
            placeholder="Job description (optional)"
            value={form.jobDescription}
            onChange={(e) =>
              setForm((f) => ({ ...f, jobDescription: e.target.value }))
            }
          />
          <textarea
            className="input-field min-h-[44px] resize-none"
            placeholder="Notes (optional)"
            value={form.notes}
            onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
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
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">
                Applied date
              </label>
              <input
                type="date"
                className="input-field"
                value={form.appliedDate}
                onChange={(e) => setForm((f) => ({ ...f, appliedDate: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">
                Interview date (optional)
              </label>
              <input
                type="date"
                className="input-field"
                value={form.interviewDate}
                onChange={(e) =>
                  setForm((f) => ({ ...f, interviewDate: e.target.value }))
                }
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">
                Reminder date (optional)
              </label>
              <input
                type="date"
                className="input-field"
                value={form.reminderAt}
                onChange={(e) => setForm((f) => ({ ...f, reminderAt: e.target.value }))}
              />
            </div>
          </div>
          <textarea
            className="input-field min-h-[44px] resize-none"
            placeholder="Checklist (one item per line)"
            value={form.checklistText}
            onChange={(e) =>
              setForm((f) => ({ ...f, checklistText: e.target.value }))
            }
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

import { useState } from "react";
import api from "../api/axios";

const STATUS_OPTIONS = ["Applied", "Interview", "Offer", "Rejected"];
const STATUS_STYLES = {
  Applied: "bg-blue-100 text-blue-700 border-blue-200",
  Interview: "bg-amber-100 text-amber-700 border-amber-200",
  Offer: "bg-emerald-100 text-emerald-700 border-emerald-200",
  Rejected: "bg-red-100 text-red-700 border-red-200",
};

export default function JobCard({ job, onUpdate, onDelete }) {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    company: job.company,
    role: job.role,
    jobDescription: job.jobDescription || "",
    status: job.status,
    appliedDate: job.appliedDate ? job.appliedDate.slice(0, 10) : "",
  });

  const handleSave = async () => {
    setLoading(true);
    try {
      await api.put(`/jobs/${job._id}`, {
        ...form,
        appliedDate: form.appliedDate || undefined,
      });
      onUpdate?.();
      setIsEditing(false);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Delete this job application?")) return;
    setLoading(true);
    try {
      await api.delete(`/jobs/${job._id}`);
      onDelete?.();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    setLoading(true);
    try {
      await api.put(`/jobs/${job._id}`, { ...job, status: newStatus });
      onUpdate?.();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (isEditing) {
    return (
      <div className="card p-6 animate-slide-up">
        <input
          className="input-field mb-3"
          placeholder="Company"
          value={form.company}
          onChange={(e) => setForm((f) => ({ ...f, company: e.target.value }))}
        />
        <input
          className="input-field mb-3"
          placeholder="Role"
          value={form.role}
          onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
        />
        <textarea
          className="input-field mb-3 min-h-[80px] resize-none"
          placeholder="Job description (optional)"
          value={form.jobDescription}
          onChange={(e) =>
            setForm((f) => ({ ...f, jobDescription: e.target.value }))
          }
        />
        <input
          type="date"
          className="input-field mb-4"
          value={form.appliedDate}
          onChange={(e) =>
            setForm((f) => ({ ...f, appliedDate: e.target.value }))
          }
        />
        <div className="flex gap-2">
          <button
            onClick={handleSave}
            disabled={loading}
            className="btn-primary flex-1 disabled:opacity-60"
          >
            {loading ? "Saving..." : "Save"}
          </button>
          <button
            onClick={() => setIsEditing(false)}
            disabled={loading}
            className="btn-secondary"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="card p-6 hover:shadow-lg transition-shadow duration-300 group">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="text-lg font-bold text-slate-900">{job.company}</h3>
          <p className="text-slate-600">{job.role}</p>
        </div>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => setIsEditing(true)}
            disabled={loading}
            className="p-2 text-slate-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
            title="Edit"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </button>
          <button
            onClick={handleDelete}
            disabled={loading}
            className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Delete"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>

      {job.jobDescription && (
        <p className="text-sm text-slate-500 mb-3 line-clamp-2">{job.jobDescription}</p>
      )}

      {job.appliedDate && (
        <p className="text-xs text-slate-400 mb-3">
          Applied: {new Date(job.appliedDate).toLocaleDateString()}
        </p>
      )}

      <div className="flex items-center gap-2 flex-wrap">
        <select
          value={job.status}
          onChange={(e) => handleStatusChange(e.target.value)}
          disabled={loading}
          className={`text-sm font-medium px-3 py-1.5 rounded-lg border cursor-pointer transition-colors ${STATUS_STYLES[job.status]}`}
        >
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

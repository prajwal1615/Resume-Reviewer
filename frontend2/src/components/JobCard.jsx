import { useState } from "react";
import api from "../api/axios";

const STATUS_OPTIONS = ["Applied", "Interview", "Offer", "Rejected"];
const STATUS_STYLES = {
  Applied: "border-blue-200 text-blue-700 hover:bg-blue-50",
  Interview: "border-amber-200 text-amber-700 hover:bg-amber-50",
  Offer: "border-emerald-200 text-emerald-700 hover:bg-emerald-50",
  Rejected: "border-red-200 text-red-700 hover:bg-red-50",
};
const STATUS_ACTIVE = {
  Applied: "bg-blue-100 text-blue-800 border-blue-200",
  Interview: "bg-amber-100 text-amber-800 border-amber-200",
  Offer: "bg-emerald-100 text-emerald-800 border-emerald-200",
  Rejected: "bg-red-100 text-red-800 border-red-200",
};

export default function JobCard({ job, onUpdate, onDelete }) {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const toDateInput = (value) =>
    value ? new Date(value).toISOString().slice(0, 10) : "";
  const [form, setForm] = useState({
    company: job.company,
    role: job.role,
    jobDescription: job.jobDescription || "",
    status: job.status,
    appliedDate: job.appliedDate ? job.appliedDate.slice(0, 10) : "",
    interviewDate: toDateInput(job.interviewDate),
    reminderAt: toDateInput(job.reminderAt),
  });

  const handleSave = async () => {
    setLoading(true);
    try {
      await api.put(`/jobs/${job._id}`, {
        ...form,
        appliedDate: form.appliedDate || undefined,
        interviewDate: form.interviewDate || undefined,
        reminderAt: form.reminderAt || undefined,
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

  const handleTogglePin = async () => {
    setLoading(true);
    try {
      await api.put(`/jobs/${job._id}`, { ...job, pinned: !job.pinned });
      onUpdate?.();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleReminder = async (date) => {
    setLoading(true);
    try {
      await api.put(`/jobs/${job._id}`, { ...job, reminderAt: date || null });
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
        <input
          type="date"
          className="input-field mb-4"
          value={form.interviewDate}
          onChange={(e) =>
            setForm((f) => ({ ...f, interviewDate: e.target.value }))
          }
          placeholder="Interview date"
        />
        <input
          type="date"
          className="input-field mb-4"
          value={form.reminderAt}
          onChange={(e) =>
            setForm((f) => ({ ...f, reminderAt: e.target.value }))
          }
          placeholder="Reminder date"
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
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold text-slate-900">{job.company}</h3>
            {job.pinned && (
              <span className="text-[11px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
                Pinned
              </span>
            )}
          </div>
          <p className="text-slate-600">{job.role}</p>
        </div>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={handleTogglePin}
            disabled={loading}
            className="p-2 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
            title={job.pinned ? "Unpin" : "Pin"}
          >
            {job.pinned ? (
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M16 3a1 1 0 0 1 1 1v4.586l2.707 2.707a1 1 0 0 1-.707 1.707H14v6a1 1 0 0 1-2 0v-6H5a1 1 0 0 1-.707-1.707L7 8.586V4a1 1 0 0 1 1-1h8z" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 3H8a1 1 0 00-1 1v4.586L4.293 11.293A1 1 0 005 13h6v6a1 1 0 102 0v-6h6a1 1 0 00.707-1.707L17 8.586V4a1 1 0 00-1-1z" />
              </svg>
            )}
          </button>
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
      {job.interviewDate && (
        <p className="text-xs text-slate-400 mb-3">
          Interview: {new Date(job.interviewDate).toLocaleDateString()}
        </p>
      )}
      {job.reminderAt && (
        <p className="text-xs text-slate-400 mb-3">
          Reminder: {new Date(job.reminderAt).toLocaleDateString()}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-2">
        {STATUS_OPTIONS.map((status) => {
          const active = status === job.status;
          return (
            <button
              key={status}
              onClick={() => handleStatusChange(status)}
              disabled={loading || active}
              className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors ${
                active ? STATUS_ACTIVE[status] : STATUS_STYLES[status]
              } ${loading ? "opacity-60 cursor-not-allowed" : ""}`}
            >
              {status}
            </button>
          );
        })}
        <button
          onClick={() => handleReminder(new Date(Date.now() + 86400000).toISOString())}
          disabled={loading}
          className="text-xs font-semibold px-3 py-1.5 rounded-full border border-slate-200 text-slate-600 hover:border-primary-300 hover:text-primary-700 transition-colors"
        >
          Remind Tomorrow
        </button>
        {job.reminderAt && (
          <button
            onClick={() => handleReminder(null)}
            disabled={loading}
            className="text-xs font-semibold px-3 py-1.5 rounded-full border border-slate-200 text-slate-500 hover:border-slate-300 hover:text-slate-700 transition-colors"
          >
            Clear Reminder
          </button>
        )}
      </div>
    </div>
  );
}

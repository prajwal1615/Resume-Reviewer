import { useEffect, useRef, useState } from "react";
import api from "../api/axios";
import JobCard from "../components/JobCard";
import StatsCard from "../components/StatsCard";
import AddJobModal from "../components/AddJobModal";

export default function Dashboard() {
  const STATUS_ORDER = ["Applied", "Interview", "Offer", "Rejected"];
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState("list");
  const [statusFilter, setStatusFilter] = useState(() => {
    if (typeof window === "undefined") return "All";
    return localStorage.getItem("jobflow_status_filter") || "All";
  });
  const [calendarMonth, setCalendarMonth] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const didInit = useRef(false);

  const fetchJobs = async (query = "") => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/jobs", query ? { params: { q: query } } : {});
      setJobs(res.data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load jobs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!didInit.current) {
      didInit.current = true;
      fetchJobs();
      return;
    }
    const delay = searchTerm.trim() ? 1200 : 0;
    const timer = setTimeout(() => {
      fetchJobs(searchTerm.trim());
    }, delay);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("jobflow_status_filter", statusFilter);
    }
  }, [statusFilter]);

  const statusCount = (status) => jobs.filter((j) => j.status === status).length;
  const filteredJobs =
    statusFilter === "All"
      ? jobs
      : jobs.filter((job) => job.status === statusFilter);
  const sortedJobs = [...filteredJobs].sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    const aDate = new Date(a.updatedAt || a.createdAt || 0).getTime();
    const bDate = new Date(b.updatedAt || b.createdAt || 0).getTime();
    return bDate - aDate;
  });
  const recentActivity = [...jobs]
    .sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt))
    .slice(0, 5);

  const groupedByStatus = STATUS_ORDER.reduce((acc, status) => {
    acc[status] = filteredJobs.filter((job) => job.status === status);
    return acc;
  }, {});

  const upcomingReminders = jobs
    .filter((job) => job.reminderAt)
    .sort((a, b) => new Date(a.reminderAt) - new Date(b.reminderAt))
    .slice(0, 6);

  const handleSnooze = async (job, days) => {
    try {
      const next = new Date(Date.now() + days * 86400000).toISOString();
      await api.put(`/jobs/${job._id}`, { ...job, reminderAt: next });
      fetchJobs(searchTerm.trim());
    } catch (err) {
      console.error(err);
    }
  };

  const handleClearReminder = async (job) => {
    try {
      await api.put(`/jobs/${job._id}`, { ...job, reminderAt: null });
      fetchJobs(searchTerm.trim());
    } catch (err) {
      console.error(err);
    }
  };

  const getSnoozeDays = (reminderAt) => {
    if (!reminderAt) return null;
    const now = new Date();
    const target = new Date(reminderAt);
    const diffMs = target.setHours(0, 0, 0, 0) - now.setHours(0, 0, 0, 0);
    const diffDays = Math.round(diffMs / 86400000);
    return diffDays > 0 ? diffDays : null;
  };

  const buildMonthDays = (date) => {
    const start = new Date(date.getFullYear(), date.getMonth(), 1);
    const startDay = start.getDay();
    const days = [];
    const gridStart = new Date(start);
    gridStart.setDate(start.getDate() - startDay);
    for (let i = 0; i < 42; i += 1) {
      const current = new Date(gridStart);
      current.setDate(gridStart.getDate() + i);
      days.push(current);
    }
    return days;
  };

  const formatKey = (date) => date.toISOString().slice(0, 10);
  const monthDays = buildMonthDays(calendarMonth);
  const eventsByDate = jobs.reduce((acc, job) => {
    const addEvent = (dt, label) => {
      if (!dt) return;
      const key = formatKey(new Date(dt));
      if (!acc[key]) acc[key] = [];
      acc[key].push({ job, label });
    };
    addEvent(job.appliedDate, "Applied");
    addEvent(job.interviewDate, "Interview");
    addEvent(job.reminderAt, "Reminder");
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-primary-50/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
            <p className="text-slate-600 mt-1">Track and manage your job applications</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="btn-primary flex items-center gap-2 shrink-0"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Job
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          <StatsCard title="Applied" count={statusCount("Applied")} />
          <StatsCard title="Interview" count={statusCount("Interview")} />
          <StatsCard title="Offer" count={statusCount("Offer")} />
          <StatsCard title="Rejected" count={statusCount("Rejected")} />
        </div>

        <div className="mb-8 rounded-2xl border border-slate-200 bg-white p-4 sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-700">Search</p>
              <p className="text-xs text-slate-500">
                Find jobs by company, role, or description
              </p>
            </div>
            <div className="relative w-full sm:max-w-md">
              <input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-field w-full pl-10"
                placeholder="Search by company or role..."
              />
              <svg
                className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-4.35-4.35M16.65 10.5a6.15 6.15 0 11-12.3 0 6.15 6.15 0 0112.3 0z"
                />
              </svg>
            </div>
          </div>
        </div>

        <div className="mb-6 flex flex-wrap items-center gap-2">
          {["list", "kanban", "calendar"].map((mode) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                viewMode === mode
                  ? "bg-slate-900 text-white border-slate-900"
                  : "bg-white text-slate-600 border-slate-200 hover:border-slate-400"
              }`}
            >
              {mode === "list"
                ? "List"
                : mode === "kanban"
                ? "Kanban"
                : "Calendar"}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
            <p className="mt-4 text-slate-500">Loading jobs...</p>
          </div>
        ) : jobs.length === 0 ? (
          <div className="card p-16 text-center">
            <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-primary-100 flex items-center justify-center">
              <svg className="w-10 h-10 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-slate-900 mb-2">No jobs yet</h3>
            <p className="text-slate-500 mb-6 max-w-sm mx-auto">
              Start tracking your job applications. Add your first job to get started.
            </p>
            <button onClick={() => setShowAddModal(true)} className="btn-primary">
              Add Your First Job
            </button>
          </div>
        ) : viewMode === "list" ? (
          <div className="space-y-8">
            <div className="card p-6">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">Saved Filters</h3>
                  <p className="text-sm text-slate-500">Quickly focus on a single stage.</p>
                </div>
                <button
                  onClick={() => setStatusFilter("All")}
                  className="text-sm text-slate-500 hover:text-slate-700"
                >
                  Reset
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {["All", "Applied", "Interview", "Offer", "Rejected"].map((status) => (
                  <button
                    key={status}
                    onClick={() => setStatusFilter(status)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                      statusFilter === status
                        ? "bg-primary-600 text-white border-primary-600"
                        : "bg-white text-slate-600 border-slate-200 hover:border-primary-300 hover:text-primary-700"
                    }`}
                  >
                    {status === "All"
                      ? "All Jobs"
                      : `${status} (${statusCount(status)})`}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[2fr,1fr] gap-6">
              <div>
                {filteredJobs.length === 0 ? (
                  <div className="card p-12 text-center">
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">
                      No jobs in {statusFilter}
                    </h3>
                    <p className="text-slate-500 mb-6">
                      Try switching filters or add a new job in this stage.
                    </p>
                    <div className="flex flex-wrap items-center justify-center gap-3">
                      <button onClick={() => setStatusFilter("All")} className="btn-secondary">
                        Clear filter
                      </button>
                      <button onClick={() => setShowAddModal(true)} className="btn-primary">
                        Add Job
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {sortedJobs.map((job) => (
                      <JobCard
                        key={job._id}
                        job={job}
                        onUpdate={() => fetchJobs(searchTerm.trim())}
                        onDelete={() => fetchJobs(searchTerm.trim())}
                      />
                    ))}
                  </div>
                )}
              </div>

              <div className="card p-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Recent Activity</h3>
                {recentActivity.length === 0 ? (
                  <p className="text-sm text-slate-500">
                    Activity will show up as you add or update jobs.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {recentActivity.map((job) => (
                      <div key={`activity-${job._id}`} className="flex gap-3">
                        <div className="mt-1 h-2.5 w-2.5 rounded-full bg-primary-500" />
                        <div>
                          <p className="text-sm font-medium text-slate-800">
                            {job.company} · {job.role}
                          </p>
                          <p className="text-xs text-slate-500">
                            Status: {job.status}
                          </p>
                          <p className="text-xs text-slate-400">
                            {new Date(job.updatedAt || job.createdAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-slate-900">Reminders</h3>
                <button
                  onClick={() => setShowAddModal(true)}
                  className="text-sm text-primary-600 hover:text-primary-700"
                >
                  Add reminder
                </button>
              </div>
              {upcomingReminders.length === 0 ? (
                <p className="text-sm text-slate-500">
                  No reminders yet. Add one to keep track of follow-ups.
                </p>
              ) : (
                <div className="space-y-3">
                  {upcomingReminders.map((job) => (
                    <div
                      key={`reminder-${job._id}`}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 p-3"
                    >
                      <div>
                        <p className="text-sm font-medium text-slate-800">
                          {job.company} · {job.role}
                        </p>
                        <p className="text-xs text-slate-500">
                          Reminder: {new Date(job.reminderAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {(() => {
                          const snoozeDays = getSnoozeDays(job.reminderAt);
                          return (
                            <>
                        <button
                          onClick={() => handleSnooze(job, 1)}
                          disabled={snoozeDays === 1}
                          className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                            snoozeDays === 1
                              ? "bg-primary-600 text-white border-primary-600"
                              : "border-slate-200 text-slate-600 hover:border-slate-300"
                          }`}
                        >
                          Snooze 1d
                        </button>
                        <button
                          onClick={() => handleSnooze(job, 3)}
                          disabled={snoozeDays === 3}
                          className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                            snoozeDays === 3
                              ? "bg-primary-600 text-white border-primary-600"
                              : "border-slate-200 text-slate-600 hover:border-slate-300"
                          }`}
                        >
                          Snooze 3d
                        </button>
                        <button
                          onClick={() => handleClearReminder(job)}
                          className="text-xs px-3 py-1.5 rounded-full border border-slate-200 text-slate-500 hover:border-slate-300"
                        >
                          Clear
                        </button>
                            </>
                          );
                        })()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : viewMode === "kanban" ? (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {STATUS_ORDER.map((status) => (
              <div key={status} className="card p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-slate-800">{status}</h3>
                  <span className="text-xs text-slate-500">
                    {groupedByStatus[status]?.length || 0}
                  </span>
                </div>
                <div className="space-y-4">
                  {(groupedByStatus[status] || []).map((job) => (
                    <JobCard
                      key={`kanban-${job._id}`}
                      job={job}
                      onUpdate={() => fetchJobs(searchTerm.trim())}
                      onDelete={() => fetchJobs(searchTerm.trim())}
                    />
                  ))}
                  {(groupedByStatus[status] || []).length === 0 && (
                    <p className="text-xs text-slate-400">No jobs here.</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-6">
            <div className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <button
                  onClick={() =>
                    setCalendarMonth(
                      (prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1)
                    )
                  }
                  className="text-sm text-slate-600 hover:text-slate-800"
                >
                  Prev
                </button>
                <h3 className="text-lg font-semibold text-slate-900">
                  {calendarMonth.toLocaleString("default", { month: "long", year: "numeric" })}
                </h3>
                <button
                  onClick={() =>
                    setCalendarMonth(
                      (prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1)
                    )
                  }
                  className="text-sm text-slate-600 hover:text-slate-800"
                >
                  Next
                </button>
              </div>
              <div className="grid grid-cols-7 gap-2 text-xs text-slate-400 mb-2">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                  <div key={day} className="text-center">
                    {day}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-2">
                {monthDays.map((date) => {
                  const key = formatKey(date);
                  const events = eventsByDate[key] || [];
                  const isCurrentMonth = date.getMonth() === calendarMonth.getMonth();
                  const isSelected = selectedDate === key;
                  return (
                    <button
                      key={key}
                      onClick={() => setSelectedDate(key)}
                      className={`min-h-[84px] rounded-xl border p-2 text-left transition-colors ${
                        isSelected
                          ? "border-primary-500 bg-primary-50"
                          : "border-slate-200 hover:border-slate-300"
                      } ${isCurrentMonth ? "bg-white" : "bg-slate-50 text-slate-400"}`}
                    >
                      <div className="text-xs font-medium">{date.getDate()}</div>
                      {events.length > 0 && (
                        <div className="mt-2 space-y-1">
                          {events.slice(0, 2).map((event, idx) => (
                            <div
                              key={`${key}-${idx}`}
                              className="text-[10px] rounded-full bg-slate-100 px-2 py-0.5 text-slate-600"
                            >
                              {event.label}: {event.job.company}
                            </div>
                          ))}
                          {events.length > 2 && (
                            <div className="text-[10px] text-slate-400">
                              +{events.length - 2} more
                            </div>
                          )}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="card p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">
                {selectedDate ? `Events on ${selectedDate}` : "Select a date"}
              </h3>
              {(selectedDate && eventsByDate[selectedDate]?.length) ? (
                <div className="space-y-3">
                  {eventsByDate[selectedDate].map((event, idx) => (
                    <div
                      key={`event-${selectedDate}-${idx}`}
                      className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 p-3"
                    >
                      <div>
                        <p className="text-sm font-medium text-slate-800">
                          {event.job.company} · {event.job.role}
                        </p>
                        <p className="text-xs text-slate-500">{event.label}</p>
                      </div>
                      <span className="text-xs text-slate-400">{event.job.status}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-500">
                  No events for this date.
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {showAddModal && (
        <AddJobModal
          onClose={() => setShowAddModal(false)}
          onSuccess={() => fetchJobs(searchTerm.trim())}
        />
      )}
    </div>
  );
}

import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import api from "../api/axios";
import JobCard from "../components/JobCard";
import JobTable from "../components/JobTable";
import StatsCard from "../components/StatsCard";
import AddJobModal from "../components/AddJobModal";
import { useNotifications } from "../context/NotificationsContext";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { Bar, Pie } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend);

export default function Dashboard() {
  const location = useLocation();
  const { addNotification } = useNotifications();
  const STATUS_ORDER = ["Applied", "Interview", "Offer", "Rejected"];
  const WIP_LIMITS = {
    Applied: 10,
    Interview: 5,
    Offer: 3,
    Rejected: 999,
  };
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState("list");
  const [listLayout, setListLayout] = useState(() => {
    if (typeof window === "undefined") return "cards";
    return localStorage.getItem("jobflow_list_layout") || "cards";
  });
  const [statusFilter, setStatusFilter] = useState(() => {
    if (typeof window === "undefined") return "All";
    return localStorage.getItem("jobflow_status_filter") || "All";
  });
  const [calendarMonth, setCalendarMonth] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedWeekStart, setSelectedWeekStart] = useState(null);
  const [weekHighlightEnabled, setWeekHighlightEnabled] = useState(false);
  const [snoozeSelection, setSnoozeSelection] = useState({});
  const [calendarFilters, setCalendarFilters] = useState({
    Applied: true,
    Interview: true,
    Reminder: true,
  });
  const calendarSectionRef = useRef(null);
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
    const params = new URLSearchParams(location.search);
    const view = params.get("view");
    const date = params.get("date");
    if (view && ["list", "kanban", "calendar"].includes(view)) {
      setViewMode(view);
    }
    if (date === "today") {
      const today = new Date();
      setCalendarMonth(new Date(today.getFullYear(), today.getMonth(), 1));
      setSelectedDate(today.toISOString().slice(0, 10));
    }
    if (view === "calendar") {
      setTimeout(() => {
        calendarSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 0);
    }
  }, [location.search]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("jobflow_status_filter", statusFilter);
    }
  }, [statusFilter]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const token = localStorage.getItem("token");
    if (!token) return;
    let isMounted = true;
    api
      .get("/users/me")
      .then((res) => {
        if (!isMounted) return;
        const preference = res.data?.jobListView;
        if (preference && ["cards", "table"].includes(preference)) {
          setListLayout(preference);
          localStorage.setItem("jobflow_list_layout", preference);
        }
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, []);

  const handleListLayoutToggle = async () => {
    const next = listLayout === "cards" ? "table" : "cards";
    setListLayout(next);
    if (typeof window !== "undefined") {
      localStorage.setItem("jobflow_list_layout", next);
    }
    try {
      await api.put("/users/me/job-list-view", { view: next });
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    const next = {};
    jobs.forEach((job) => {
      if (Number.isFinite(job.lastSnoozeDays)) {
        next[job._id] = job.lastSnoozeDays;
      }
    });
    setSnoozeSelection(next);
  }, [jobs]);

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
    .slice(0, 8);

  const formatDate = (value) => (value ? new Date(value).toLocaleDateString() : "");
  const downloadBlob = (blob, filename) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };
  const exportJobsCsv = () => {
    const rows = sortedJobs.map((job) => ({
      Company: job.company || "",
      Role: job.role || "",
      Status: job.status || "",
      AppliedDate: formatDate(job.appliedDate),
      InterviewDate: formatDate(job.interviewDate),
      ReminderDate: formatDate(job.reminderAt),
      Notes: (job.notes || "").replace(/\s+/g, " ").trim(),
    }));
    const headers = Object.keys(rows[0] || {
      Company: "",
      Role: "",
      Status: "",
      AppliedDate: "",
      InterviewDate: "",
      ReminderDate: "",
      Notes: "",
    });
    const lines = [
      headers.join(","),
      ...rows.map((row) =>
        headers
          .map((key) => `"${String(row[key] || "").replace(/"/g, '""')}"`)
          .join(",")
      ),
    ];
    downloadBlob(new Blob([lines.join("\n")], { type: "text/csv" }), "jobflow-jobs.csv");
  };
  const exportJobsPdf = () => {
    const doc = new jsPDF();
    doc.setFontSize(14);
    doc.text("JobFlow - Job List", 14, 16);
    const rows = sortedJobs.map((job) => [
      job.company || "",
      job.role || "",
      job.status || "",
      formatDate(job.appliedDate),
      formatDate(job.interviewDate),
      formatDate(job.reminderAt),
    ]);
    autoTable(doc, {
      startY: 22,
      head: [["Company", "Role", "Status", "Applied", "Interview", "Reminder"]],
      body: rows,
      styles: { fontSize: 9 },
      headStyles: { fillColor: [30, 41, 59] },
    });
    doc.save("jobflow-jobs.pdf");
  };

  const groupedByStatus = STATUS_ORDER.reduce((acc, status) => {
    acc[status] = jobs.filter((job) => job.status === status);
    return acc;
  }, {});
  const stageAgeDays = (job) => {
    const base = job.updatedAt || job.appliedDate || job.createdAt;
    if (!base) return null;
    const diffMs = Date.now() - new Date(base).getTime();
    return Math.max(0, Math.floor(diffMs / 86400000));
  };
  const averageStageAge = (list) => {
    if (!list.length) return 0;
    const sum = list
      .map((job) => stageAgeDays(job))
      .filter((v) => Number.isFinite(v))
      .reduce((a, b) => a + b, 0);
    return Math.round(sum / Math.max(1, list.length));
  };
  const remindersNext7 = Array.from({ length: 7 }, (_, i) => {
    const day = new Date();
    day.setHours(0, 0, 0, 0);
    day.setDate(day.getDate() + i);
    const label = day.toLocaleDateString(undefined, { month: "short", day: "numeric" });
    const count = jobs.filter((j) => {
      if (!j.reminderAt) return false;
      const rd = new Date(j.reminderAt);
      rd.setHours(0, 0, 0, 0);
      return rd.getTime() === day.getTime();
    }).length;
    return { label, count };
  });

  const moveJob = async (job, direction) => {
    const idx = STATUS_ORDER.indexOf(job.status);
    const nextIdx = direction === "left" ? idx - 1 : idx + 1;
    if (nextIdx < 0 || nextIdx >= STATUS_ORDER.length) return;
    const nextStatus = STATUS_ORDER[nextIdx];
    try {
      await api.put(`/jobs/${job._id}`, { ...job, status: nextStatus });
      fetchJobs(searchTerm.trim());
      addNotification({
        title: "Status updated",
        message: `${job.company} moved to ${nextStatus}`,
        type: "success",
      });
    } catch (err) {
      console.error(err);
      addNotification({
        title: "Move failed",
        message: err.response?.data?.message || "Could not move job",
        type: "error",
      });
    }
  };

  const handleDragStart = (event, job) => {
    event.dataTransfer.setData("text/plain", job._id);
  };

  const handleDrop = async (event, status) => {
    event.preventDefault();
    const jobId = event.dataTransfer.getData("text/plain");
    const job = jobs.find((item) => item._id === jobId);
    if (!job || job.status === status) return;
    try {
      await api.put(`/jobs/${job._id}`, { ...job, status });
      fetchJobs(searchTerm.trim());
      addNotification({
        title: "Status updated",
        message: `${job.company} moved to ${status}`,
        type: "success",
      });
    } catch (err) {
      console.error(err);
      addNotification({
        title: "Move failed",
        message: err.response?.data?.message || "Could not move job",
        type: "error",
      });
    }
  };

  const upcomingReminders = jobs
    .filter((job) => job.reminderAt)
    .sort((a, b) => new Date(a.reminderAt) - new Date(b.reminderAt));

  const handleSnooze = async (job, days) => {
    try {
      const base = job.reminderAt ? new Date(job.reminderAt) : new Date();
      const next = new Date(base.getTime() + days * 86400000).toISOString();
      await api.put(`/jobs/${job._id}`, {
        ...job,
        reminderAt: next,
        lastSnoozeDays: days,
      });
      fetchJobs(searchTerm.trim());
      addNotification({
        title: "Reminder snoozed",
        message: `${job.company} Â· ${job.role} (+${days}d)`,
        type: "success",
      });
    } catch (err) {
      console.error(err);
      addNotification({
        title: "Snooze failed",
        message: err.response?.data?.message || "Could not snooze reminder",
        type: "error",
      });
    }
  };

  const handleClearReminder = async (job) => {
    try {
      await api.put(`/jobs/${job._id}`, { ...job, reminderAt: null, lastSnoozeDays: null });
      fetchJobs(searchTerm.trim());
      addNotification({
        title: "Reminder cleared",
        message: `${job.company} Â· ${job.role}`,
        type: "success",
      });
    } catch (err) {
      console.error(err);
      addNotification({
        title: "Clear failed",
        message: err.response?.data?.message || "Could not clear reminder",
        type: "error",
      });
    }
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
  const weekStart = (date) => {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() - start.getDay());
    return start;
  };
  const isSameDay = (a, b) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
  const isInWeek = (date, start) => {
    if (!start) return false;
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    return date >= start && date <= end;
  };
  const monthDays = buildMonthDays(calendarMonth);
  const activeWeekStart = selectedWeekStart
    ? new Date(selectedWeekStart)
    : weekStart(calendarMonth);
  const weekDays = Array.from({ length: 7 }, (_, idx) => {
    const day = new Date(activeWeekStart);
    day.setDate(activeWeekStart.getDate() + idx);
    return day;
  });
  const eventsByDate = jobs.reduce((acc, job) => {
    const addEvent = (dt, label) => {
      if (!dt || !calendarFilters[label]) return;
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-primary-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100">Dashboard</h1>
            <p className="text-slate-600 mt-1 dark:text-slate-300">Track and manage your job applications</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="btn-primary flex w-full sm:w-auto justify-center items-center gap-2 shrink-0"
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

        <div className="mb-8 rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Search</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
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

        <div className="mb-6 overflow-x-auto">
          <div className="flex min-w-max items-center gap-2">
          {["list", "kanban", "calendar"].map((mode) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                viewMode === mode
                  ? "bg-slate-900 text-white border-slate-900 dark:bg-primary-600 dark:border-primary-600"
                  : "bg-white text-slate-600 border-slate-200 hover:border-slate-400 dark:bg-slate-900 dark:text-slate-200 dark:border-slate-800 dark:hover:border-slate-600"
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
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
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
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={handleListLayoutToggle}
                    className="btn-secondary flex items-center gap-2 w-full sm:w-auto justify-center"
                    title={listLayout === "cards" ? "Switch to table view" : "Switch to card view"}
                  >
                    {listLayout === "cards" ? (
                      <>
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4 6h16M4 12h16M4 18h16"
                          />
                        </svg>
                        Table
                      </>
                    ) : (
                      <>
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4 7h7v7H4V7zm9 0h7v7h-7V7zM4 16h7v1H4v-1zm9 0h7v1h-7v-1z"
                          />
                        </svg>
                        Cards
                      </>
                    )}
                  </button>
                  <button onClick={exportJobsCsv} className="btn-secondary w-full sm:w-auto">
                    Export CSV
                  </button>
                  <button onClick={exportJobsPdf} className="btn-primary w-full sm:w-auto">
                    Export PDF
                  </button>
                </div>
              </div>
            </div>

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
              ) : listLayout === "cards" ? (
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
              ) : (
                <JobTable
                  jobs={sortedJobs}
                  onRefresh={() => fetchJobs(searchTerm.trim())}
                  formatDate={formatDate}
                />
              )}
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
                          {job.company} Â· {job.role}
                        </p>
                        <p className="text-xs text-slate-500">
                          Reminder: {new Date(job.reminderAt).toLocaleDateString()}
                        </p>
                        {Number.isFinite(job.lastSnoozeDays) && (
                          <p className="text-[11px] text-slate-400">
                            Last snoozed +{job.lastSnoozeDays}d
                          </p>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => handleSnooze(job, 1)}
                          className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                            snoozeSelection[job._id] === 1
                              ? "bg-primary-600 text-white border-primary-600"
                              : "border-slate-200 text-slate-600 hover:border-slate-300"
                          }`}
                        >
                          Snooze 1d
                        </button>
                        <button
                          onClick={() => handleSnooze(job, 3)}
                          className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                            snoozeSelection[job._id] === 3
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
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              <div className="card p-6 xl:col-span-1">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Recent Activity</h3>
                {recentActivity.length === 0 ? (
                  <p className="text-sm text-slate-500">
                    Activity will show up as you add or update jobs.
                  </p>
                ) : (
                  <div className="space-y-4 max-h-[320px] overflow-auto pr-1">
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

              <div className="card p-6 xl:col-span-1">
                <h3 className="text-sm font-semibold text-slate-700 mb-3">
                  Status Breakdown
                </h3>
                <div className="h-64">
                  <Pie
                    data={{
                      labels: STATUS_ORDER,
                      datasets: [
                        {
                          data: STATUS_ORDER.map((s) => statusCount(s)),
                          backgroundColor: [
                            "#3b82f6",
                            "#f59e0b",
                            "#10b981",
                            "#ef4444",
                          ],
                        },
                      ],
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: { legend: { position: "bottom" } },
                    }}
                  />
                </div>
              </div>

              <div className="card p-6 xl:col-span-1">
                <h3 className="text-sm font-semibold text-slate-700 mb-3">
                  Reminders Due (Next 7 Days)
                </h3>
                <div className="h-64">
                  <Bar
                    data={{
                      labels: remindersNext7.map((d) => d.label),
                      datasets: [
                        {
                          label: "Reminders",
                          data: remindersNext7.map((d) => d.count),
                          backgroundColor: "#22c55e",
                        },
                      ],
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: { legend: { display: false } },
                      scales: { y: { beginAtZero: true, ticks: { precision: 0 } } },
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        ) : viewMode === "kanban" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
            {STATUS_ORDER.map((status) => (
              <div
                key={status}
                className="card p-4"
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => handleDrop(event, status)}
              >
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-800">{status}</h3>
                    <p className="text-[11px] text-slate-500">
                      {groupedByStatus[status]?.length || 0} jobs Â· Avg{" "}
                      {averageStageAge(groupedByStatus[status] || [])}d
                    </p>
                  </div>
                  <span
                    className={`text-xs px-2 py-1 rounded-full border ${
                      (groupedByStatus[status]?.length || 0) > (WIP_LIMITS[status] || 999)
                        ? "border-red-300 bg-red-50 text-red-700"
                        : "border-slate-200 bg-slate-50 text-slate-600"
                    }`}
                    title={`WIP limit ${WIP_LIMITS[status] || "â€”"}`}
                  >
                    WIP {WIP_LIMITS[status] || "â€”"}
                  </span>
                </div>
                <div className="space-y-4">
                  {(groupedByStatus[status] || [])
                    .sort((a, b) => {
                      if (a.pinned && !b.pinned) return -1;
                      if (!a.pinned && b.pinned) return 1;
                      const aDate = new Date(a.updatedAt || a.createdAt || 0).getTime();
                      const bDate = new Date(b.updatedAt || b.createdAt || 0).getTime();
                      return bDate - aDate;
                    })
                    .map((job) => (
                      <div key={`drag-${job._id}`} draggable onDragStart={(event) => handleDragStart(event, job)}>
                        <JobCard
                          key={`kanban-${job._id}`}
                          job={job}
                          onUpdate={() => fetchJobs(searchTerm.trim())}
                          onDelete={() => fetchJobs(searchTerm.trim())}
                          expandOnEdit
                          showQuickMove
                          onMoveLeft={() => moveJob(job, "left")}
                          onMoveRight={() => moveJob(job, "right")}
                          ageDays={stageAgeDays(job)}
                        />
                      </div>
                    ))}
                  {(groupedByStatus[status] || []).length === 0 && (
                    <p className="text-xs text-slate-400">No jobs here.</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-6" ref={calendarSectionRef}>
            <div className="card p-4 sm:p-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() =>
                      setCalendarMonth(
                        (prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1)
                      )
                    }
                    className="text-sm text-slate-600 hover:text-slate-800 dark:text-slate-300 dark:hover:text-slate-100"
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
                    className="text-sm text-slate-600 hover:text-slate-800 dark:text-slate-300 dark:hover:text-slate-100"
                  >
                    Next
                  </button>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => {
                      const today = new Date();
                      setCalendarMonth(new Date(today.getFullYear(), today.getMonth(), 1));
                      setSelectedDate(formatKey(today));
                      setSelectedWeekStart(weekStart(today));
                      setWeekHighlightEnabled(false);
                    }}
                    className="text-xs px-3 py-1.5 rounded-full border border-slate-200 text-slate-600 hover:border-slate-300 dark:border-slate-700 dark:text-slate-300 dark:hover:border-slate-500"
                  >
                    Today
                  </button>
                  <button
                    onClick={() => {
                      const today = new Date();
                      const start = weekStart(today);
                      setCalendarMonth(new Date(today.getFullYear(), today.getMonth(), 1));
                      setSelectedDate(formatKey(today));
                      setSelectedWeekStart(start);
                      setWeekHighlightEnabled(true);
                    }}
                    className="text-xs px-3 py-1.5 rounded-full border border-slate-200 text-slate-600 hover:border-slate-300 dark:border-slate-700 dark:text-slate-300 dark:hover:border-slate-500"
                  >
                    This Week
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <div className="flex flex-wrap items-center gap-2">
                  {["Applied", "Interview", "Reminder"].map((label) => (
                    <button
                      key={label}
                      onClick={() =>
                        setCalendarFilters((prev) => ({ ...prev, [label]: !prev[label] }))
                      }
                      className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                        calendarFilters[label]
                          ? "bg-slate-900 text-white border-slate-900 dark:bg-primary-600 dark:border-primary-600"
                          : "bg-white text-slate-500 border-slate-200 dark:bg-slate-900 dark:text-slate-300 dark:border-slate-700"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-300">
                  <span className="inline-flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    Applied
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-amber-500" />
                    Interview
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-sky-500" />
                    Reminder
                  </span>
                </div>
              </div>
              <div className="overflow-x-auto pb-2">
              <div className="grid grid-cols-7 gap-2 mb-4 min-w-[700px]">
                {weekDays.map((date) => (
                  <button
                    key={`week-${formatKey(date)}`}
                    onClick={() => {
                      setSelectedDate(formatKey(date));
                      setSelectedWeekStart(weekStart(date));
                      setWeekHighlightEnabled(true);
                      setCalendarMonth(new Date(date.getFullYear(), date.getMonth(), 1));
                    }}
                    className={`rounded-xl border px-2 py-2 text-center text-xs transition-colors ${
                      selectedDate === formatKey(date)
                        ? "border-primary-500 bg-primary-50 text-primary-700"
                        : "border-slate-200 text-slate-600 hover:border-slate-300 dark:border-slate-700 dark:text-slate-300 dark:hover:border-slate-500"
                    }`}
                  >
                    <div className="text-[10px] uppercase tracking-wide">
                      {date.toLocaleDateString("default", { weekday: "short" })}
                    </div>
                    <div className="text-sm font-semibold">{date.getDate()}</div>
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-2 text-xs text-slate-400 mb-2 min-w-[700px]">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                  <div key={day} className="text-center">
                    {day}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-2 min-w-[700px]">
                {monthDays.map((date) => {
                  const key = formatKey(date);
                  const events = eventsByDate[key] || [];
                  const isCurrentMonth = date.getMonth() === calendarMonth.getMonth();
                  const isSelected = selectedDate === key;
                  const typeColor = (label) => {
                    if (label === "Applied") return "bg-emerald-500 text-white";
                    if (label === "Interview") return "bg-amber-500 text-white";
                    return "bg-sky-500 text-white";
                  };
                  return (
                    <button
                      key={key}
                      onClick={() => {
                        setSelectedDate(key);
                        setSelectedWeekStart(weekStart(date));
                        setWeekHighlightEnabled(false);
                      }}
                      className={`min-h-[74px] sm:min-h-[84px] rounded-xl border p-2 text-left transition-colors ${
                        isSelected
                          ? "border-primary-500 bg-primary-50"
                          : "border-slate-200 hover:border-slate-300"
                      } ${isCurrentMonth ? "bg-white" : "bg-slate-50 text-slate-400"} ${
                        weekHighlightEnabled && isInWeek(date, activeWeekStart) && !isSelected
                          ? "ring-1 ring-primary-100"
                          : ""
                      }`}
                    >
                      <div className="text-xs font-medium">{date.getDate()}</div>
                      {events.length > 0 && (
                        <div className="mt-2 space-y-1">
                          {events.slice(0, 2).map((event, idx) => (
                            <div
                              key={`${key}-${idx}`}
                              className={`text-[10px] rounded-full px-2 py-0.5 ${typeColor(
                                event.label
                              )}`}
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
                          {event.job.company} Â· {event.job.role}
                        </p>
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] ${
                            event.label === "Applied"
                              ? "bg-emerald-100 text-emerald-700"
                              : event.label === "Interview"
                              ? "bg-amber-100 text-amber-700"
                              : "bg-sky-100 text-sky-700"
                          }`}
                        >
                          {event.label}
                        </span>
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

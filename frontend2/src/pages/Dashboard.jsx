import { useEffect, useState } from "react";
import api from "../api/axios";
import JobCard from "../components/JobCard";
import StatsCard from "../components/StatsCard";
import AddJobModal from "../components/AddJobModal";

export default function Dashboard() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);

  const fetchJobs = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/jobs");
      setJobs(res.data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load jobs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const statusCount = (status) => jobs.filter((j) => j.status === status).length;

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
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {jobs.map((job) => (
              <JobCard
                key={job._id}
                job={job}
                onUpdate={fetchJobs}
                onDelete={fetchJobs}
              />
            ))}
          </div>
        )}
      </div>

      {showAddModal && (
        <AddJobModal
          onClose={() => setShowAddModal(false)}
          onSuccess={fetchJobs}
        />
      )}
    </div>
  );
}

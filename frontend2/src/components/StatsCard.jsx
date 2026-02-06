export default function StatsCard({ title, count, icon }) {
  const colors = {
    Applied: "from-blue-500 to-blue-600",
    Interview: "from-amber-500 to-amber-600",
    Offer: "from-emerald-500 to-emerald-600",
    Rejected: "from-red-500 to-red-600",
  };
  const bg = colors[title] || "from-slate-500 to-slate-600";

  return (
    <div className="card p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-slate-500 font-medium text-sm">{title}</p>
          <p className="text-3xl font-bold text-slate-900 mt-1">{count}</p>
        </div>
        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${bg} flex items-center justify-center text-white shadow-lg`}>
          {icon || (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          )}
        </div>
      </div>
    </div>
  );
}

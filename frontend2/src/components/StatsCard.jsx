export default function StatsCard({ title, count, icon }) {
  const colors = {
    Applied: "from-blue-500 to-blue-600",
    Interview: "from-amber-500 to-amber-600",
    Offer: "from-emerald-500 to-emerald-600",
    Rejected: "from-red-500 to-red-600",
  };
  const bg = colors[title] || "from-slate-500 to-slate-600";
  const icons = {
    Applied: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.5 12L3 9l18-7-7 18-3-7.5z" />
      </svg>
    ),
    Interview: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14h8m-4-4h.01M12 8a4 4 0 100 8 4 4 0 000-8z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 20l4-4" />
      </svg>
    ),
    Offer: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 3v18M6 3h10l-2 4 2 4H6" />
      </svg>
    ),
    Rejected: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 11.5c-1.5.5-3 .5-4.5 0-1.5-.5-3-.5-4.5 0M9 15c.8 1.2 2 2 3 2s2.2-.8 3-2" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3a9 9 0 110 18 9 9 0 010-18z" />
      </svg>
    ),
  };

  return (
    <div className="card p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-slate-500 font-medium text-sm dark:text-slate-400">{title}</p>
          <p className="text-3xl font-bold text-slate-900 mt-1 dark:text-white">{count}</p>
        </div>
        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${bg} flex items-center justify-center text-white shadow-lg`}>
          {icon || icons[title] || (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          )}
        </div>
      </div>
    </div>
  );
}

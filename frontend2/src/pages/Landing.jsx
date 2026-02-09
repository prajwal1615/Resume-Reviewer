import { Link } from "react-router-dom";

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-primary-900 flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center px-4 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 text-primary-300 text-sm font-medium mb-8">
          <span className="w-2 h-2 rounded-full bg-primary-400 animate-pulse" />
          AI-Powered Job Tracking
        </div>
        <h1 className="text-5xl sm:text-6xl font-bold text-white tracking-tight max-w-3xl">
          Laund your dream job with{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-primary-200">
            JobFlow
          </span>
        </h1>
        <p className="text-slate-400 text-lg mt-6 max-w-xl">
          Track applications, get AI resume feedback, and stay organized throughout your job search.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 mt-10">
          <Link
            to="/register"
            className="btn-primary text-lg px-8 py-4 bg-primary-500 hover:bg-primary-400 text-white shadow-glow"
          >
            Get Started Free
          </Link>
          <Link
            to="/login"
            className="px-8 py-4 rounded-xl border border-slate-600 text-slate-300 hover:bg-white/5 hover:text-white font-semibold transition-all"
          >
            Sign In
          </Link>
        </div>

        <div className="mt-16 grid grid-cols-3 gap-8 max-w-2xl text-slate-500">
          <div>
            <p className="text-2xl font-bold text-white">Track</p>
            <p className="text-sm mt-1">All applications in one place</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-white">Analyze</p>
            <p className="text-sm mt-1">AI resume feedback</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-white">Succeed</p>
            <p className="text-sm mt-1">Land your dream role</p>
          </div>
        </div>
      </div>

      <div className="max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              title: "Smart resume review",
              text: "Get ATS-focused feedback, missing keywords, and actionable improvements.",
              img: "https://cdn.pixabay.com/photo/2024/05/10/07/47/businesswoman-8752439_1280.png",
              alt: "Soft 3D business professional illustration",
            },
            {
              title: "Job pipeline clarity",
              text: "Visualize stages, set reminders, and keep your process moving.",
              img: "https://cdn.pixabay.com/photo/2015/10/04/16/45/team-971343_1280.png",
              alt: "Minimal teamwork illustration",
            },
            {
              title: "Exportable insights",
              text: "Download CSV/PDF reports for easy sharing and tracking.",
              img: "https://cdn.pixabay.com/photo/2022/06/11/17/18/abstract-7256616_1280.jpg",
              alt: "Tech neon abstract background",
            },
          ].map((item) => (
            <div key={item.title} className="rounded-2xl border border-slate-700/60 bg-white/5 p-6 text-left">
              <div className="mb-4 overflow-hidden rounded-xl border border-slate-700/40 bg-slate-900/40">
                <img
                  src={item.img}
                  alt={item.alt}
                  className="h-40 w-full object-cover"
                  loading="lazy"
                />
              </div>
              <h3 className="text-lg font-semibold text-white">{item.title}</h3>
              <p className="text-sm text-slate-400 mt-2">{item.text}</p>
            </div>
          ))}
        </div>

        <div className="mt-12 grid grid-cols-1 lg:grid-cols-[2fr,1fr] gap-8 items-center">
          <div className="rounded-3xl border border-slate-700/60 bg-gradient-to-br from-white/5 to-white/0 p-8">
            <p className="text-xs uppercase tracking-widest text-primary-300">
              How it works
            </p>
            <h3 className="text-2xl font-semibold text-white mt-2">
              A clean workflow for every job search
            </h3>
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm text-slate-300">
              <div className="rounded-xl border border-slate-700/60 bg-white/5 p-4">
                <p className="text-white font-semibold">1. Upload</p>
                <p className="mt-1 text-slate-400">Add your resume and job description.</p>
              </div>
              <div className="rounded-xl border border-slate-700/60 bg-white/5 p-4">
                <p className="text-white font-semibold">2. Review</p>
                <p className="mt-1 text-slate-400">Get ATS feedback and action steps.</p>
              </div>
              <div className="rounded-xl border border-slate-700/60 bg-white/5 p-4">
                <p className="text-white font-semibold">3. Track</p>
                <p className="mt-1 text-slate-400">Manage stages and reminders.</p>
              </div>
            </div>
          </div>
          <div className="rounded-3xl border border-slate-700/60 bg-white/5 p-6">
            <p className="text-xs uppercase tracking-widest text-primary-300">
              Built for focus
            </p>
            <p className="text-slate-300 mt-3">
              “JobFlow keeps everything in one place so I can focus on interviews, not spreadsheets.”
            </p>
            <p className="text-sm text-slate-400 mt-4">— Early user</p>
          </div>
        </div>

        <div className="mt-12 rounded-3xl border border-slate-700/60 bg-white/5 p-8 text-center">
          <h3 className="text-2xl font-semibold text-white">Ready to get hired?</h3>
          <p className="text-slate-400 mt-2">
            Start free, then upgrade when you need unlimited reviews.
          </p>
          <div className="mt-6 flex flex-col sm:flex-row justify-center gap-4">
            <Link
              to="/register"
              className="btn-primary text-lg px-8 py-4 bg-primary-500 hover:bg-primary-400 text-white shadow-glow"
            >
              Get Started
            </Link>
            <Link
              to="/pricing"
              className="px-8 py-4 rounded-xl border border-slate-600 text-slate-300 hover:bg-white/5 hover:text-white font-semibold transition-all"
            >
              View Pricing
            </Link>
          </div>
        </div>
      </div>
<div className="h-px bg-gradient-to-r from-transparent via-slate-600 to-transparent" />
      <p className="py-6 text-slate-500 text-sm">
        © {new Date().getFullYear()} JobFlow. Built for job seekers.
      </p>
    </div>
  );
}

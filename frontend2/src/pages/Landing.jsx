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
          Land your dream job with{" "}
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

      <div className="h-px bg-gradient-to-r from-transparent via-slate-600 to-transparent" />
      <p className="py-6 text-slate-500 text-sm">
        © {new Date().getFullYear()} JobFlow. Built for job seekers.
      </p>
    </div>
  );
}

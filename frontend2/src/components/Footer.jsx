import { Link } from "react-router-dom";
import { useFeatureFlags } from "../context/FeatureFlagsContext";

export default function Footer() {
  const { isEnabled } = useFeatureFlags();

  return (
    <footer className="relative mt-16 border-t border-slate-200 bg-slate-900 text-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
          <div className="md:col-span-2">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary-500 text-white flex items-center justify-center font-bold">
                JF
              </div>
              <div>
                <p className="text-lg font-semibold text-white">JobFlow</p>
                <p className="text-xs text-slate-400">Resume + Job Tracker</p>
              </div>
            </div>
            <p className="mt-4 text-sm text-slate-400 max-w-sm">
              Build stronger resumes, track applications, and stay on top of interviews with a clean, focused workflow.
            </p>
            <div className="mt-4 flex items-center gap-3 text-slate-400">
              <a href="https://github.com" className="hover:text-white" aria-label="GitHub">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12c0 4.42 2.87 8.17 6.84 9.49.5.09.68-.22.68-.48 0-.24-.01-.87-.01-1.71-2.78.6-3.37-1.34-3.37-1.34-.45-1.15-1.11-1.46-1.11-1.46-.91-.62.07-.61.07-.61 1 .07 1.53 1.03 1.53 1.03.9 1.53 2.36 1.09 2.94.83.09-.65.35-1.09.63-1.34-2.22-.25-4.56-1.11-4.56-4.95 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.27.1-2.65 0 0 .84-.27 2.75 1.02A9.5 9.5 0 0112 6.8c.85.004 1.7.115 2.5.34 1.9-1.29 2.74-1.02 2.74-1.02.55 1.38.2 2.4.1 2.65.64.7 1.03 1.59 1.03 2.68 0 3.85-2.34 4.7-4.57 4.94.36.31.68.92.68 1.85 0 1.34-.01 2.42-.01 2.75 0 .26.18.58.69.48A10 10 0 0022 12c0-5.52-4.48-10-10-10z" />
                </svg>
              </a>
              <a href="https://linkedin.com" className="hover:text-white" aria-label="LinkedIn">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M4.98 3.5a2.5 2.5 0 11-.01 5.01 2.5 2.5 0 01.01-5.01zM3 9h4v12H3zM9 9h3.8v1.7h.1c.5-.9 1.8-1.9 3.7-1.9 3.9 0 4.6 2.6 4.6 5.9V21h-4v-5.4c0-1.3 0-3-1.9-3-1.9 0-2.2 1.4-2.2 2.9V21H9z" />
                </svg>
              </a>
              <a href="https://twitter.com" className="hover:text-white" aria-label="X">
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2H21l-6.518 7.46L22 22h-6.828l-5.34-6.965L3.75 22H1l6.98-7.98L2 2h7l4.83 6.28L18.244 2zm-1.2 18h1.89L8.06 4H6.03l10.99 16z" />
                </svg>
              </a>
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold text-white mb-3">Product</p>
            <ul className="space-y-2 text-sm text-slate-400">
              <li><Link to="/dashboard" className="hover:text-white">Job Tracker</Link></li>
              {isEnabled("resume_review") && (
                <li><Link to="/resume-review" className="hover:text-white">Resume Review</Link></li>
              )}
              {isEnabled("premium_pricing") && (
                <li><Link to="/pricing" className="hover:text-white">Pricing</Link></li>
              )}
            </ul>
          </div>

          <div>
            <p className="text-sm font-semibold text-white mb-3">Resources</p>
            <ul className="space-y-2 text-sm text-slate-400">
              <li><Link to="/help" className="hover:text-white">Help & Docs</Link></li>
              <li><a href="mailto:support@jobflow.app" className="hover:text-white">Contact</a></li>
              <li><a href="https://status.example.com" className="hover:text-white">Status</a></li>
            </ul>
          </div>

          <div>
            <p className="text-sm font-semibold text-white mb-3">Legal</p>
            <ul className="space-y-2 text-sm text-slate-400">
              <li><a href="#" className="hover:text-white">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-white">Terms of Use</a></li>
              <li><a href="#" className="hover:text-white">Refund Policy</a></li>
            </ul>
          </div>
          <div>
            <p className="text-sm font-semibold text-white mb-3">Get in touch</p>
            <p className="text-sm text-slate-400">
              <a href="mailto:support@jobflow.app" className="hover:text-white">
                support@jobflow.app
              </a>
            </p>
          </div>
        </div>

        <div className="mt-4 border-t border-slate-800 pt-4 text-xs text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>© 2026 JobFlow. All rights reserved.</p>
          <p>Made for focused job seekers.</p>
        </div>
      </div>
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        className="absolute right-8 top-[12%] inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-800 px-4 py-1.5 text-sm text-slate-200 hover:bg-slate-700"
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
        </svg>
        Back to top
      </button>
    </footer>
  );
}

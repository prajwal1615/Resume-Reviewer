import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useFeatureFlags } from "../context/FeatureFlagsContext";

export default function PaymentSuccess() {
  const [status, setStatus] = useState("activating");
  const [message, setMessage] = useState("");
  const { isEnabled } = useFeatureFlags();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const txnid = params.get("txnid");
    setStatus("done");
    setMessage(
      txnid
        ? `Premium unlocked. Transaction ${txnid} completed.`
        : "Premium unlocked. You can now run unlimited reviews."
    );
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-primary-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <div className="max-w-xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <div className="mx-auto h-16 w-16 rounded-2xl bg-emerald-100 flex items-center justify-center">
          <svg className="h-8 w-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mt-6 dark:text-slate-100">
          Payment successful
        </h1>
        <p className="text-slate-600 mt-2 dark:text-slate-300">
          {status === "activating" ? "Activating premium..." : message}
        </p>
        {isEnabled("resume_review") ? (
          <Link to="/resume-review" className="btn-primary inline-flex mt-6">
            Go to Resume Review
          </Link>
        ) : (
          <Link to="/dashboard" className="btn-primary inline-flex mt-6">
            Go to Dashboard
          </Link>
        )}
      </div>
    </div>
  );
}

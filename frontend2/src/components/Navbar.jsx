import { Link, useLocation } from "react-router-dom";

export default function Navbar() {
  const location = useLocation();
  const isAuth = !!localStorage.getItem("token");

  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.href = "/";
  };

  if (!isAuth) return null;

  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/dashboard" className="flex items-center gap-2">
            <span className="text-2xl font-800 text-primary-600 tracking-tight">
              JobFlow
            </span>
          </Link>

          <div className="flex items-center gap-6">
            <Link
              to="/dashboard"
              className={`font-medium transition-colors ${
                location.pathname === "/dashboard"
                  ? "text-primary-600"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Dashboard
            </Link>
            <Link
              to="/resume-review"
              className={`font-medium transition-colors ${
                location.pathname === "/resume-review"
                  ? "text-primary-600"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Resume Review
            </Link>
            <button
              onClick={handleLogout}
              className="text-slate-600 hover:text-red-600 font-medium transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}

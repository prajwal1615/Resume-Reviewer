import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Link, useLocation, useNavigate } from "react-router-dom";
import api from "../api/axios";
import { useNotifications } from "../context/NotificationsContext";
import { useTranslation } from "react-i18next";
import { useFeatureFlags } from "../context/FeatureFlagsContext";

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const isAuth = !!localStorage.getItem("token");
  const { t, i18n } = useTranslation();
  const { isEnabled } = useFeatureFlags();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [profile, setProfile] = useState({
    name: "",
    avatarUrl: "",
    themePreference: "light",
    languagePreference: "en",
    role: "user",
  });
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [profilePinned, setProfilePinned] = useState(false);
  const [notificationsPinned, setNotificationsPinned] = useState(false);
  const [showHelpMenu, setShowHelpMenu] = useState(false);
  const [theme, setTheme] = useState(() => {
    if (typeof window === "undefined") return "light";
    return localStorage.getItem("theme") || "light";
  });
  const profileRef = useRef(null);
  const notificationsRef = useRef(null);
  const helpRef = useRef(null);
  const profileTimerRef = useRef(null);
  const notificationsTimerRef = useRef(null);
  const { notifications, unreadCount, markAllRead, markRead } =
    useNotifications();

  useEffect(() => {
    if (!isAuth) return;
    let isMounted = true;
    api
      .get("/users/me")
      .then((res) => {
        if (isMounted) {
          setProfile({
            name: res.data?.name || "",
            avatarUrl: res.data?.avatarUrl || "",
            themePreference: res.data?.themePreference || "light",
            languagePreference: res.data?.languagePreference || "en",
            isPremium: res.data?.isPremium || false,
            premiumUntil: res.data?.premiumUntil || null,
            role: res.data?.role || "user",
          });
          const preferred = res.data?.themePreference === "dark" ? "dark" : "light";
          setTheme(preferred);
          const preferredLanguage = res.data?.languagePreference || "en";
          i18n.changeLanguage(preferredLanguage);
          if (typeof window !== "undefined") {
            localStorage.setItem("theme", preferred);
            localStorage.setItem("language", preferredLanguage);
          }
        }
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, [isAuth]);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    if (typeof window !== "undefined") {
      localStorage.setItem("theme", theme);
    }
  }, [theme]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.href = "/";
  };

  const handleProfileClick = () => {
    setShowProfileMenu(false);
    setProfilePinned(false);
    navigate("/profile");
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      const profileEl = profileRef.current;
      const notifyEl = notificationsRef.current;
      const helpEl = helpRef.current;
      const clickedProfile = profileEl && profileEl.contains(event.target);
      const clickedNotify = notifyEl && notifyEl.contains(event.target);
      const clickedHelp = helpEl && helpEl.contains(event.target);
      if (!clickedProfile) {
        setShowProfileMenu(false);
        setProfilePinned(false);
      }
      if (!clickedNotify) {
        setShowNotifications(false);
        setNotificationsPinned(false);
      }
      if (!clickedHelp) {
        setShowHelpMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const clearProfileTimer = () => {
    if (profileTimerRef.current) {
      clearTimeout(profileTimerRef.current);
      profileTimerRef.current = null;
    }
  };

  const clearNotificationsTimer = () => {
    if (notificationsTimerRef.current) {
      clearTimeout(notificationsTimerRef.current);
      notificationsTimerRef.current = null;
    }
  };

  if (!isAuth) return null;

  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-200/80 dark:bg-slate-950/80 dark:border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/dashboard" className="flex items-center gap-2">
            <span className="text-2xl font-extrabold text-primary-600 tracking-tight">
              JobFlow
            </span>
          </Link>

          <div className="flex items-center gap-6">
            <button
              type="button"
              onClick={() => navigate("/dashboard?view=calendar&date=today")}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 hover:text-slate-900 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-200 dark:hover:text-white"
              title="Calendar"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10m-11 9h12a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </button>
            <Link
              to="/dashboard"
              className={`font-medium transition-colors ${
                location.pathname === "/dashboard"
                  ? "text-primary-600"
                  : "text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
              }`}
            >
              {t("nav.dashboard")}
            </Link>
            {isEnabled("resume_review") && (
              <Link
                to="/resume-review"
                className={`font-medium transition-colors ${
                  location.pathname === "/resume-review"
                    ? "text-primary-600"
                    : "text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
                }`}
              >
                {t("nav.resumeReview")}
              </Link>
            )}
            {profile.role === "admin" && (
              <Link
                to="/admin/users"
                className={`font-medium transition-colors ${
                  location.pathname === "/admin/users"
                    ? "text-primary-600"
                    : "text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
                }`}
              >
                Admin
              </Link>
            )}
            {profile.role === "admin" && (
              <Link
                to="/admin/feature-flags"
                className={`font-medium transition-colors ${
                  location.pathname === "/admin/feature-flags"
                    ? "text-primary-600"
                    : "text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
                }`}
              >
                Flags
              </Link>
            )}
            {isEnabled("premium_pricing") && (
              <Link
                to="/pricing"
                className={`hidden sm:inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-semibold transition-colors ${
                  profile.role === "admin"
                    ? "border-amber-200 bg-amber-50 text-amber-700"
                    : profile.isPremium
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                    : "border-primary-200 bg-primary-50 text-primary-700 hover:border-primary-300"
                }`}
              >
                {profile.role === "admin"
                  ? "Admin Access"
                  : profile.isPremium
                    ? "Premium"
                    : "Upgrade"}
                {profile.role === "admin" ? (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
                    Unlimited
                  </span>
                ) : profile.isPremium ? (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                    Active
                  </span>
                ) : (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary-100 text-primary-700">
                    Free
                  </span>
                )}
              </Link>
            )}
            <div className="relative" ref={helpRef}>
              <button
                type="button"
                onClick={() => setShowHelpMenu((prev) => !prev)}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 hover:text-slate-900 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-200 dark:hover:text-white"
                title="Help"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9a3.5 3.5 0 116.544 1.75c-.732.78-1.272 1.199-1.272 2.25v.5M12 17h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>
              {showHelpMenu && (
                <div className="absolute right-0 mt-3 w-48 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg dark:border-slate-800 dark:bg-slate-900">
                  <button
                    type="button"
                    onClick={() => {
                      setShowHelpMenu(false);
                      navigate("/help");
                    }}
                    className="flex w-full items-center gap-2 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800"
                  >
                    FAQ & Docs
                  </button>
                  <a
                    href="mailto:support@jobflow.app"
                    className="flex w-full items-center gap-2 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800"
                  >
                    Contact support
                  </a>
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={async () => {
                const next = theme === "dark" ? "light" : "dark";
                setTheme(next);
                try {
                  await api.put("/users/me/theme", { theme: next });
                } catch (err) {
                  console.error(err);
                }
              }}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 hover:text-slate-900 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-200 dark:hover:text-white"
              title="Toggle theme"
            >
              {theme === "dark" ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v2m0 14v2m9-9h-2M5 12H3m15.364-6.364-1.414 1.414M7.05 16.95l-1.414 1.414M16.95 16.95l1.414 1.414M7.05 7.05 5.636 5.636M12 8a4 4 0 100 8 4 4 0 000-8z" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12.79A9 9 0 1111.21 3a7 7 0 109.79 9.79z" />
                </svg>
              )}
            </button>
            <div
              className="relative"
              ref={notificationsRef}
              onMouseEnter={() => {
                clearNotificationsTimer();
                setShowNotifications(true);
              }}
              onMouseLeave={() => {
                if (!notificationsPinned) {
                  clearNotificationsTimer();
                  notificationsTimerRef.current = setTimeout(() => {
                    setShowNotifications(false);
                  }, 180);
                }
              }}
            >
              <button
                type="button"
                onClick={() => {
                  setShowNotifications(true);
                  setNotificationsPinned(true);
                }}
                className="relative flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 hover:text-slate-900 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-200 dark:hover:text-white"
                title={t("nav.notifications")}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 00-4-5.659V4a2 2 0 10-4 0v1.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0a3 3 0 11-6 0h6z" />
                </svg>
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-5 min-w-[20px] rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </button>
              {showNotifications && (
                <div className="absolute right-0 mt-3 w-80 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg dark:border-slate-800 dark:bg-slate-900">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800">
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                      {t("nav.notifications")}
                    </p>
                    <button
                      onClick={() => markAllRead()}
                      className="text-xs text-primary-600 hover:text-primary-700"
                    >
                      {t("nav.markAllRead")}
                    </button>
                  </div>
                  <div className="max-h-72 overflow-auto">
                    {notifications.length === 0 ? (
                      <p className="p-4 text-sm text-slate-500 dark:text-slate-400">
                        {t("nav.noNotifications")}
                      </p>
                    ) : (
                      notifications.map((note) => (
                        <button
                          key={note.id}
                          onClick={() => markRead(note.id)}
                          className={`w-full text-left px-4 py-3 border-b border-slate-100 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800 ${
                            note.read ? "bg-white dark:bg-slate-900" : "bg-primary-50/40 dark:bg-primary-900/30"
                          }`}
                        >
                          <p className="text-sm font-medium text-slate-800 dark:text-slate-100">
                            {note.title}
                          </p>
                          {note.message && (
                            <p className="text-xs text-slate-500 mt-1 dark:text-slate-400">
                              {note.message}
                            </p>
                          )}
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
            <div
              className="relative"
              ref={profileRef}
              onMouseEnter={() => {
                clearProfileTimer();
                setShowProfileMenu(true);
              }}
              onMouseLeave={() => {
                if (!profilePinned) {
                  clearProfileTimer();
                  profileTimerRef.current = setTimeout(() => {
                    setShowProfileMenu(false);
                  }, 180);
                }
              }}
            >
              <button
                type="button"
                onClick={() => {
                  setShowProfileMenu(true);
                  setProfilePinned(true);
                }}
                className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-slate-100 dark:bg-slate-800 dark:border-slate-700"
                title="Profile"
              >
                {profile.avatarUrl ? (
                  <img
                    src={profile.avatarUrl}
                    alt="Profile"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="text-sm font-semibold text-slate-500">
                    {profile.name ? profile.name.charAt(0).toUpperCase() : "U"}
                  </span>
                )}
              </button>

              {showProfileMenu && (
                <div
                  className="absolute right-0 mt-3 w-44 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg dark:border-slate-800 dark:bg-slate-900"
                >
                  <button
                    type="button"
                    onClick={handleProfileClick}
                    className="flex w-full items-center gap-2 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800"
                  >
                    {t("nav.profile")}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowProfileMenu(false);
                      setShowLogoutConfirm(true);
                    }}
                    className="flex w-full items-center gap-2 px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                  >
                    {t("nav.logout")}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {showLogoutConfirm &&
        createPortal(
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" style={{ minHeight: "100dvh" }}>
            <div
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setShowLogoutConfirm(false)}
              aria-hidden="true"
            />
            <div className="relative bg-white rounded-xl shadow-xl p-6 w-full max-w-sm mx-auto">
              <p className="text-slate-800 font-medium mb-1">{t("nav.signOutTitle")}</p>
              <p className="text-slate-500 text-sm mb-6">{t("nav.signOutBody")}</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowLogoutConfirm(false)}
                  className="flex-1 px-4 py-2.5 rounded-lg border border-slate-200 text-slate-700 font-medium hover:bg-slate-50 transition-colors"
                >
                  {t("nav.cancel")}
                </button>
                <button
                  onClick={handleLogout}
                  className="flex-1 px-4 py-2.5 rounded-lg bg-red-600 text-white font-medium hover:bg-red-700 transition-colors"
                >
                  {t("nav.signOut")}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </nav>
  );
}

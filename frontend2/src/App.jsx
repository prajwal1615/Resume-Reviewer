import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import i18n from "./i18n";
import Navbar from "./components/Navbar";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Landing from "./pages/Landing";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import ResumeReview from "./pages/ResumeReview";
import Profile from "./pages/Profile";
import Pricing from "./pages/Pricing";
import PaymentSuccess from "./pages/PaymentSuccess";
import PaymentFailure from "./pages/PaymentFailure";
import Help from "./pages/Help";
import AdminUsers from "./pages/AdminUsers";
import api from "./api/axios";
import { NotificationsProvider } from "./context/NotificationsContext";
import { FeatureFlagsProvider, useFeatureFlags } from "./context/FeatureFlagsContext";
import Footer from "./components/Footer";
import ChatWidget from "./components/ChatWidget";
import AdminFeatureFlags from "./pages/AdminFeatureFlags";

const isAuthenticated = () => !!localStorage.getItem("token");

function ProtectedRoute({ children }) {
  return isAuthenticated() ? children : <Navigate to="/login" replace />;
}

function AdminRoute({ children }) {
  const [checking, setChecking] = useState(true);
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    let mounted = true;
    api
      .get("/users/me")
      .then((res) => {
        if (!mounted) return;
        setAllowed(res.data?.role === "admin");
      })
      .catch(() => {
        if (!mounted) return;
        setAllowed(false);
      })
      .finally(() => {
        if (!mounted) return;
        setChecking(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  if (checking) {
    return <div className="p-8 text-center text-slate-500">Checking admin access...</div>;
  }

  return allowed ? children : <Navigate to="/dashboard" replace />;
}

function FeatureRoute({ flag, children }) {
  const { loading, isEnabled } = useFeatureFlags();

  if (loading) {
    return <div className="p-8 text-center text-slate-500">Loading features...</div>;
  }

  return isEnabled(flag) ? children : <Navigate to="/dashboard" replace />;
}

function FeatureWidgetGate() {
  const { loading, isEnabled } = useFeatureFlags();
  if (loading || !isEnabled("chat_widget")) return null;
  return <ChatWidget />;
}

function ScrollToTop() {
  const location = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [location.pathname]);
  return null;
}

function App() {
  useEffect(() => {
    const hasToken = !!localStorage.getItem("token");
    if (hasToken) return;

    const storedLanguage = localStorage.getItem("language") || "en";
    i18n.changeLanguage(storedLanguage);

    const stored = localStorage.getItem("theme");
    if (stored === "dark" || stored === "light") {
      document.documentElement.classList.toggle("dark", stored === "dark");
      return;
    }

    const prefersDark = window.matchMedia?.("(prefers-color-scheme: dark)").matches;
    document.documentElement.classList.toggle("dark", prefersDark);
  }, []);

  return (
    <NotificationsProvider>
      <FeatureFlagsProvider>
        <BrowserRouter>
          <ScrollToTop />
          <Navbar />
          <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route
            path="/pricing"
            element={
              <ProtectedRoute>
                <FeatureRoute flag="premium_pricing">
                  <Pricing />
                </FeatureRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/payment-success"
            element={<PaymentSuccess />}
          />
          <Route
            path="/payment-failure"
            element={<PaymentFailure />}
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/resume-review"
            element={
              <ProtectedRoute>
                <FeatureRoute flag="resume_review">
                  <ResumeReview />
                </FeatureRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/help"
            element={
              <ProtectedRoute>
                <Help />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <ProtectedRoute>
                <AdminRoute>
                  <AdminUsers />
                </AdminRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/feature-flags"
            element={
              <ProtectedRoute>
                <AdminRoute>
                  <AdminFeatureFlags />
                </AdminRoute>
              </ProtectedRoute>
            }
          />
          </Routes>
          <FeatureWidgetGate />
          <Footer />
        </BrowserRouter>
      </FeatureFlagsProvider>
    </NotificationsProvider>
  );
}

export default App;

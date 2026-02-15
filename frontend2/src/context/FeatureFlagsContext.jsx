import { createContext, useContext, useEffect, useMemo, useState } from "react";
import api from "../api/axios";

const DEFAULT_FLAGS = {
  resume_review: true,
  chat_widget: true,
  premium_pricing: true,
};

const FeatureFlagsContext = createContext({
  flags: DEFAULT_FLAGS,
  isAdmin: false,
  loading: true,
  refreshFlags: async () => {},
  isEnabled: () => true,
});

export function FeatureFlagsProvider({ children }) {
  const [flags, setFlags] = useState(DEFAULT_FLAGS);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchFlags = async () => {
    setLoading(true);
    try {
      const hasToken = !!localStorage.getItem("token");
      const [flagsRes, meRes] = await Promise.all([
        api.get("/features"),
        hasToken ? api.get("/users/me") : Promise.resolve({ data: { role: "user" } }),
      ]);
      setFlags((prev) => ({ ...prev, ...(flagsRes.data?.flags || {}) }));
      setIsAdmin(meRes.data?.role === "admin");
    } catch {
      setFlags(DEFAULT_FLAGS);
      setIsAdmin(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFlags();
  }, []);

  const value = useMemo(
    () => ({
      flags,
      isAdmin,
      loading,
      refreshFlags: fetchFlags,
      isEnabled: (key) => (isAdmin ? true : Boolean(flags[key])),
    }),
    [flags, isAdmin, loading]
  );

  return (
    <FeatureFlagsContext.Provider value={value}>
      {children}
    </FeatureFlagsContext.Provider>
  );
}

export function useFeatureFlags() {
  return useContext(FeatureFlagsContext);
}

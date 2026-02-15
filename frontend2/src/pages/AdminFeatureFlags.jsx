import { useEffect, useState } from "react";
import api from "../api/axios";
import { useFeatureFlags } from "../context/FeatureFlagsContext";

export default function AdminFeatureFlags() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [savingKey, setSavingKey] = useState("");
  const { refreshFlags } = useFeatureFlags();

  const loadFlags = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/admin/feature-flags");
      setItems(res.data?.items || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load feature flags.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFlags();
  }, []);

  const toggleFlag = async (item) => {
    setSavingKey(item.key);
    setError("");
    try {
      const next = !item.enabled;
      const res = await api.patch(`/admin/feature-flags/${item.key}`, { enabled: next });
      setItems((prev) =>
        prev.map((flag) => (flag.key === item.key ? { ...flag, ...res.data.item } : flag))
      );
      await refreshFlags();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update feature flag.");
    } finally {
      setSavingKey("");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-primary-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
            Feature Flags
          </h1>
          <p className="text-slate-600 mt-1 dark:text-slate-300">
            Enable or disable features instantly without a deploy.
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</div>
        )}

        <div className="card overflow-hidden">
          {loading ? (
            <div className="p-6 text-slate-500">Loading feature flags...</div>
          ) : (
            <div className="divide-y divide-slate-100">
              {items.map((item) => (
                <div
                  key={item.key}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4"
                >
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{item.key}</p>
                    <p className="text-sm text-slate-600">{item.description}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleFlag(item)}
                    disabled={savingKey === item.key}
                    className={`rounded-lg px-3 py-2 text-xs font-semibold transition-colors disabled:opacity-60 ${
                      item.enabled
                        ? "bg-emerald-600 text-white hover:bg-emerald-700"
                        : "bg-slate-700 text-white hover:bg-slate-800"
                    }`}
                  >
                    {savingKey === item.key
                      ? "Saving..."
                      : item.enabled
                        ? "Enabled"
                        : "Disabled"}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

import { useEffect, useState } from "react";
import api from "../api/axios";

export default function AdminUsers() {
  const [search, setSearch] = useState("");
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState("");

  const fetchUsers = async (query = "") => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/admin/users", {
        params: { q: query, page: 1, limit: 50 },
      });
      setUsers(res.data?.items || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load users.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchUsers(search.trim());
  };

  const toggleBlock = async (user) => {
    setUpdatingId(user._id);
    setError("");
    try {
      const res = await api.patch(`/admin/users/${user._id}/block`, {
        blocked: !user.isBlocked,
      });
      setUsers((prev) =>
        prev.map((item) => (item._id === user._id ? { ...item, ...res.data.user } : item))
      );
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update user status.");
    } finally {
      setUpdatingId("");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-primary-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Admin Users</h1>
          <p className="text-slate-600 mt-1 dark:text-slate-300">
            View users, search accounts, and block/unblock abusive users.
          </p>
        </div>

        <form onSubmit={handleSearch} className="card p-4 mb-4 flex flex-col sm:flex-row gap-3">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email"
            className="input-field flex-1"
          />
          <button type="submit" className="btn-primary sm:w-auto">
            Search
          </button>
        </form>

        {error && (
          <div className="mb-4 rounded-xl bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="card overflow-hidden">
          {loading ? (
            <div className="p-6 text-slate-500">Loading users...</div>
          ) : users.length === 0 ? (
            <div className="p-6 text-slate-500">No users found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr className="text-left text-slate-600">
                    <th className="px-4 py-3 font-semibold">Name</th>
                    <th className="px-4 py-3 font-semibold">Email</th>
                    <th className="px-4 py-3 font-semibold">Role</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                    <th className="px-4 py-3 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user._id} className="border-b last:border-b-0 border-slate-100">
                      <td className="px-4 py-3 text-slate-800">{user.name || "-"}</td>
                      <td className="px-4 py-3 text-slate-600">{user.email}</td>
                      <td className="px-4 py-3">
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                          {user.role}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                            user.isBlocked
                              ? "bg-red-100 text-red-700"
                              : "bg-emerald-100 text-emerald-700"
                          }`}
                        >
                          {user.isBlocked ? "Blocked" : "Active"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => toggleBlock(user)}
                          disabled={updatingId === user._id}
                          className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors disabled:opacity-60 ${
                            user.isBlocked
                              ? "bg-emerald-600 text-white hover:bg-emerald-700"
                              : "bg-red-600 text-white hover:bg-red-700"
                          }`}
                        >
                          {updatingId === user._id
                            ? "Updating..."
                            : user.isBlocked
                              ? "Unblock"
                              : "Block"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

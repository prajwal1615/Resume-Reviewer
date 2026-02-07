import { useEffect, useRef, useState } from "react";
import api from "../api/axios";

const emptyProfile = {
  name: "",
  email: "",
  title: "",
  location: "",
  phone: "",
  bio: "",
  website: "",
  linkedin: "",
  github: "",
  avatarUrl: "",
};

export default function Profile() {
  const [profile, setProfile] = useState(emptyProfile);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const fileInputRef = useRef(null);

  const fetchProfile = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/users/me");
      setProfile((prev) => ({ ...prev, ...res.data }));
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load profile.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleChange = (field) => (e) => {
    setProfile((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const payload = {
        name: profile.name,
        title: profile.title,
        location: profile.location,
        phone: profile.phone,
        bio: profile.bio,
        website: profile.website,
        linkedin: profile.linkedin,
        github: profile.github,
      };
      const res = await api.put("/users/me", payload);
      setProfile((prev) => ({ ...prev, ...res.data }));
      setSuccess("Profile updated.");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Please select an image file.");
      return;
    }
    setUploading(true);
    setError("");
    setSuccess("");
    try {
      const formData = new FormData();
      formData.append("avatar", file);
      const res = await api.post("/users/me/avatar", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setProfile((prev) => ({ ...prev, ...res.data }));
      setSuccess("Photo updated.");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to upload photo.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-primary-50/30">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Profile</h1>
          <p className="text-slate-600 mt-1">
            Keep your details updated to personalize your experience.
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded-xl bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-700">
            {success}
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
          <div className="card p-6">
            <div className="flex flex-col items-center text-center">
              <div className="h-28 w-28 overflow-hidden rounded-2xl bg-slate-100">
                {profile.avatarUrl ? (
                  <img
                    src={profile.avatarUrl}
                    alt="Profile"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-3xl font-semibold text-slate-400">
                    {profile.name ? profile.name.charAt(0).toUpperCase() : "?"}
                  </div>
                )}
              </div>
              <h2 className="mt-4 text-lg font-semibold text-slate-900">
                {profile.name || "Your Name"}
              </h2>
              <p className="text-sm text-slate-500">
                {profile.title || "Add a title"}
              </p>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="mt-4 w-full rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
              >
                {uploading ? "Uploading..." : "Upload Photo"}
              </button>
            </div>
          </div>

          <form onSubmit={handleSave} className="card p-6">
            {loading ? (
              <div className="py-10 text-center text-slate-500">
                Loading profile...
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="text-sm font-medium text-slate-700">
                    Name
                  </label>
                  <input
                    className="input-field mt-2"
                    value={profile.name || ""}
                    onChange={handleChange("name")}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700">
                    Title
                  </label>
                  <input
                    className="input-field mt-2"
                    value={profile.title || ""}
                    onChange={handleChange("title")}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700">
                    Location
                  </label>
                  <input
                    className="input-field mt-2"
                    value={profile.location || ""}
                    onChange={handleChange("location")}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700">
                    Phone
                  </label>
                  <input
                    className="input-field mt-2"
                    value={profile.phone || ""}
                    onChange={handleChange("phone")}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700">
                    Email
                  </label>
                  <input
                    className="input-field mt-2 bg-slate-50"
                    value={profile.email || ""}
                    disabled
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700">
                    Website
                  </label>
                  <input
                    className="input-field mt-2"
                    value={profile.website || ""}
                    onChange={handleChange("website")}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700">
                    LinkedIn
                  </label>
                  <input
                    className="input-field mt-2"
                    value={profile.linkedin || ""}
                    onChange={handleChange("linkedin")}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700">
                    GitHub
                  </label>
                  <input
                    className="input-field mt-2"
                    value={profile.github || ""}
                    onChange={handleChange("github")}
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-sm font-medium text-slate-700">
                    Bio
                  </label>
                  <textarea
                    className="input-field mt-2 min-h-[120px] resize-y"
                    value={profile.bio || ""}
                    onChange={handleChange("bio")}
                  />
                </div>
              </div>
            )}

            <div className="mt-6 flex justify-end">
              <button
                type="submit"
                className="btn-primary"
                disabled={saving || loading}
              >
                {saving ? "Saving..." : "Save Profile"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

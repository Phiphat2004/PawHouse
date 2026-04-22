import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AdminLayout } from "../../components/admin";
import { authApi } from "../../services/api";
import { ROUTES, STORAGE_KEYS } from "../../utils/constants";

export default function AdminEditProfilePage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState("");

  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    gender: "",
    dob: "",
    addressLine: "",
    ward: "",
    district: "",
    city: "",
    avatarUrl: "",
    marketingEmail: true,
    pushNotification: true,
  });

  useEffect(() => {
    async function loadProfile() {
      const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
      if (!token) {
        navigate(ROUTES.LOGIN);
        return;
      }

      try {
        const data = await authApi.me();
        const user = data.user;

        setForm({
          fullName: user.profile?.fullName || "",
          phone: user.phone || "",
          gender: user.profile?.gender || "",
          dob: user.profile?.dob ? user.profile.dob.split("T")[0] : "",
          addressLine: user.profile?.address?.addressLine || "",
          ward: user.profile?.address?.ward || "",
          district: user.profile?.address?.district || "",
          city: user.profile?.address?.city || "",
          avatarUrl: user.profile?.avatarUrl || "",
          marketingEmail: user.settings?.marketingEmail ?? true,
          pushNotification: user.settings?.pushNotification ?? true,
        });

        setAvatarPreview(user.profile?.avatarUrl || "");
      } catch (err) {
        setError(err.message || "Unable to load profile information");
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, [navigate]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleAvatarFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Only image files are accepted");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Image file must not exceed 5MB");
      return;
    }

    setError("");
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleAvatarUrlChange = (e) => {
    const url = e.target.value;
    setForm((prev) => ({ ...prev, avatarUrl: url }));
    setAvatarFile(null);
    setAvatarPreview(url || "");
  };

  const handleRemoveAvatar = () => {
    setAvatarFile(null);
    setAvatarPreview("");
    setForm((prev) => ({ ...prev, avatarUrl: "" }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      let responseData;

      if (avatarFile) {
        const formData = new FormData();
        formData.append("avatar", avatarFile);
        formData.append("fullName", form.fullName);
        if (form.phone) formData.append("phone", form.phone);
        if (form.gender) formData.append("gender", form.gender);
        if (form.dob) formData.append("dob", form.dob);
        formData.append(
          "address",
          JSON.stringify({
            addressLine: form.addressLine,
            ward: form.ward,
            district: form.district,
            city: form.city,
          }),
        );
        formData.append(
          "settings",
          JSON.stringify({
            marketingEmail: form.marketingEmail,
            pushNotification: form.pushNotification,
          }),
        );
        responseData = await authApi.updateProfile(formData);
      } else {
        responseData = await authApi.updateProfile({
          fullName: form.fullName,
          phone: form.phone || undefined,
          gender: form.gender || undefined,
          dob: form.dob || undefined,
          avatarUrl: form.avatarUrl || undefined,
          address: {
            addressLine: form.addressLine,
            ward: form.ward,
            district: form.district,
            city: form.city,
          },
          settings: {
            marketingEmail: form.marketingEmail,
            pushNotification: form.pushNotification,
          },
        });
      }

      const storedUser = localStorage.getItem(STORAGE_KEYS.USER);
      if (storedUser) {
        const cachedUser = JSON.parse(storedUser);
        cachedUser.fullName = responseData.user.profile?.fullName || cachedUser.fullName;
        cachedUser.avatarUrl = responseData.user.profile?.avatarUrl || cachedUser.avatarUrl;
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(cachedUser));
      }

      setSuccess("Profile updated successfully");
      setTimeout(() => {
        navigate(ROUTES.ADMIN_PROFILE);
      }, 900);
    } catch (err) {
      setError(err.message || "Unable to update profile");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout>
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Edit Admin Profile</h1>
            <p className="mt-1 text-sm text-gray-500">Profile editing page for admin/staff.</p>
          </div>
          <Link
            to={ROUTES.ADMIN_PROFILE}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Back
          </Link>
        </div>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        )}
        {success && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{success}</div>
        )}

        {loading ? (
          <div className="flex h-56 items-center justify-center rounded-2xl bg-white shadow-sm">
            <div className="text-sm text-gray-500">Loading data...</div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6 rounded-2xl bg-white p-6 shadow-sm">
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900">Profile Picture</h2>
              <div className="flex flex-col items-center gap-4 sm:flex-row">
                <div className="relative h-24 w-24 overflow-hidden rounded-full border-4 border-white shadow">
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="Avatar preview" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gray-100 text-3xl">👤</div>
                  )}
                </div>
                <div className="flex-1 space-y-3">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarFileChange}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                  />
                  <input
                    type="url"
                    name="avatarUrl"
                    value={form.avatarUrl}
                    onChange={handleAvatarUrlChange}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                    placeholder="Or paste an image URL"
                  />
                  {avatarPreview && (
                    <button
                      type="button"
                      onClick={handleRemoveAvatar}
                      className="text-sm font-medium text-red-600 hover:text-red-700"
                    >
                      Remove Photo
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <input
                name="fullName"
                value={form.fullName}
                onChange={handleChange}
                placeholder="Full Name"
                className="rounded-lg border border-gray-200 px-3 py-2"
              />
              <input
                name="phone"
                value={form.phone}
                onChange={handleChange}
                placeholder="Phone Number"
                className="rounded-lg border border-gray-200 px-3 py-2"
              />
              <select
                name="gender"
                value={form.gender}
                onChange={handleChange}
                className="rounded-lg border border-gray-200 px-3 py-2"
              >
                <option value="">Gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
              <input
                type="date"
                name="dob"
                value={form.dob}
                onChange={handleChange}
                className="rounded-lg border border-gray-200 px-3 py-2"
              />
              <input
                name="addressLine"
                value={form.addressLine}
                onChange={handleChange}
                placeholder="Address"
                className="rounded-lg border border-gray-200 px-3 py-2"
              />
              <input
                name="ward"
                value={form.ward}
                onChange={handleChange}
                placeholder="Ward / Commune"
                className="rounded-lg border border-gray-200 px-3 py-2"
              />
              <input
                name="district"
                value={form.district}
                onChange={handleChange}
                placeholder="District"
                className="rounded-lg border border-gray-200 px-3 py-2"
              />
              <input
                name="city"
                value={form.city}
                onChange={handleChange}
                placeholder="Province / City"
                className="rounded-lg border border-gray-200 px-3 py-2"
              />
            </div>

            <div className="flex items-center gap-6 text-sm">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="marketingEmail"
                  checked={form.marketingEmail}
                  onChange={handleChange}
                />
                Receive Marketing Emails
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="pushNotification"
                  checked={form.pushNotification}
                  onChange={handleChange}
                />
                Receive Push Notifications
              </label>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full rounded-xl bg-linear-to-r from-orange-500 to-amber-500 px-5 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </form>
        )}
      </div>
    </AdminLayout>
  );
}

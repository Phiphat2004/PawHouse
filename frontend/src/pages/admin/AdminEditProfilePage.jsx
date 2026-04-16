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
        setError(err.message || "Không thể tải thông tin hồ sơ");
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
      setError("Chỉ chấp nhận file ảnh");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("File ảnh không được vượt quá 5MB");
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

      setSuccess("Cập nhật thông tin thành công");
      setTimeout(() => {
        navigate(ROUTES.ADMIN_PROFILE);
      }, 900);
    } catch (err) {
      setError(err.message || "Không thể cập nhật thông tin");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout>
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Chỉnh sửa hồ sơ quản trị</h1>
            <p className="mt-1 text-sm text-gray-500">Trang chỉnh sửa riêng cho admin/staff.</p>
          </div>
          <Link
            to={ROUTES.ADMIN_PROFILE}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Quay lại
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
            <div className="text-sm text-gray-500">Đang tải dữ liệu...</div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6 rounded-2xl bg-white p-6 shadow-sm">
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900">Ảnh đại diện</h2>
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
                    placeholder="Hoặc dán link ảnh"
                  />
                  {avatarPreview && (
                    <button
                      type="button"
                      onClick={handleRemoveAvatar}
                      className="text-sm font-medium text-red-600 hover:text-red-700"
                    >
                      Xóa ảnh
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
                placeholder="Họ và tên"
                className="rounded-lg border border-gray-200 px-3 py-2"
              />
              <input
                name="phone"
                value={form.phone}
                onChange={handleChange}
                placeholder="Số điện thoại"
                className="rounded-lg border border-gray-200 px-3 py-2"
              />
              <select
                name="gender"
                value={form.gender}
                onChange={handleChange}
                className="rounded-lg border border-gray-200 px-3 py-2"
              >
                <option value="">Giới tính</option>
                <option value="male">Nam</option>
                <option value="female">Nữ</option>
                <option value="other">Khác</option>
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
                placeholder="Địa chỉ"
                className="rounded-lg border border-gray-200 px-3 py-2"
              />
              <input
                name="ward"
                value={form.ward}
                onChange={handleChange}
                placeholder="Phường/Xã"
                className="rounded-lg border border-gray-200 px-3 py-2"
              />
              <input
                name="district"
                value={form.district}
                onChange={handleChange}
                placeholder="Quận/Huyện"
                className="rounded-lg border border-gray-200 px-3 py-2"
              />
              <input
                name="city"
                value={form.city}
                onChange={handleChange}
                placeholder="Tỉnh/Thành phố"
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
                Nhận email marketing
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="pushNotification"
                  checked={form.pushNotification}
                  onChange={handleChange}
                />
                Nhận thông báo
              </label>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full rounded-xl bg-linear-to-r from-orange-500 to-amber-500 px-5 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? "Đang lưu..." : "Lưu thay đổi"}
            </button>
          </form>
        )}
      </div>
    </AdminLayout>
  );
}

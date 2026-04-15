import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header, Footer } from "../components/layout";
import { careAppointmentApi } from "../services/api";
import { STORAGE_KEYS } from "../utils/constants";

const initialForm = {
  petName: "",
  petType: "",
  serviceType: "",
  appointmentDate: "",
  startTime: "",
  note: "",
};

const petTypeOptions = ["Chó", "Mèo", "Thỏ", "Hamster", "Chim", "Khác"];
const serviceTypeOptions = [
  "Tắm spa",
  "Cắt tỉa lông",
  "Vệ sinh tai và móng",
  "Chăm sóc da lông",
  "Gói chăm sóc toàn diện",
];

const BUSINESS_START_HOUR = 8;
const BUSINESS_END_HOUR = 20;
const timeOptions = Array.from(
  { length: (BUSINESS_END_HOUR - BUSINESS_START_HOUR) * 2 + 1 },
  (_, i) => {
    const totalMinutes = BUSINESS_START_HOUR * 60 + i * 30;
    const hour = String(Math.floor(totalMinutes / 60)).padStart(2, "0");
    const minute = String(totalMinutes % 60).padStart(2, "0");
    return `${hour}:${minute}`;
  },
);

const statusLabel = {
  pending: "Chờ duyệt",
  approved: "Đã duyệt",
  rejected: "Từ chối",
  cancelled: "Đã hủy",
};

const statusStyle = {
  pending: "bg-amber-100 text-amber-800",
  approved: "bg-emerald-100 text-emerald-800",
  rejected: "bg-red-100 text-red-800",
  cancelled: "bg-gray-100 text-gray-700",
};

export default function CareAppointmentsPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [editForm, setEditForm] = useState(initialForm);
  const [editingId, setEditingId] = useState("");
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);
  const [errorPopup, setErrorPopup] = useState("");

  const showErrorPopup = (message) => {
    setErrorPopup(message || "Đã xảy ra lỗi, vui lòng thử lại");
  };

  const fetchMyAppointments = useCallback(async () => {
    try {
      setLoading(true);
      const res = await careAppointmentApi.getMyAppointments({ limit: 20 });
      setAppointments(res.appointments || []);
    } catch (err) {
      showErrorPopup(err.message || "Không thể tải lịch chăm sóc");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
    if (!token) {
      navigate("/login");
      return;
    }
    fetchMyAppointments();
  }, [navigate, fetchMyAppointments]);

  const minDate = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const handleChange = (key) => (e) => {
    setForm((prev) => ({ ...prev, [key]: e.target.value }));
  };

  const handleEditChange = (key) => (e) => {
    setEditForm((prev) => ({ ...prev, [key]: e.target.value }));
  };

  const validateNotPast = (dateStr, startTimeStr) => {
    const now = new Date();
    const selectedDate = new Date(dateStr);
    selectedDate.setHours(0, 0, 0, 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (selectedDate < today) {
      return "Không được đặt lịch trong quá khứ";
    }

    if (selectedDate.getTime() === today.getTime()) {
      const [h, m] = String(startTimeStr).split(":").map(Number);
      const startMinutes = h * 60 + m;
      const nowMinutes = now.getHours() * 60 + now.getMinutes();
      if (startMinutes <= nowMinutes) {
        return "Giờ bắt đầu phải lớn hơn thời điểm hiện tại";
      }
    }

    return "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.petName || !form.petType || !form.serviceType || !form.appointmentDate || !form.startTime) {
      showErrorPopup("Vui lòng điền đầy đủ thông tin bắt buộc");
      return;
    }

    const pastError = validateNotPast(form.appointmentDate, form.startTime);
    if (pastError) {
      showErrorPopup(pastError);
      return;
    }

    try {
      setSubmitting(true);
      await careAppointmentApi.createAppointment(form);
      setForm(initialForm);
      await fetchMyAppointments();
    } catch (err) {
      showErrorPopup(err.message || "Không thể đặt lịch");
    } finally {
      setSubmitting(false);
    }
  };

  const startEdit = (item) => {
    setEditingId(item._id);
    setEditForm({
      petName: item.petName || "",
      petType: item.petType || "",
      serviceType: item.serviceType || "",
      appointmentDate: new Date(item.appointmentDate).toISOString().slice(0, 10),
      startTime: item.startTime || "",
      note: item.note || "",
    });
  };

  const cancelEdit = () => {
    setEditingId("");
    setEditForm(initialForm);
  };

  const saveEdit = async () => {
    if (!editingId) return;

    if (!editForm.petName || !editForm.petType || !editForm.serviceType || !editForm.appointmentDate || !editForm.startTime) {
      showErrorPopup("Vui lòng điền đầy đủ thông tin bắt buộc khi chỉnh sửa");
      return;
    }

    const pastError = validateNotPast(editForm.appointmentDate, editForm.startTime);
    if (pastError) {
      showErrorPopup(pastError);
      return;
    }

    try {
      setSavingEdit(true);
      await careAppointmentApi.updateAppointment(editingId, editForm);
      await fetchMyAppointments();
      cancelEdit();
    } catch (err) {
      showErrorPopup(err.message || "Không thể cập nhật lịch hẹn");
    } finally {
      setSavingEdit(false);
    }
  };

  return (
    <div className="font-['Inter',sans-serif] bg-gray-50 min-h-screen">
      <Header />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-32">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Đặt lịch chăm sóc thú cưng</h1>
          <p className="text-gray-600 mt-2">Đặt lịch spa theo ngày và khung giờ, nhân viên sẽ duyệt và gửi email xác nhận.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <section className="lg:col-span-2 bg-white rounded-2xl shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Thông tin lịch hẹn</h2>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tên thú cưng *</label>
                <input value={form.petName} onChange={handleChange("petName")} className="w-full border border-gray-300 rounded-lg px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Loại thú cưng *</label>
                <select
                  value={form.petType}
                  onChange={handleChange("petType")}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white"
                >
                  <option value="">-- Chọn loại thú cưng --</option>
                  {petTypeOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Dịch vụ *</label>
                <select
                  value={form.serviceType}
                  onChange={handleChange("serviceType")}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white"
                >
                  <option value="">-- Chọn dịch vụ --</option>
                  {serviceTypeOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ngày hẹn *</label>
                <input type="date" min={minDate} value={form.appointmentDate} onChange={handleChange("appointmentDate")} className="w-full border border-gray-300 rounded-lg px-3 py-2" />
              </div>
              <div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Giờ bắt đầu *</label>
                  <select value={form.startTime} onChange={handleChange("startTime")} className="w-32 border border-gray-300 rounded-lg px-3 py-2 bg-white">
                    <option value="">-- Chọn giờ --</option>
                    {timeOptions.map((time) => (
                      <option key={time} value={time}>{time}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ghi chú</label>
                <textarea rows={3} value={form.note} onChange={handleChange("note")} className="w-full border border-gray-300 rounded-lg px-3 py-2" />
              </div>
              <button disabled={submitting} className="w-full bg-[#846551] text-white py-2.5 rounded-lg hover:bg-[#6d5041] disabled:opacity-50">
                {submitting ? "Đang gửi lịch..." : "Đặt lịch"}
              </button>
            </form>
          </section>

          <section className="lg:col-span-3 bg-white rounded-2xl shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Lịch chăm sóc của bạn</h2>
            {loading ? (
              <p className="text-gray-500">Đang tải dữ liệu...</p>
            ) : appointments.length === 0 ? (
              <p className="text-gray-500">Bạn chưa có lịch hẹn nào.</p>
            ) : (
              <div className="space-y-3">
                {appointments.map((item) => (
                  <div key={item._id} className="border border-gray-200 rounded-xl p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <div>
                        <p className="text-gray-900 font-semibold">{item.petName} - {item.serviceType}</p>
                        <p className="text-sm text-gray-600">{new Date(item.appointmentDate).toLocaleDateString("vi-VN")} | {item.startTime}</p>
                        <p className="text-sm text-gray-500">Loại thú cưng: {item.petType}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${statusStyle[item.status] || "bg-gray-100 text-gray-700"}`}>
                          {statusLabel[item.status] || item.status}
                        </span>
                        {item.status === "pending" && editingId !== item._id && (
                          <button
                            onClick={() => startEdit(item)}
                            className="px-3 py-1 rounded-lg text-xs font-medium bg-blue-100 text-blue-700 hover:bg-blue-200"
                          >
                            Chỉnh sửa
                          </button>
                        )}
                      </div>
                    </div>
                    {item.note && <p className="mt-2 text-sm text-gray-600">Ghi chú: {item.note}</p>}

                    {editingId === item._id && (
                      <div className="mt-4 p-4 rounded-lg border border-blue-200 bg-blue-50/40 space-y-3">
                        <h3 className="font-semibold text-gray-800">Chỉnh sửa lịch hẹn</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <input
                            value={editForm.petName}
                            onChange={handleEditChange("petName")}
                            placeholder="Tên thú cưng"
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white"
                          />
                          <select
                            value={editForm.petType}
                            onChange={handleEditChange("petType")}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white"
                          >
                            <option value="">-- Chọn loại thú cưng --</option>
                            {petTypeOptions.map((option) => (
                              <option key={option} value={option}>{option}</option>
                            ))}
                          </select>
                          <select
                            value={editForm.serviceType}
                            onChange={handleEditChange("serviceType")}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white md:col-span-2"
                          >
                            <option value="">-- Chọn dịch vụ --</option>
                            {serviceTypeOptions.map((option) => (
                              <option key={option} value={option}>{option}</option>
                            ))}
                          </select>
                          <input
                            type="date"
                            min={minDate}
                            value={editForm.appointmentDate}
                            onChange={handleEditChange("appointmentDate")}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white"
                          />
                          <div>
                            <select
                              value={editForm.startTime}
                              onChange={handleEditChange("startTime")}
                              className="w-32 border border-gray-300 rounded-lg px-3 py-2 bg-white"
                            >
                              <option value="">-- Chọn giờ --</option>
                              {timeOptions.map((time) => (
                                <option key={time} value={time}>{time}</option>
                              ))}
                            </select>
                          </div>
                          <textarea
                            rows={2}
                            value={editForm.note}
                            onChange={handleEditChange("note")}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white md:col-span-2"
                            placeholder="Ghi chú"
                          />
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={saveEdit}
                            disabled={savingEdit}
                            className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                          >
                            {savingEdit ? "Đang lưu..." : "Lưu thay đổi"}
                          </button>
                          <button
                            onClick={cancelEdit}
                            disabled={savingEdit}
                            className="px-4 py-2 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300"
                          >
                            Hủy
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>

      {errorPopup ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl bg-white shadow-xl">
            <div className="border-b border-gray-200 px-5 py-4">
              <h3 className="text-lg font-semibold text-gray-900">Thông báo</h3>
            </div>
            <div className="px-5 py-4">
              <p className="text-sm text-gray-700">{errorPopup}</p>
            </div>
            <div className="flex justify-end border-t border-gray-200 px-5 py-4">
              <button
                onClick={() => setErrorPopup("")}
                className="rounded-lg bg-[#846551] px-4 py-2 text-sm font-medium text-white hover:bg-[#6d5041]"
              >
                Đã hiểu
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <Footer />
    </div>
  );
}

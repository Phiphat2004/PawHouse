import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import { DatePicker, TimePicker } from "antd";
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

const statusLabel = {
  pending: "Chờ duyệt",
  approved: "Đã xác nhận",
  confirmed: "Đã xác nhận",
  rejected: "Từ chối",
  cancelled: "Đã hủy",
  checked_in: "Đã check-in",
  in_progress: "Đang chăm sóc",
  completed: "Hoàn tất",
};

const statusStyle = {
  pending: "bg-amber-100 text-amber-800",
  approved: "bg-emerald-100 text-emerald-800",
  confirmed: "bg-emerald-100 text-emerald-800",
  rejected: "bg-red-100 text-red-800",
  cancelled: "bg-gray-100 text-gray-700",
  checked_in: "bg-cyan-100 text-cyan-800",
  in_progress: "bg-blue-100 text-blue-800",
  completed: "bg-violet-100 text-violet-800",
};

const canCustomerEdit = (status) => status === "pending" || status === "approved" || status === "confirmed";
const canCustomerCancel = (status) => status === "pending" || status === "approved" || status === "confirmed";

export default function CareAppointmentsPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [editForm, setEditForm] = useState(initialForm);
  const [editingId, setEditingId] = useState("");
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState("");
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [cancelPopup, setCancelPopup] = useState({
    open: false,
    appointmentId: "",
    reason: "",
  });
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

  const toTimeValue = (timeStr) => {
    if (!timeStr) return null;
    const [h, m] = String(timeStr).split(":").map(Number);
    if (Number.isNaN(h) || Number.isNaN(m)) return null;
    return dayjs().hour(h).minute(m).second(0);
  };

  const disabledDate = (current) => {
    if (!current) return false;
    return current.startOf("day").isBefore(dayjs().startOf("day"));
  };

  const getDisabledTime = (dateStr) => {
    const today = dayjs().format("YYYY-MM-DD");
    const isToday = dateStr === today;
    const now = dayjs();
    const currentHour = now.hour();
    const currentMinute = now.minute();

    return {
      disabledHours: () =>
        Array.from({ length: 24 }, (_, h) => h).filter(
          (h) =>
            h < BUSINESS_START_HOUR ||
            h > BUSINESS_END_HOUR ||
            (isToday && h < currentHour),
        ),
      disabledMinutes: (hour) => {
        const minuteOptions = Array.from({ length: 60 }, (_, m) => m);
        return minuteOptions.filter((m) => {
          if (hour === BUSINESS_END_HOUR && m > 0) return true;
          if (m % 30 !== 0) return true;
          if (isToday && hour === currentHour && m <= currentMinute) return true;
          return false;
        });
      },
    };
  };

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
      await careAppointmentApi.rescheduleAppointment(editingId, editForm);
      await fetchMyAppointments();
      cancelEdit();
    } catch (err) {
      showErrorPopup(err.message || "Không thể cập nhật lịch hẹn");
    } finally {
      setSavingEdit(false);
    }
  };

  const openCancelPopup = (item) => {
    setSelectedAppointment(null);
    setCancelPopup({
      open: true,
      appointmentId: item._id,
      reason: "",
    });
  };

  const closeCancelPopup = () => {
    setCancelPopup({
      open: false,
      appointmentId: "",
      reason: "",
    });
  };

  const submitCancelAppointment = async () => {
    const reason = cancelPopup.reason.trim();
    if (!reason) {
      showErrorPopup("Bạn cần nhập lý do hủy lịch");
      return;
    }

    try {
      setActionLoadingId(cancelPopup.appointmentId);
      await careAppointmentApi.cancelAppointment(cancelPopup.appointmentId, reason);
      await fetchMyAppointments();
      if (selectedAppointment?._id === cancelPopup.appointmentId) {
        setSelectedAppointment(null);
      }
      closeCancelPopup();
    } catch (err) {
      showErrorPopup(err.message || "Không thể hủy lịch hẹn");
    } finally {
      setActionLoadingId("");
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
                <DatePicker
                  className="w-full"
                  format="DD/MM/YYYY"
                  value={form.appointmentDate ? dayjs(form.appointmentDate) : null}
                  onChange={(value) =>
                    setForm((prev) => ({
                      ...prev,
                      appointmentDate: value ? value.format("YYYY-MM-DD") : "",
                    }))
                  }
                  disabledDate={disabledDate}
                  placeholder="Chọn ngày"
                />
              </div>
              <div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Giờ bắt đầu *</label>
                  <TimePicker
                    className="w-40"
                    format="HH:mm"
                    minuteStep={30}
                    value={toTimeValue(form.startTime)}
                    onChange={(value) =>
                      setForm((prev) => ({
                        ...prev,
                        startTime: value ? value.format("HH:mm") : "",
                      }))
                    }
                    disabledTime={() => getDisabledTime(form.appointmentDate)}
                    placeholder="Chọn giờ"
                  />
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
                        <button
                          onClick={() => setSelectedAppointment(item)}
                          className="px-3 py-1 rounded-lg text-xs font-medium bg-sky-100 text-sky-700 hover:bg-sky-200"
                        >
                          Chi tiết
                        </button>
                        {canCustomerEdit(item.status) && editingId !== item._id && (
                          <button
                            onClick={() => startEdit(item)}
                            className="px-3 py-1 rounded-lg text-xs font-medium bg-blue-100 text-blue-700 hover:bg-blue-200"
                          >
                            Đổi lịch
                          </button>
                        )}
                        {canCustomerCancel(item.status) ? (
                          <button
                            onClick={() => openCancelPopup(item)}
                            disabled={actionLoadingId === item._id}
                            className="px-3 py-1 rounded-lg text-xs font-medium bg-rose-100 text-rose-700 hover:bg-rose-200 disabled:opacity-50"
                          >
                            {actionLoadingId === item._id ? "Đang hủy..." : "Hủy lịch"}
                          </button>
                        ) : null}
                      </div>
                    </div>
                    {item.note && <p className="mt-2 text-sm text-gray-600">Ghi chú: {item.note}</p>}

                    {editingId === item._id && (
                      <div className="mt-4 p-4 rounded-lg border border-blue-200 bg-blue-50/40 space-y-3">
                        <h3 className="font-semibold text-gray-800">Đổi lịch hẹn</h3>
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
                          <DatePicker
                            className="w-full"
                            format="DD/MM/YYYY"
                            value={editForm.appointmentDate ? dayjs(editForm.appointmentDate) : null}
                            onChange={(value) =>
                              setEditForm((prev) => ({
                                ...prev,
                                appointmentDate: value ? value.format("YYYY-MM-DD") : "",
                              }))
                            }
                            disabledDate={disabledDate}
                            placeholder="Chọn ngày"
                          />
                          <div>
                            <TimePicker
                              className="w-40"
                              format="HH:mm"
                              minuteStep={30}
                              value={toTimeValue(editForm.startTime)}
                              onChange={(value) =>
                                setEditForm((prev) => ({
                                  ...prev,
                                  startTime: value ? value.format("HH:mm") : "",
                                }))
                              }
                              disabledTime={() => getDisabledTime(editForm.appointmentDate)}
                              placeholder="Chọn giờ"
                            />
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
                            {savingEdit ? "Đang lưu..." : "Lưu và gửi duyệt lại"}
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

      {selectedAppointment ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-2xl rounded-xl bg-white shadow-xl">
            <div className="border-b border-gray-200 px-5 py-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Chi tiết lịch chăm sóc</h3>
              <button
                onClick={() => setSelectedAppointment(null)}
                className="rounded-lg bg-gray-100 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-200"
              >
                Đóng
              </button>
            </div>
            <div className="px-5 py-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Tên thú cưng</p>
                <p className="font-medium text-gray-900">{selectedAppointment.petName}</p>
              </div>
              <div>
                <p className="text-gray-500">Loại thú cưng</p>
                <p className="font-medium text-gray-900">{selectedAppointment.petType}</p>
              </div>
              <div>
                <p className="text-gray-500">Dịch vụ</p>
                <p className="font-medium text-gray-900">{selectedAppointment.serviceType}</p>
              </div>
              <div>
                <p className="text-gray-500">Trạng thái</p>
                <p className="font-medium text-gray-900">{statusLabel[selectedAppointment.status] || selectedAppointment.status}</p>
              </div>
              <div>
                <p className="text-gray-500">Ngày hẹn</p>
                <p className="font-medium text-gray-900">{new Date(selectedAppointment.appointmentDate).toLocaleDateString("vi-VN")}</p>
              </div>
              <div>
                <p className="text-gray-500">Khung giờ</p>
                <p className="font-medium text-gray-900">{selectedAppointment.startTime}</p>
              </div>
              <div>
                <p className="text-gray-500">Phương thức thanh toán</p>
                <p className="font-medium text-gray-900">
                  {selectedAppointment.paymentMethod === "online" ? "Online" : "Thanh toán tại cửa hàng"}
                </p>
              </div>
              <div>
                <p className="text-gray-500">Trạng thái thanh toán</p>
                <p className="font-medium text-gray-900">
                  {selectedAppointment.paymentStatus === "paid" ? "Đã thanh toán" : "Chưa thanh toán"}
                </p>
              </div>
              <div className="md:col-span-2">
                <p className="text-gray-500">Ghi chú</p>
                <p className="font-medium text-gray-900 whitespace-pre-wrap">
                  {selectedAppointment.note || "Không có ghi chú"}
                </p>
              </div>
              {selectedAppointment.rejectionReason ? (
                <div className="md:col-span-2">
                  <p className="text-gray-500">Lý do từ chối</p>
                  <p className="font-medium text-rose-700 whitespace-pre-wrap">
                    {selectedAppointment.rejectionReason}
                  </p>
                </div>
              ) : null}
              {selectedAppointment.cancellationReason ? (
                <div className="md:col-span-2">
                  <p className="text-gray-500">Lý do hủy</p>
                  <p className="font-medium text-amber-700 whitespace-pre-wrap">
                    {selectedAppointment.cancellationReason}
                  </p>
                </div>
              ) : null}
            </div>
            <div className="border-t border-gray-200 px-5 py-4 flex justify-end gap-2">
              {canCustomerCancel(selectedAppointment.status) ? (
                <button
                  onClick={() => openCancelPopup(selectedAppointment)}
                  disabled={actionLoadingId === selectedAppointment._id}
                  className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium text-white hover:bg-rose-700 disabled:opacity-50"
                >
                  {actionLoadingId === selectedAppointment._id ? "Đang hủy..." : "Hủy lịch"}
                </button>
              ) : null}
              <button
                onClick={() => setSelectedAppointment(null)}
                className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {cancelPopup.open ? (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl bg-white shadow-xl">
            <div className="border-b border-gray-200 px-5 py-4">
              <h3 className="text-lg font-semibold text-gray-900">Hủy lịch hẹn</h3>
            </div>
            <div className="px-5 py-4 space-y-2">
              <p className="text-sm text-gray-600">Vui lòng nhập lý do hủy lịch để cửa hàng hỗ trợ bạn tốt hơn.</p>
              <textarea
                rows={4}
                value={cancelPopup.reason}
                onChange={(e) =>
                  setCancelPopup((prev) => ({ ...prev, reason: e.target.value }))
                }
                placeholder="Nhập lý do hủy..."
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-800 focus:border-rose-400 focus:outline-none"
              />
            </div>
            <div className="flex justify-end gap-2 border-t border-gray-200 px-5 py-4">
              <button
                onClick={closeCancelPopup}
                className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
              >
                Đóng
              </button>
              <button
                onClick={submitCancelAppointment}
                disabled={actionLoadingId === cancelPopup.appointmentId}
                className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium text-white hover:bg-rose-700 disabled:opacity-50"
              >
                {actionLoadingId === cancelPopup.appointmentId ? "Đang hủy..." : "Xác nhận hủy"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

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

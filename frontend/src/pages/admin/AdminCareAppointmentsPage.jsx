import { useCallback, useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import { DatePicker } from "antd";
import { AdminLayout } from "../../components/admin";
import { careAppointmentApi } from "../../services/api";
import { toast } from "react-toastify";

const statusLabel = {
  all: "Tất cả",
  pending: "Chờ duyệt",
  approved: "Đã xác nhận",
  confirmed: "Đã xác nhận",
  rejected: "Từ chối",
  cancelled: "Đã hủy",
  checked_in: "Đã check-in",
  in_progress: "Đang chăm sóc",
  completed: "Hoàn tất",
};

const statusActions = {
  confirmed: { label: "Xác nhận", type: "confirm" },
  checked_in: { label: "Check-in", type: "progress" },
  in_progress: { label: "Bắt đầu dịch vụ", type: "progress" },
  completed: { label: "Hoàn tất", type: "progress" },
};

function getNextStatus(currentStatus) {
  if (currentStatus === "pending") return "confirmed";
  if (currentStatus === "approved" || currentStatus === "confirmed") return "checked_in";
  if (currentStatus === "checked_in") return "in_progress";
  if (currentStatus === "in_progress") return "completed";
  return "";
}

export default function AdminCareAppointmentsPage() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("all");
  const [dateRange, setDateRange] = useState(["", ""]);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [processingId, setProcessingId] = useState("");
  const [rejectPopup, setRejectPopup] = useState({
    open: false,
    appointmentId: "",
    reason: "",
  });
  const [errorPopup, setErrorPopup] = useState("");

  const showErrorPopup = (message) => {
    setErrorPopup(message || "Đã xảy ra lỗi, vui lòng thử lại");
  };

  const fetchAppointments = useCallback(async () => {
    try {
      setLoading(true);
      const statusParam = status === "all" ? undefined : status;
      const res = await careAppointmentApi.getAllAppointments({
        status: statusParam,
        limit: 100,
      });
      setAppointments(res.appointments || []);
    } catch (err) {
      showErrorPopup(err.message || "Không thể tải danh sách lịch hẹn");
    } finally {
      setLoading(false);
    }
  }, [status]);

  const filteredAppointments = useMemo(() => {
    return appointments.filter((item) => {
      const appointmentDate = dayjs(item.appointmentDate).format("YYYY-MM-DD");
      const [startDate, endDate] = dateRange;

      if (startDate && appointmentDate < startDate) return false;
      if (endDate && appointmentDate > endDate) return false;

      return true;
    });
  }, [appointments, dateRange]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  async function handleApprove(id) {
    try {
      setProcessingId(id);
      await careAppointmentApi.approveAppointment(id);
      toast.success("Xác nhận lịch thành công và đã gửi email cho khách");
      await fetchAppointments();
      return true;
    } catch (err) {
      showErrorPopup(err.message || "Không thể duyệt lịch");
      return false;
    } finally {
      setProcessingId("");
    }
  }

  async function handleReject(id, reason) {
    try {
      setProcessingId(id);
      await careAppointmentApi.rejectAppointment(id, reason);
      toast.success("Đã từ chối lịch hẹn");
      await fetchAppointments();
      return true;
    } catch (err) {
      showErrorPopup(err.message || "Không thể từ chối lịch");
      return false;
    } finally {
      setProcessingId("");
    }
  }

  function openRejectPopup(appointmentId) {
    setSelectedAppointment(null);
    setRejectPopup({
      open: true,
      appointmentId,
      reason: "",
    });
  }

  function closeRejectPopup() {
    setRejectPopup({
      open: false,
      appointmentId: "",
      reason: "",
    });
  }

  async function submitReject() {
    const reason = rejectPopup.reason.trim();
    if (!reason) {
      showErrorPopup("Vui lòng nhập lý do từ chối");
      return;
    }

    const ok = await handleReject(rejectPopup.appointmentId, reason);
    if (ok) {
      if (selectedAppointment?._id === rejectPopup.appointmentId) {
        setSelectedAppointment(null);
      }
      closeRejectPopup();
    }
  }

  async function handleAdvanceStatus(item) {
    const nextStatus = getNextStatus(item.status);
    if (!nextStatus || nextStatus === "confirmed") {
      return false;
    }

    try {
      setProcessingId(item._id);
      await careAppointmentApi.updateAppointmentStatus(item._id, nextStatus);
      toast.success(`Đã cập nhật trạng thái: ${statusLabel[nextStatus] || nextStatus}`);
      await fetchAppointments();
      return true;
    } catch (err) {
      showErrorPopup(err.message || "Không thể cập nhật trạng thái");
      return false;
    } finally {
      setProcessingId("");
    }
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-[#2c2c2c] mb-2">Lịch chăm sóc thú cưng</h2>
          <p className="text-gray-500">Duyệt lịch hẹn spa mà khách hàng đã đăng ký.</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 flex flex-col md:flex-row gap-3">
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="pending">Chờ duyệt</option>
            <option value="approved">Đã xác nhận (legacy)</option>
            <option value="confirmed">Đã xác nhận</option>
            <option value="rejected">Từ chối</option>
            <option value="cancelled">Đã hủy</option>
            <option value="checked_in">Đã check-in</option>
            <option value="in_progress">Đang chăm sóc</option>
            <option value="completed">Hoàn tất</option>
          </select>
          <DatePicker.RangePicker
            className="min-w-70"
            format="DD/MM/YYYY"
            value={[
              dateRange[0] ? dayjs(dateRange[0]) : null,
              dateRange[1] ? dayjs(dateRange[1]) : null,
            ]}
            onChange={(values) => {
              const nextStart = values?.[0] ? values[0].format("YYYY-MM-DD") : "";
              const nextEnd = values?.[1] ? values[1].format("YYYY-MM-DD") : "";
              setDateRange([nextStart, nextEnd]);
            }}
            placeholder={["Từ ngày", "Đến ngày"]}
            allowClear
          />
          <button
            onClick={() => {
              setStatus("all");
              setDateRange(["", ""]);
            }}
            className="px-4 py-2 bg-gray-100 rounded-lg text-gray-700"
          >
            Đặt lại
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-gray-500">Đang tải...</div>
          ) : filteredAppointments.length === 0 ? (
            <div className="p-8 text-center text-gray-500">Không có lịch hẹn nào</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left px-4 py-3 text-sm font-semibold text-gray-700">Khách hàng</th>
                    <th className="text-left px-4 py-3 text-sm font-semibold text-gray-700">Thú cưng</th>
                    <th className="text-left px-4 py-3 text-sm font-semibold text-gray-700">Dịch vụ</th>
                    <th className="text-left px-4 py-3 text-sm font-semibold text-gray-700">Lịch hẹn</th>
                    <th className="text-left px-4 py-3 text-sm font-semibold text-gray-700">Trạng thái</th>
                    <th className="text-right px-4 py-3 text-sm font-semibold text-gray-700">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAppointments.map((item) => (
                    <tr key={item._id} className="border-b border-gray-100">
                      <td className="px-4 py-3 text-sm text-gray-700">
                        <p className="font-medium text-gray-900">{item.customerId?.profile?.fullName || item.customerId?.email || "Khách hàng"}</p>
                        <p className="text-gray-500">{item.customerId?.email || ""}</p>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        <p className="font-medium text-gray-900">{item.petName}</p>
                        <p className="text-gray-500">{item.petType}</p>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">{item.serviceType}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        <p>{new Date(item.appointmentDate).toLocaleDateString("vi-VN")}</p>
                        <p className="text-gray-500">{item.startTime}</p>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">{statusLabel[item.status] || item.status}</td>
                      <td className="px-4 py-3 text-sm text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setSelectedAppointment(item)}
                            className="px-3 py-1.5 rounded-lg bg-sky-100 text-sky-700 hover:bg-sky-200"
                          >
                            Xem chi tiết
                          </button>
                          {item.status === "pending" ? (
                            <>
                              <button
                                onClick={() => handleApprove(item._id)}
                                disabled={processingId === item._id}
                                className="px-3 py-1.5 rounded-lg bg-emerald-100 text-emerald-700 hover:bg-emerald-200 disabled:opacity-50"
                              >
                                Xác nhận
                              </button>
                              <button
                                onClick={() => openRejectPopup(item._id)}
                                disabled={processingId === item._id}
                                className="px-3 py-1.5 rounded-lg bg-rose-100 text-rose-700 hover:bg-rose-200 disabled:opacity-50"
                              >
                                Từ chối
                              </button>
                            </>
                          ) : null}
                          {getNextStatus(item.status) && getNextStatus(item.status) !== "confirmed" ? (
                            <button
                              onClick={() => handleAdvanceStatus(item)}
                              disabled={processingId === item._id}
                              className="px-3 py-1.5 rounded-lg bg-indigo-100 text-indigo-700 hover:bg-indigo-200 disabled:opacity-50"
                            >
                              {statusActions[getNextStatus(item.status)]?.label || "Cập nhật"}
                            </button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {selectedAppointment ? (
          <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl">
              <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Chi tiết lịch hẹn</h3>
                <button
                  onClick={() => setSelectedAppointment(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  Đóng
                </button>
              </div>

              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Khách hàng</p>
                  <p className="font-medium text-gray-900">
                    {selectedAppointment.customerId?.profile?.fullName ||
                      selectedAppointment.customerId?.email ||
                      "Khách hàng"}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Email</p>
                  <p className="font-medium text-gray-900">
                    {selectedAppointment.customerId?.email || "-"}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Thú cưng</p>
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
                  <p className="font-medium text-gray-900">
                    {statusLabel[selectedAppointment.status] || selectedAppointment.status}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Ngày hẹn</p>
                  <p className="font-medium text-gray-900">
                    {new Date(selectedAppointment.appointmentDate).toLocaleDateString("vi-VN")}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Khung giờ</p>
                  <p className="font-medium text-gray-900">{selectedAppointment.startTime}</p>
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

              <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-2">
                {selectedAppointment.status === "pending" ? (
                  <>
                    <button
                      onClick={async () => {
                        const ok = await handleApprove(selectedAppointment._id);
                        if (ok) setSelectedAppointment(null);
                      }}
                      disabled={processingId === selectedAppointment._id}
                      className="px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50"
                    >
                      Xác nhận
                    </button>
                    <button
                      onClick={() => openRejectPopup(selectedAppointment._id)}
                      disabled={processingId === selectedAppointment._id}
                      className="px-4 py-2 rounded-lg bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-50"
                    >
                      Từ chối
                    </button>
                  </>
                ) : null}
                {getNextStatus(selectedAppointment.status) &&
                getNextStatus(selectedAppointment.status) !== "confirmed" ? (
                  <button
                    onClick={async () => {
                      const ok = await handleAdvanceStatus(selectedAppointment);
                      if (ok) setSelectedAppointment(null);
                    }}
                    disabled={processingId === selectedAppointment._id}
                    className="px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {statusActions[getNextStatus(selectedAppointment.status)]?.label || "Cập nhật"}
                  </button>
                ) : null}
                <button
                  onClick={() => setSelectedAppointment(null)}
                  className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {rejectPopup.open ? (
          <div className="fixed inset-0 bg-black/40 z-60 flex items-center justify-center p-4">
            <div className="w-full max-w-md rounded-xl bg-white shadow-xl">
              <div className="border-b border-gray-200 px-5 py-4">
                <h3 className="text-lg font-semibold text-gray-900">Từ chối lịch hẹn</h3>
              </div>
              <div className="px-5 py-4 space-y-2">
                <p className="text-sm text-gray-600">Vui lòng nhập lý do từ chối để gửi cho khách hàng.</p>
                <textarea
                  rows={4}
                  value={rejectPopup.reason}
                  onChange={(e) =>
                    setRejectPopup((prev) => ({ ...prev, reason: e.target.value }))
                  }
                  placeholder="Nhập lý do từ chối..."
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-800 focus:border-rose-400 focus:outline-none"
                />
              </div>
              <div className="flex justify-end gap-2 border-t border-gray-200 px-5 py-4">
                <button
                  onClick={closeRejectPopup}
                  className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
                >
                  Hủy
                </button>
                <button
                  onClick={submitReject}
                  disabled={processingId === rejectPopup.appointmentId}
                  className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium text-white hover:bg-rose-700 disabled:opacity-50"
                >
                  {processingId === rejectPopup.appointmentId ? "Đang gửi..." : "Xác nhận từ chối"}
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {errorPopup ? (
          <div className="fixed inset-0 bg-black/40 z-60 flex items-center justify-center p-4">
            <div className="w-full max-w-md rounded-xl bg-white shadow-xl">
              <div className="border-b border-gray-200 px-5 py-4">
                <h3 className="text-lg font-semibold text-gray-900">Thông báo lỗi</h3>
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
      </div>
    </AdminLayout>
  );
}

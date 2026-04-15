import { useCallback, useEffect, useState } from "react";
import { AdminLayout } from "../../components/admin";
import { careAppointmentApi } from "../../services/api";
import { toast } from "react-toastify";

const statusLabel = {
    all: "Tất cả",
  pending: "Chờ duyệt",
  approved: "Đã duyệt",
  rejected: "Từ chối",
  cancelled: "Đã hủy",
};

export default function AdminCareAppointmentsPage() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("pending");
  const [date, setDate] = useState("");
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [errorPopup, setErrorPopup] = useState("");

  const showErrorPopup = (message) => {
    setErrorPopup(message || "Đã xảy ra lỗi, vui lòng thử lại");
  };

  const fetchAppointments = useCallback(async () => {
    try {
      setLoading(true);
      const res = await careAppointmentApi.getAllAppointments({
        status: status || undefined,
        date: date || undefined,
        limit: 100,
      });
      setAppointments(res.appointments || []);
    } catch (err) {
      showErrorPopup(err.message || "Không thể tải danh sách lịch hẹn");
    } finally {
      setLoading(false);
    }
  }, [status, date]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  async function handleApprove(id) {
    try {
      await careAppointmentApi.approveAppointment(id);
      toast.success("Duyệt lịch thành công và đã gửi email cho khách");
      await fetchAppointments();
      return true;
    } catch (err) {
      showErrorPopup(err.message || "Không thể duyệt lịch");
      return false;
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
            <option value="approved">Đã duyệt</option>
            <option value="rejected">Từ chối</option>
            <option value="cancelled">Đã hủy</option>
          </select>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2"
          />
          <button
            onClick={() => {
              setStatus("pending");
              setDate("");
            }}
            className="px-4 py-2 bg-gray-100 rounded-lg text-gray-700"
          >
            Đặt lại
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-gray-500">Đang tải...</div>
          ) : appointments.length === 0 ? (
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
                  {appointments.map((item) => (
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
                            <button
                              onClick={() => handleApprove(item._id)}
                              className="px-3 py-1.5 rounded-lg bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                            >
                              Duyệt lịch
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
              </div>

              <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-2">
                {selectedAppointment.status === "pending" ? (
                  <button
                    onClick={async () => {
                      const ok = await handleApprove(selectedAppointment._id);
                      if (ok) setSelectedAppointment(null);
                    }}
                    className="px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700"
                  >
                    Duyệt lịch
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

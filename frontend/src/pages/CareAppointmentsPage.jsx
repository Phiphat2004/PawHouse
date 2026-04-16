import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import {
  Alert,
  Button,
  Card,
  DatePicker,
  Empty,
  Input,
  Modal,
  Select,
  Skeleton,
  Tag,
  TimePicker,
  Typography,
} from "antd";
import {
  CalendarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  EditOutlined,
  InfoCircleOutlined,
  ScissorOutlined,
} from "@ant-design/icons";
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
  approved: "Đã duyệt",
  rejected: "Từ chối",
  cancelled: "Đã hủy",
};

const statusColorMap = {
  pending: "gold",
  approved: "green",
  rejected: "red",
  cancelled: "default",
};

const { Title, Paragraph, Text } = Typography;
const { TextArea } = Input;

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
      await careAppointmentApi.updateAppointment(editingId, editForm);
      await fetchMyAppointments();
      cancelEdit();
    } catch (err) {
      showErrorPopup(err.message || "Không thể cập nhật lịch hẹn");
    } finally {
      setSavingEdit(false);
    }
  };

  const selectPetOptions = petTypeOptions.map((option) => ({
    value: option,
    label: option,
  }));

  const selectServiceOptions = serviceTypeOptions.map((option) => ({
    value: option,
    label: option,
  }));

  const totalPending = appointments.filter((item) => item.status === "pending").length;
  const totalApproved = appointments.filter((item) => item.status === "approved").length;

  return (
    <div className="font-['Poppins','Segoe_UI',sans-serif] min-h-screen bg-[#f4f6fb] relative overflow-x-hidden">
      <div className="pointer-events-none absolute inset-0 opacity-60">
        <div className="absolute -top-28 -left-16 h-72 w-72 rounded-full bg-[#ffd8b1] blur-3xl" />
        <div className="absolute top-40 -right-24 h-80 w-80 rounded-full bg-[#c6e6ff] blur-3xl" />
      </div>
      <Header />
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-28">
        <div className="mb-7 rounded-3xl bg-gradient-to-r from-[#1f3a5f] via-[#31598c] to-[#4f7eb9] p-6 sm:p-8 text-white shadow-xl">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <Title level={2} className="!text-white !mb-1">
                Đặt lịch chăm sóc thú cưng
              </Title>
              <Paragraph className="!text-blue-100 !mb-0 max-w-2xl">
                Đặt lịch nhanh theo ngày và khung giờ phù hợp. Đội ngũ PawHouse sẽ xác nhận qua email ngay sau khi duyệt.
              </Paragraph>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-white/15 backdrop-blur px-4 py-3 min-w-[140px]">
                <Text className="!text-blue-100 text-xs">Chờ duyệt</Text>
                <div className="text-2xl font-bold">{totalPending}</div>
              </div>
              <div className="rounded-2xl bg-white/15 backdrop-blur px-4 py-3 min-w-[140px]">
                <Text className="!text-blue-100 text-xs">Đã duyệt</Text>
                <div className="text-2xl font-bold">{totalApproved}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
          <section className="lg:col-span-2">
            <Card
              bordered={false}
              className="rounded-3xl shadow-md"
              styles={{ body: { padding: 24 } }}
              title={
                <div className="flex items-center gap-2 text-slate-800">
                  <ScissorOutlined />
                  <span className="font-semibold text-lg">Thông tin lịch hẹn</span>
                </div>
              }
            >
              <form className="space-y-4" onSubmit={handleSubmit}>
                <div>
                  <Text strong>Tên thú cưng *</Text>
                  <Input
                    size="large"
                    value={form.petName}
                    onChange={handleChange("petName")}
                    placeholder="Ví dụ: Mochi"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Text strong>Loại thú cưng *</Text>
                  <Select
                    size="large"
                    value={form.petType || undefined}
                    onChange={(value) => setForm((prev) => ({ ...prev, petType: value || "" }))}
                    options={selectPetOptions}
                    placeholder="Chọn loại thú cưng"
                    className="mt-1 w-full"
                  />
                </div>

                <div>
                  <Text strong>Dịch vụ *</Text>
                  <Select
                    size="large"
                    value={form.serviceType || undefined}
                    onChange={(value) => setForm((prev) => ({ ...prev, serviceType: value || "" }))}
                    options={selectServiceOptions}
                    placeholder="Chọn dịch vụ"
                    className="mt-1 w-full"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <Text strong>Ngày hẹn *</Text>
                    <DatePicker
                      size="large"
                      className="mt-1 w-full"
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
                    <Text strong>Giờ bắt đầu *</Text>
                    <TimePicker
                      size="large"
                      className="mt-1 w-full"
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
                  <Text strong>Ghi chú</Text>
                  <TextArea
                    rows={4}
                    value={form.note}
                    onChange={handleChange("note")}
                    placeholder="Nhập thêm yêu cầu đặc biệt nếu có"
                    className="mt-1"
                  />
                </div>

                <Alert
                  type="info"
                  showIcon
                  icon={<InfoCircleOutlined />}
                  className="rounded-xl"
                  message="Khung giờ phục vụ từ 08:00 đến 20:00, cách nhau 30 phút"
                />

                <Button
                  htmlType="submit"
                  loading={submitting}
                  type="primary"
                  size="large"
                  className="!h-11 !rounded-xl !bg-[#2f5d9b] !font-medium"
                  block
                >
                  {submitting ? "Đang gửi lịch..." : "Đặt lịch ngay"}
                </Button>
              </form>
            </Card>
          </section>

          <section className="lg:col-span-3">
            <Card
              bordered={false}
              className="rounded-3xl shadow-md"
              styles={{ body: { padding: 24 } }}
              title={
                <div className="flex items-center gap-2 text-slate-800">
                  <CalendarOutlined />
                  <span className="font-semibold text-lg">Lịch chăm sóc của bạn</span>
                </div>
              }
            >
            {loading ? (
              <div className="space-y-4">
                <Skeleton active paragraph={{ rows: 2 }} />
                <Skeleton active paragraph={{ rows: 2 }} />
              </div>
            ) : appointments.length === 0 ? (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description="Bạn chưa có lịch hẹn nào"
              />
            ) : (
              <div className="space-y-3">
                {appointments.map((item) => (
                  <Card
                    key={item._id}
                    bordered={false}
                    className="!rounded-2xl !bg-[#f8fbff] !shadow-sm"
                    styles={{ body: { padding: 16 } }}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <div>
                        <p className="text-slate-900 font-semibold text-base">{item.petName} - {item.serviceType}</p>
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-slate-600">
                          <span className="inline-flex items-center gap-1">
                            <CalendarOutlined />
                            {new Date(item.appointmentDate).toLocaleDateString("vi-VN")}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <ClockCircleOutlined />
                            {item.startTime}
                          </span>
                        </div>
                        <p className="text-sm text-slate-500 mt-1">Loại thú cưng: {item.petType}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Tag
                          icon={item.status === "approved" ? <CheckCircleOutlined /> : undefined}
                          color={statusColorMap[item.status] || "default"}
                          className="!mr-0 !px-3 !py-1 !rounded-full"
                        >
                          {statusLabel[item.status] || item.status}
                        </Tag>
                        {item.status === "pending" && editingId !== item._id && (
                          <Button
                            type="default"
                            size="small"
                            icon={<EditOutlined />}
                            onClick={() => startEdit(item)}
                          >
                            Chỉnh sửa
                          </Button>
                        )}
                      </div>
                    </div>
                    {item.note && <p className="mt-2 text-sm text-slate-600">Ghi chú: {item.note}</p>}

                    {editingId === item._id && (
                      <div className="mt-4 p-4 rounded-xl border border-blue-200 bg-white space-y-3">
                        <h3 className="font-semibold text-slate-800">Chỉnh sửa lịch hẹn</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <Input
                            size="large"
                            value={editForm.petName}
                            onChange={handleEditChange("petName")}
                            placeholder="Tên thú cưng"
                          />
                          <Select
                            size="large"
                            value={editForm.petType || undefined}
                            onChange={(value) => setEditForm((prev) => ({ ...prev, petType: value || "" }))}
                            options={selectPetOptions}
                            placeholder="Chọn loại thú cưng"
                          />
                          <Select
                            size="large"
                            value={editForm.serviceType || undefined}
                            onChange={(value) =>
                              setEditForm((prev) => ({ ...prev, serviceType: value || "" }))
                            }
                            options={selectServiceOptions}
                            placeholder="Chọn dịch vụ"
                            className="md:col-span-2"
                          />
                          <DatePicker
                            size="large"
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
                              size="large"
                              className="w-full"
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
                          <TextArea
                            rows={3}
                            value={editForm.note}
                            onChange={handleEditChange("note")}
                            placeholder="Ghi chú"
                            className="md:col-span-2"
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button
                            onClick={saveEdit}
                            disabled={savingEdit}
                            type="primary"
                            loading={savingEdit}
                          >
                            Lưu thay đổi
                          </Button>
                          <Button
                            onClick={cancelEdit}
                            disabled={savingEdit}
                          >
                            Hủy
                          </Button>
                        </div>
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            )}
            </Card>
          </section>
        </div>
      </main>

      <Modal
        title="Thông báo"
        open={Boolean(errorPopup)}
        onCancel={() => setErrorPopup("")}
        footer={[
          <Button key="ok" type="primary" onClick={() => setErrorPopup("")}>
            Đã hiểu
          </Button>,
        ]}
      >
        <p>{errorPopup}</p>
      </Modal>

      <Footer />
    </div>
  );
}

import { useCallback, useEffect, useMemo, useState } from "react";
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
  Pagination,
  Select,
  Skeleton,
  TimePicker,
  Typography,
} from "antd";
import {
  CalendarOutlined,
  ClockCircleOutlined,
  EditOutlined,
  InfoCircleOutlined,
  PlusOutlined,
  DeleteOutlined,
  ScissorOutlined,
} from "@ant-design/icons";
import { Header, Footer } from "../components/layout";
import { careAppointmentApi } from "../services/api";
import { STORAGE_KEYS } from "../utils/constants";

const initialForm = {
  appointmentDate: "",
  startTime: "",
  note: "",
};

const initialEditForm = {
  petName: "",
  petType: "",
  serviceType: "",
  appointmentDate: "",
  startTime: "",
  note: "",
};

const initialPetEntry = {
  petName: "",
  petType: "",
  serviceType: "",
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
const APPOINTMENT_PAGE_SIZE = 6;
const MAX_PETS_PER_BOOKING = 3;
const BATCH_NOTE_REGEX = /\[BATCH:([A-Za-z0-9_-]+):(\d+)\/(\d+)\]\s*$/;

const statusLabel = {
  pending: "Chờ duyệt",
  approved: "Đã duyệt",
  confirmed: "Đã xác nhận",
  checked_in: "Đã check-in",
  in_progress: "Đang chăm sóc",
  completed: "Hoàn tất",
  rejected: "Từ chối",
  cancelled: "Đã hủy",
  mixed: "Nhiều trạng thái",
};

const statusClassMap = {
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  approved: "bg-emerald-50 text-emerald-700 border-emerald-200",
  confirmed: "bg-sky-50 text-sky-700 border-sky-200",
  checked_in: "bg-indigo-50 text-indigo-700 border-indigo-200",
  in_progress: "bg-violet-50 text-violet-700 border-violet-200",
  completed: "bg-teal-50 text-teal-700 border-teal-200",
  rejected: "bg-rose-50 text-rose-700 border-rose-200",
  cancelled: "bg-slate-100 text-slate-700 border-slate-200",
  mixed: "bg-gray-100 text-gray-700 border-gray-200",
};

function renderStatusBadge(status) {
  const normalized = String(status || "").toLowerCase();
  const label = statusLabel[normalized] || normalized || "Không xác định";
  const className =
    statusClassMap[normalized] || "bg-gray-100 text-gray-700 border-gray-200";

  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${className}`}
    >
      {label}
    </span>
  );
}

function canCancelAppointment(status) {
  const normalized = String(status || "").toLowerCase();
  return ["pending", "approved", "confirmed"].includes(normalized);
}

function getGroupStatus(items = []) {
  const uniqueStatuses = Array.from(
    new Set(items.map((item) => String(item.status || "").toLowerCase()).filter(Boolean)),
  );

  if (uniqueStatuses.length === 1) {
    return uniqueStatuses[0];
  }

  if (uniqueStatuses.length > 1) {
    return "mixed";
  }

  return "";
}

function parseBatchNote(note = "") {
  const rawNote = String(note || "");
  const matched = rawNote.match(BATCH_NOTE_REGEX);

  if (!matched) {
    return {
      batchId: "",
      sequence: 0,
      total: 0,
      cleanNote: rawNote,
    };
  }

  return {
    batchId: matched[1],
    sequence: Number(matched[2]) || 0,
    total: Number(matched[3]) || 0,
    cleanNote: rawNote.replace(BATCH_NOTE_REGEX, "").trim(),
  };
}

const { Text } = Typography;
const { TextArea } = Input;

export default function CareAppointmentsPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [petEntries, setPetEntries] = useState([{ ...initialPetEntry }]);
  const [editForm, setEditForm] = useState(initialEditForm);
  const [editingId, setEditingId] = useState("");
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: APPOINTMENT_PAGE_SIZE,
    total: 0,
    pages: 1,
  });
  const [submitting, setSubmitting] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);
  const [canceling, setCanceling] = useState(false);
  const [cancelPopup, setCancelPopup] = useState({
    open: false,
    appointmentIds: [],
    reason: "",
  });
  const [errorPopup, setErrorPopup] = useState("");

  const showErrorPopup = (message) => {
    setErrorPopup(message || "Đã xảy ra lỗi, vui lòng thử lại");
  };

  const fetchMyAppointments = useCallback(async (page = currentPage) => {
    try {
      setLoading(true);
      const res = await careAppointmentApi.getMyAppointments({
        page,
        limit: APPOINTMENT_PAGE_SIZE,
      });

      const nextPagination =
        res.pagination ||
        {
          page,
          limit: APPOINTMENT_PAGE_SIZE,
          total: (res.appointments || []).length,
          pages: 1,
        };

      if (nextPagination.pages > 0 && page > nextPagination.pages) {
        setCurrentPage(nextPagination.pages);
        return;
      }

      setAppointments(res.appointments || []);
      setPagination(nextPagination);
    } catch (err) {
      showErrorPopup(err.message || "Không thể tải lịch chăm sóc");
    } finally {
      setLoading(false);
    }
  }, [currentPage]);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

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

  const buildSequentialTimes = (startTime, count) => {
    const [hour, minute] = String(startTime || "").split(":").map(Number);
    if (Number.isNaN(hour) || Number.isNaN(minute)) return [];
    if (minute % 30 !== 0) return [];

    const startTotalMinutes = hour * 60 + minute;
    const maxTotalMinutes = BUSINESS_END_HOUR * 60;
    const times = [];

    for (let i = 0; i < count; i += 1) {
      const slotMinutes = startTotalMinutes + i * 30;
      if (slotMinutes > maxTotalMinutes) {
        return [];
      }

      const slotHour = Math.floor(slotMinutes / 60);
      const slotMinute = slotMinutes % 60;
      times.push(
        `${String(slotHour).padStart(2, "0")}:${String(slotMinute).padStart(2, "0")}`,
      );
    }

    return times;
  };

  const handlePetChange = (index, key, value) => {
    setPetEntries((prev) =>
      prev.map((entry, i) => (i === index ? { ...entry, [key]: value } : entry)),
    );
  };

  const addPetEntry = () => {
    setPetEntries((prev) => {
      if (prev.length >= MAX_PETS_PER_BOOKING) return prev;
      return [...prev, { ...initialPetEntry }];
    });
  };

  const removePetEntry = (index) => {
    setPetEntries((prev) => {
      if (prev.length <= 1) return prev;
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.appointmentDate || !form.startTime) {
      showErrorPopup("Vui lòng điền đầy đủ thông tin bắt buộc");
      return;
    }

    if (petEntries.length < 1 || petEntries.length > MAX_PETS_PER_BOOKING) {
      showErrorPopup("Số lượng thú cưng phải từ 1 đến 3");
      return;
    }

    const hasInvalidPet = petEntries.some(
      (entry) =>
        !String(entry.petName || "").trim() ||
        !String(entry.petType || "").trim() ||
        !String(entry.serviceType || "").trim(),
    );
    if (hasInvalidPet) {
      showErrorPopup("Vui lòng nhập đầy đủ tên, loại và dịch vụ cho từng thú cưng");
      return;
    }

    const slotTimes = buildSequentialTimes(form.startTime, petEntries.length);
    if (slotTimes.length !== petEntries.length) {
      showErrorPopup("Khung giờ không đủ cho 2-3 thú cưng liên tiếp trong ngày");
      return;
    }

    for (const slotTime of slotTimes) {
      const pastError = validateNotPast(form.appointmentDate, slotTime);
      if (pastError) {
        showErrorPopup(pastError);
        return;
      }
    }

    try {
      setSubmitting(true);
      const cleanNote = String(form.note || "").trim();
      const batchId =
        petEntries.length > 1
          ? `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
          : "";

      for (let i = 0; i < petEntries.length; i += 1) {
        const pet = petEntries[i];
        const decoratedNote =
          petEntries.length > 1
            ? `${cleanNote}${cleanNote ? "\n" : ""}[BATCH:${batchId}:${i + 1}/${petEntries.length}]`
            : cleanNote;

        const payload = {
          ...form,
          petName: String(pet.petName || "").trim(),
          petType: String(pet.petType || "").trim(),
          serviceType: String(pet.serviceType || "").trim(),
          startTime: slotTimes[i],
          note: decoratedNote,
        };

        await careAppointmentApi.createAppointment(payload);
      }

      setCurrentPage(1);
      await fetchMyAppointments(1);
      setForm(initialForm);
      setPetEntries([{ ...initialPetEntry }]);
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
      note: parseBatchNote(item.note).cleanNote,
    });
  };

  const cancelEdit = () => {
    setEditingId("");
    setEditForm(initialEditForm);
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

  const openCancelPopup = (appointmentIdOrIds) => {
    const appointmentIds = Array.isArray(appointmentIdOrIds)
      ? appointmentIdOrIds
      : [appointmentIdOrIds];

    setCancelPopup({
      open: true,
      appointmentIds,
      reason: "",
    });
  };

  const closeCancelPopup = () => {
    setCancelPopup({
      open: false,
      appointmentIds: [],
      reason: "",
    });
  };

  const submitCancelAppointment = async () => {
    const reason = String(cancelPopup.reason || "").trim();
    if (!reason) {
      showErrorPopup("Vui lòng nhập lý do hủy lịch");
      return;
    }

    try {
      setCanceling(true);
      const ids = Array.isArray(cancelPopup.appointmentIds)
        ? cancelPopup.appointmentIds.filter(Boolean)
        : [];

      if (!ids.length) {
        showErrorPopup("Không tìm thấy lịch để hủy");
        return;
      }

      for (const id of ids) {
        await careAppointmentApi.cancelAppointment(id, reason);
      }

      await fetchMyAppointments();
      closeCancelPopup();
      if (ids.includes(editingId)) {
        cancelEdit();
      }
    } catch (err) {
      showErrorPopup(err.message || "Không thể hủy lịch hẹn");
    } finally {
      setCanceling(false);
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

  const groupedAppointments = useMemo(() => {
    const grouped = [];
    const groupIndexByBatchId = new Map();

    appointments.forEach((item) => {
      const parsed = parseBatchNote(item.note);
      const enrichedItem = {
        ...item,
        _batchId: parsed.batchId,
        _batchSequence: parsed.sequence,
        _batchTotal: parsed.total,
        _displayNote: parsed.cleanNote,
      };

      if (!parsed.batchId) {
        grouped.push({
          key: `single-${item._id}`,
          isBatch: false,
          items: [enrichedItem],
        });
        return;
      }

      if (groupIndexByBatchId.has(parsed.batchId)) {
        const index = groupIndexByBatchId.get(parsed.batchId);
        grouped[index].items.push(enrichedItem);
        grouped[index].total = Math.max(grouped[index].total, parsed.total || 0);
        return;
      }

      groupIndexByBatchId.set(parsed.batchId, grouped.length);
      grouped.push({
        key: `batch-${parsed.batchId}`,
        isBatch: true,
        batchId: parsed.batchId,
        total: parsed.total || 0,
        items: [enrichedItem],
      });
    });

    grouped.forEach((group) => {
      if (group.isBatch) {
        group.items.sort((a, b) => a._batchSequence - b._batchSequence);
      }
    });

    return grouped.map((group) => {
      const pendingItems = group.items.filter(
        (item) => String(item.status || "").toLowerCase() === "pending",
      );
      const cancelableItems = group.items.filter((item) =>
        canCancelAppointment(item.status),
      );

      return {
        ...group,
        groupStatus: getGroupStatus(group.items),
        pendingItems,
        cancelableItems,
        canGroupEdit:
          group.isBatch &&
          pendingItems.length === group.items.length &&
          pendingItems.length > 0,
        canGroupCancel: group.isBatch && cancelableItems.length > 0,
        editTargetItem: pendingItems[0] || null,
      };
    });
  }, [appointments]);

  return (
    <div className="font-['Inter',sans-serif] min-h-screen bg-gray-50">
      <Header />

      <section className="bg-linear-to-r from-orange-500 to-amber-500 text-white pt-28 pb-10 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-3xl lg:text-4xl font-bold mb-2">
            ✂️ Đặt lịch chăm sóc PawHouse
          </h1>
          <p className="text-lg text-white/90 max-w-2xl mx-auto">
            Đặt lịch nhanh cho 1 đến 3 thú cưng với dịch vụ phù hợp cho từng bé
          </p>
        </div>
      </section>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <Text strong>Danh sách thú cưng</Text>
                    <Button
                      type="default"
                      size="small"
                      icon={<PlusOutlined />}
                      onClick={addPetEntry}
                      disabled={petEntries.length >= MAX_PETS_PER_BOOKING}
                    >
                      Thêm thú cưng
                    </Button>
                  </div>

                  {petEntries.map((pet, index) => (
                    <div
                      key={`pet-entry-${index}`}
                      className="rounded-xl border border-slate-200 p-3 bg-slate-50"
                    >
                      <div className="mb-2 flex items-center justify-between gap-2">
                        <Text className="text-slate-700!">Thú cưng {index + 1}</Text>
                        <Button
                          type="text"
                          danger
                          size="small"
                          icon={<DeleteOutlined />}
                          onClick={() => removePetEntry(index)}
                          disabled={petEntries.length === 1}
                        >
                          Xóa
                        </Button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <Input
                          size="large"
                          value={pet.petName}
                          onChange={(e) => handlePetChange(index, "petName", e.target.value)}
                          placeholder="Tên thú cưng"
                        />
                        <Select
                          size="large"
                          value={pet.petType || undefined}
                          onChange={(value) => handlePetChange(index, "petType", value || "")}
                          options={selectPetOptions}
                          placeholder="Chọn loại thú cưng"
                          className="w-full"
                        />
                        <Select
                          size="large"
                          value={pet.serviceType || undefined}
                          onChange={(value) => handlePetChange(index, "serviceType", value || "")}
                          options={selectServiceOptions}
                          placeholder="Chọn dịch vụ"
                          className="sm:col-span-2 w-full"
                        />
                      </div>
                    </div>
                  ))}
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
                <div>
                  <Alert
                  type="info"
                  showIcon
                  icon={<InfoCircleOutlined />}
                  className="rounded-xl"
                  message="Khung giờ phục vụ từ 08:00 đến 20:00, cách nhau 30 phút."
                />
                </div>

                <Button
                  htmlType="submit"
                  loading={submitting}
                  type="primary"
                  size="large"
                  className="h-11! rounded-xl! bg-orange-500! font-medium! hover:bg-orange-600!"
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
              ) : groupedAppointments.length === 0 ? (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description="Bạn chưa có lịch hẹn nào"
                />
              ) : (
                <div className="space-y-3">
                  {groupedAppointments.map((group) => {
                    return (
                      <div key={group.key}>
                        <Card
                          bordered={false}
                          className="rounded-2xl! bg-white! shadow-sm!"
                          styles={{ body: { padding: 16 } }}
                        >
                          {group.isBatch ? (
                            <div className="mb-3 rounded-xl bg-orange-50 border border-orange-100 px-3 py-2">
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <span className="text-sm text-orange-700 font-medium">
                                  Lịch nhóm {group.total || group.items.length} thú cưng
                                </span>
                                <div className="flex items-center gap-2">
                                  {renderStatusBadge(group.groupStatus)}
                                  {group.canGroupEdit && group.editTargetItem ? (
                                    <Button
                                      type="default"
                                      size="small"
                                      icon={<EditOutlined />}
                                      onClick={() => startEdit(group.editTargetItem)}
                                    >
                                      Chỉnh sửa
                                    </Button>
                                  ) : null}
                                  {group.canGroupCancel ? (
                                    <Button
                                      danger
                                      size="small"
                                      onClick={() =>
                                        openCancelPopup(
                                          group.cancelableItems.map((item) => item._id),
                                        )
                                      }
                                    >
                                      Hủy lịch
                                    </Button>
                                  ) : null}
                                </div>
                              </div>
                            </div>
                          ) : null}

                          <div className="space-y-4">
                            {group.items.map((item, idx) => (
                              <div
                                key={item._id}
                                className={idx > 0 ? "pt-4 border-t border-slate-200" : ""}
                              >
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                                  <div>
                                    <p className="text-slate-900 font-semibold text-base">
                                      {item.petName} - {item.serviceType}
                                    </p>
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
                                    <p className="text-sm text-slate-500 mt-1">
                                      Loại thú cưng: {item.petType}
                                    </p>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    {!group.isBatch ? renderStatusBadge(item.status) : null}
                                    {!group.isBatch && item.status === "pending" && editingId !== item._id ? (
                                      <Button
                                        type="default"
                                        size="small"
                                        icon={<EditOutlined />}
                                        onClick={() => startEdit(item)}
                                      >
                                        Chỉnh sửa
                                      </Button>
                                    ) : null}
                                    {!group.isBatch && canCancelAppointment(item.status) ? (
                                      <Button
                                        danger
                                        size="small"
                                        onClick={() => openCancelPopup(item._id)}
                                      >
                                        Hủy lịch
                                      </Button>
                                    ) : null}
                                  </div>
                                </div>

                                {item._displayNote && (
                                  <p className="mt-2 text-sm text-slate-600">
                                    Ghi chú: {item._displayNote}
                                  </p>
                                )}

                                {editingId === item._id ? (
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
                                ) : null}
                              </div>
                            ))}
                          </div>
                        </Card>
                      </div>
                    );
                  })}

                  {pagination.total > pagination.limit ? (
                    <div className="pt-3 flex justify-end">
                      <Pagination
                        current={currentPage}
                        pageSize={pagination.limit}
                        total={pagination.total}
                        onChange={handlePageChange}
                        showSizeChanger={false}
                      />
                    </div>
                  ) : null}
                </div>
              )}
            </Card>
          </section>
        </div>
      </main>

      <Modal
        title="Hủy lịch hẹn"
        open={cancelPopup.open}
        onCancel={closeCancelPopup}
        footer={[
          <Button key="close-cancel" onClick={closeCancelPopup} disabled={canceling}>
            Đóng
          </Button>,
          <Button
            key="confirm-cancel"
            type="primary"
            danger
            loading={canceling}
            onClick={submitCancelAppointment}
          >
            Xác nhận hủy
          </Button>,
        ]}
      >
        <div className="space-y-2">
          <Text>Vui lòng nhập lý do hủy lịch:</Text>
          <TextArea
            rows={4}
            value={cancelPopup.reason}
            onChange={(e) =>
              setCancelPopup((prev) => ({ ...prev, reason: e.target.value }))
            }
            placeholder="Nhập lý do hủy..."
          />
        </div>
      </Modal>

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

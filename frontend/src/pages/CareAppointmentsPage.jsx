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

const petTypeOptions = ["Dog", "Cat", "Rabbit", "Hamster", "Bird", "Other"];
const serviceTypeOptions = [
  "Spa bath",
  "Grooming",
  "Ear & nail care",
  "Coat & skin care",
  "Full care package",
];

const BUSINESS_START_HOUR = 8;
const BUSINESS_END_HOUR = 20;
const MAX_PETS_PER_BOOKING = 6;
const APPOINTMENT_PAGE_SIZE = 6;
const APPOINTMENT_FETCH_LIMIT = 50;
const BATCH_NOTE_REGEX = /\[BATCH:([A-Za-z0-9_-]+):(\d+)\/(\d+)\]\s*$/;

const statusLabel = {
  pending: "Pending",
  approved: "Approved",
  confirmed: "Confirmed",
  checked_in: "Checked In",
  in_progress: "In Progress",
  completed: "Completed",
  rejected: "Rejected",
  cancelled: "Cancelled",
  mixed: "Multiple Statuses",
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
  const label = statusLabel[normalized] || normalized || "Unknown";
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
  const [selectedAppointment, setSelectedAppointment] = useState(null);
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
  const [expandedGroups, setExpandedGroups] = useState({});
  const [errorPopup, setErrorPopup] = useState("");

  const showErrorPopup = (message) => {
    setErrorPopup(message || "An error occurred, please try again");
  };

  const fetchMyAppointments = useCallback(async () => {
    try {
      setLoading(true);
      const allAppointments = [];
      let page = 1;
      let totalPages = 1;

      do {
        const res = await careAppointmentApi.getMyAppointments({
          page,
          limit: APPOINTMENT_FETCH_LIMIT,
        });

        allAppointments.push(...(res.appointments || []));
        totalPages = Math.max(Number(res.pagination?.pages || 1), 1);
        page += 1;
      } while (page <= totalPages);

      setAppointments(allAppointments);
    } catch (err) {
      showErrorPopup(err.message || "Unable to load appointments");
    } finally {
      setLoading(false);
    }
  }, []);

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
      return "Cannot book appointments in the past";
    }

    if (selectedDate.getTime() === today.getTime()) {
      const [h, m] = String(startTimeStr).split(":").map(Number);
      const startMinutes = h * 60 + m;
      const nowMinutes = now.getHours() * 60 + now.getMinutes();
      if (startMinutes <= nowMinutes) {
        return "Start time must be later than the current time";
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
      showErrorPopup("Please fill in all required fields");
      return;
    }

    if (petEntries.length < 1) {
      showErrorPopup("Please add at least 1 pet");
      return;
    }

    const hasInvalidPet = petEntries.some(
      (entry) =>
        !String(entry.petName || "").trim() ||
        !String(entry.petType || "").trim() ||
        !String(entry.serviceType || "").trim(),
    );
    if (hasInvalidPet) {
      showErrorPopup("Please enter the name, type and service for each pet");
      return;
    }

    const slotTimes = buildSequentialTimes(form.startTime, petEntries.length);
    if (slotTimes.length !== petEntries.length) {
      showErrorPopup("Not enough time slots to schedule all pets consecutively in this day");
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
      await fetchMyAppointments();
      setForm(initialForm);
      setPetEntries([{ ...initialPetEntry }]);
    } catch (err) {
      showErrorPopup(err.message || "Unable to book appointment");
    } finally {
      setSubmitting(false);
    }
  };

  const startEdit = (item) => {
    setEditingId(item._id);
    const parsed = parseBatchNote(item.note);
    setEditForm({
      petName: item.petName || "",
      petType: item.petType || "",
      serviceType: item.serviceType || "",
      appointmentDate: dayjs(item.appointmentDate).format("YYYY-MM-DD"),
      startTime: item.startTime || "",
      note: parsed.cleanNote,
      _batchInfo: parsed.batchId ? {
        batchId: parsed.batchId,
        sequence: parsed.sequence,
        total: parsed.total
      } : null
    });
  };

  const cancelEdit = () => {
    setEditingId("");
    setEditForm(initialEditForm);
  };

  const saveEdit = async () => {
    if (!editingId) return;

    if (!editForm.petName || !editForm.petType || !editForm.serviceType || !editForm.appointmentDate || !editForm.startTime) {
      showErrorPopup("Please fill in all required fields when editing");
      return;
    }

    const pastError = validateNotPast(editForm.appointmentDate, editForm.startTime);
    if (pastError) {
      showErrorPopup(pastError);
      return;
    }

    try {
      setSavingEdit(true);
      
      const cleanNote = String(editForm.note || "").trim();
      let finalNote = cleanNote;
      if (editForm._batchInfo) {
        finalNote = `${cleanNote}${cleanNote ? "\n" : ""}[BATCH:${editForm._batchInfo.batchId}:${editForm._batchInfo.sequence}/${editForm._batchInfo.total}]`;
      }
      
      const payload = {
        ...editForm,
        note: finalNote
      };
      delete payload._batchInfo;

      await careAppointmentApi.updateAppointment(editingId, payload);
      await fetchMyAppointments();
      cancelEdit();
    } catch (err) {
      showErrorPopup(err.message || "Unable to update appointment");
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
      showErrorPopup("Please enter a reason for cancellation");
      return;
    }

    try {
      setCanceling(true);
      const ids = Array.isArray(cancelPopup.appointmentIds)
        ? cancelPopup.appointmentIds.filter(Boolean)
        : [];

      if (!ids.length) {
        showErrorPopup("No appointment found to cancel");
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
      showErrorPopup(err.message || "Unable to cancel appointment");
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

  const paginatedGroupedAppointments = useMemo(() => {
    const startIndex = (currentPage - 1) * APPOINTMENT_PAGE_SIZE;
    return groupedAppointments.slice(startIndex, startIndex + APPOINTMENT_PAGE_SIZE);
  }, [groupedAppointments, currentPage]);

  useEffect(() => {
    const totalGroups = groupedAppointments.length;
    const totalPages = Math.max(Math.ceil(totalGroups / APPOINTMENT_PAGE_SIZE), 1);

    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }

    setPagination({
      page: Math.min(currentPage, totalPages),
      limit: APPOINTMENT_PAGE_SIZE,
      total: totalGroups,
      pages: totalPages,
    });
  }, [groupedAppointments, currentPage]);

  const toggleGroupDetails = (groupKey) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [groupKey]: !prev[groupKey],
    }));
  };

  return (
    <div className="font-['Inter',sans-serif] min-h-screen bg-gray-50">
      <Header />

      <section className="bg-linear-to-r from-orange-500 to-amber-500 text-white pt-28 pb-10 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-3xl lg:text-4xl font-bold mb-2">
            ✂️ Book a PawHouse Care Appointment
          </h1>
          <p className="text-lg text-white/90 max-w-2xl mx-auto">
            Book quickly for multiple pets with services tailored for each one
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
                  <span className="font-semibold text-lg">Appointment Details</span>
                </div>
              }
            >
              <form className="space-y-4" onSubmit={handleSubmit}>
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <Text strong>Pet List</Text>
                    <Button
                      type="default"
                      size="small"
                      icon={<PlusOutlined />}
                      onClick={addPetEntry}
                    >
                      Add Pet
                    </Button>
                  </div>

                  {petEntries.map((pet, index) => (
                    <div
                      key={`pet-entry-${index}`}
                      className="rounded-xl border border-slate-200 p-3 bg-slate-50"
                    >
                      <div className="mb-2 flex items-center justify-between gap-2">
                        <Text className="text-slate-700!">Pet {index + 1}</Text>
                        <Button
                          type="text"
                          danger
                          size="small"
                          icon={<DeleteOutlined />}
                          onClick={() => removePetEntry(index)}
                          disabled={petEntries.length === 1}
                        >
                          Remove
                        </Button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <Input
                          size="large"
                          value={pet.petName}
                          onChange={(e) => handlePetChange(index, "petName", e.target.value)}
                          placeholder="Pet name"
                        />
                        <Select
                          size="large"
                          value={pet.petType || undefined}
                          onChange={(value) => handlePetChange(index, "petType", value || "")}
                          options={selectPetOptions}
                          placeholder="Select pet type"
                          className="w-full"
                        />
                        <Select
                          size="large"
                          value={pet.serviceType || undefined}
                          onChange={(value) => handlePetChange(index, "serviceType", value || "")}
                          options={selectServiceOptions}
                          placeholder="Select service"
                          className="sm:col-span-2 w-full"
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <Text strong>Appointment Date *</Text>
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
                      placeholder="Select date"
                    />
                  </div>

                  <div>
                    <Text strong>Start Time *</Text>
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
                      placeholder="Select time"
                    />
                  </div>
                </div>

                <div>
                  <Text strong>Note</Text>
                  <TextArea
                    rows={4}
                    value={form.note}
                    onChange={handleChange("note")}
                    placeholder="Enter any special requests if applicable"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Alert
                  type="info"
                  showIcon
                  icon={<InfoCircleOutlined />}
                  className="rounded-xl"
                  message="Service hours are from 08:00 to 20:00, with 30-minute intervals."
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
                  {submitting ? "Submitting..." : "Book Now"}
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
                  <span className="font-semibold text-lg">Your Care Schedule</span>
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
                  description="You have no appointments yet"
                />
              ) : (
                <div className="space-y-3">
                  {paginatedGroupedAppointments.map((group) => {
                    return (
                      <div key={group.key}>
                        <Card
                          bordered={false}
                          className="rounded-2xl! bg-white! shadow-sm!"
                          styles={{ body: { padding: 16 } }}
                        >
                          {group.isBatch ? (
                            <div className="mb-3 px-1 py-1">
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <div>
                                  <span className="text-sm text-orange-700 font-medium">
                                    Group schedule for {group.total || group.items.length} pet(s)
                                  </span>
                                  {group.items.length > 0 ? (
                                    <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-slate-600">
                                      <span>
                                        <CalendarOutlined /> {new Date(group.items[0].appointmentDate).toLocaleDateString("en-US")}
                                      </span>
                                      <span>
                                        <ClockCircleOutlined /> {group.items[0].startTime}
                                      </span>
                                    </div>
                                  ) : null}
                                </div>
                                <div className="flex items-center gap-2">
                                  <Button
                                    type="default"
                                    size="small"
                                    onClick={() => toggleGroupDetails(group.key)}
                                  >
                                    {expandedGroups[group.key] ? "Hide Details" : "View Group Details"}
                                  </Button>
                                  {renderStatusBadge(group.groupStatus)}
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
                                      Cancel 
                                    </Button>
                                  ) : null}
                                </div>
                              </div>
                            </div>
                          ) : null}

                          <div className="space-y-4">
                            {!group.isBatch || expandedGroups[group.key]
                              ? group.items.map((item, idx) => (
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
                                            {new Date(item.appointmentDate).toLocaleDateString("en-US")}
                                          </span>
                                          <span className="inline-flex items-center gap-1">
                                            <ClockCircleOutlined />
                                            {item.startTime}
                                          </span>
                                        </div>
                                        <p className="text-sm text-slate-500 mt-1">
                                          Pet type: {item.petType}
                                        </p>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <Button
                                          type="default"
                                          size="small"
                                          onClick={() => setSelectedAppointment(item)}
                                        >
                                          View Details
                                        </Button>
                                        {!group.isBatch ? renderStatusBadge(item.status) : null}
                                        {item.status === "pending" && editingId !== item._id ? (
                                          <Button
                                            type="default"
                                            size="small"
                                            icon={<EditOutlined />}
                                            onClick={() => startEdit(item)}
                                          >
                                            Edit
                                          </Button>
                                        ) : null}
                                        {!group.isBatch && canCancelAppointment(item.status) ? (
                                          <Button
                                            danger
                                            size="small"
                                            onClick={() => openCancelPopup(item._id)}
                                          >
                                            Cancel
                                          </Button>
                                        ) : null}
                                      </div>
                                    </div>

                                    {item._displayNote && (
                                      <p className="mt-2 text-sm text-slate-600">
                                        Note: {item._displayNote}
                                      </p>
                                    )}

                                    {editingId === item._id ? (
                                      <div className="mt-4 p-4 rounded-xl border border-blue-200 bg-white space-y-3">
                                        <h3 className="font-semibold text-slate-800">Edit Appointment</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                          <Input
                                            size="large"
                                            value={editForm.petName}
                                            onChange={handleEditChange("petName")}
                                            placeholder="Pet name"
                                          />
                                          <Select
                                            size="large"
                                            value={editForm.petType || undefined}
                                            onChange={(value) =>
                                              setEditForm((prev) => ({ ...prev, petType: value || "" }))
                                            }
                                            options={selectPetOptions}
                                            placeholder="Pet type"
                                          />
                                          <Select
                                            size="large"
                                            value={editForm.serviceType || undefined}
                                            onChange={(value) =>
                                              setEditForm((prev) => ({ ...prev, serviceType: value || "" }))
                                            }
                                            options={selectServiceOptions}
                                            placeholder="Service type"
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
                                            placeholder="Date"
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
                                              placeholder="Time"
                                            />
                                          </div>
                                          <TextArea
                                            rows={3}
                                            value={editForm.note}
                                            onChange={handleEditChange("note")}
                                            placeholder="Notes"
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
                                            Save Changes
                                          </Button>
                                          <Button onClick={cancelEdit} disabled={savingEdit}>
                                            Cancel
                                          </Button>
                                        </div>
                                      </div>
                                    ) : null}
                                  </div>
                                ))
                              : null}
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
        title="Appointment Details"
        open={Boolean(selectedAppointment)}
        onCancel={() => setSelectedAppointment(null)}
        footer={[
          <Button key="close-detail" type="primary" onClick={() => setSelectedAppointment(null)}>
            Close
          </Button>,
        ]}
      >
        {selectedAppointment ? (
          <div className="space-y-2 text-sm text-slate-700">
            <p><strong>Pet:</strong> {selectedAppointment.petName}</p>
            <p><strong>Type:</strong> {selectedAppointment.petType}</p>
            <p><strong>Service:</strong> {selectedAppointment.serviceType}</p>
            <p><strong>Date:</strong> {new Date(selectedAppointment.appointmentDate).toLocaleDateString("en-US")}</p>
            <p><strong>Time:</strong> {selectedAppointment.startTime}</p>
            <p><strong>Status:</strong> {statusLabel[String(selectedAppointment.status || "").toLowerCase()] || selectedAppointment.status}</p>
            <p><strong>Note:</strong> {selectedAppointment._displayNote || "No notes"}</p>
            {selectedAppointment.rejectionReason ? (
              <p className="text-rose-600"><strong>Rejection reason:</strong> {selectedAppointment.rejectionReason}</p>
            ) : null}
            {selectedAppointment.cancellationReason ? (
              <p className="text-amber-700"><strong>Cancellation reason:</strong> {selectedAppointment.cancellationReason}</p>
            ) : null}
          </div>
        ) : null}
      </Modal>

      <Modal
        title="Cancel Appointment"
        open={cancelPopup.open}
        onCancel={closeCancelPopup}
        footer={[
          <Button key="close-cancel" onClick={closeCancelPopup} disabled={canceling}>
            Close
          </Button>,
          <Button
            key="confirm-cancel"
            type="primary"
            danger
            loading={canceling}
            onClick={submitCancelAppointment}
          >
            Confirm Cancellation
          </Button>,
        ]}
      >
        <div className="space-y-2">
          <Text>Please enter a reason for cancellation:</Text>
          <TextArea
            rows={4}
            value={cancelPopup.reason}
            onChange={(e) =>
              setCancelPopup((prev) => ({ ...prev, reason: e.target.value }))
            }
            placeholder="Enter reason for cancellation..."
          />
        </div>
      </Modal>

      <Modal
        title="Notice"
        open={Boolean(errorPopup)}
        onCancel={() => setErrorPopup("")}
        footer={[
          <Button key="ok" type="primary" onClick={() => setErrorPopup("")}>
            OK
          </Button>,
        ]}
      >
        <p>{errorPopup}</p>
      </Modal>

      <Footer />
    </div>
  );
}

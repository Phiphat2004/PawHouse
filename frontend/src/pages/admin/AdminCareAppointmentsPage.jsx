import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import { DatePicker } from "antd";
import { AdminLayout } from "../../components/admin";
import { careAppointmentApi } from "../../services/api";
import { toast } from "react-toastify";

const statusLabel = {
  all: "All",
  pending: "Pending",
  approved: "Confirmed",
  confirmed: "Confirmed",
  rejected: "Rejected",
  cancelled: "Cancelled",
  checked_in: "Checked In",
  in_progress: "In Progress",
  completed: "Completed",
};

const statusClassName = {
  pending: "bg-amber-100 text-amber-700 border border-amber-200",
  approved: "bg-sky-100 text-sky-700 border border-sky-200",
  confirmed: "bg-blue-100 text-blue-700 border border-blue-200",
  rejected: "bg-rose-100 text-rose-700 border border-rose-200",
  cancelled: "bg-gray-100 text-gray-700 border border-gray-200",
  checked_in: "bg-indigo-100 text-indigo-700 border border-indigo-200",
  in_progress: "bg-violet-100 text-violet-700 border border-violet-200",
  completed: "bg-emerald-100 text-emerald-700 border border-emerald-200",
  mixed: "bg-gray-100 text-gray-700 border border-gray-200",
};

const BATCH_NOTE_REGEX = /\[BATCH:([A-Za-z0-9_-]+):(\d+)\/(\d+)\]\s*$/;

function renderStatusBadge(status) {
  const label = statusLabel[status] || status;
  const cls = statusClassName[status] || "bg-gray-100 text-gray-700 border border-gray-200";
  return (
    <span className={`inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${cls}`}>
      {label}
    </span>
  );
}

const statusActions = {
  confirmed: { label: "Confirm", type: "confirm" },
  checked_in: { label: "Check-in", type: "progress" },
  in_progress: { label: "Start Service", type: "progress" },
  completed: { label: "Complete", type: "progress" },
};

function getNextStatus(currentStatus) {
  if (currentStatus === "pending") return "confirmed";
  if (currentStatus === "approved" || currentStatus === "confirmed") return "checked_in";
  if (currentStatus === "checked_in") return "in_progress";
  if (currentStatus === "in_progress") return "completed";
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

export default function AdminCareAppointmentsPage() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("all");
  const [dateRange, setDateRange] = useState(["", ""]);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [processingId, setProcessingId] = useState("");
  const [expandedGroups, setExpandedGroups] = useState({});
  const [rejectPopup, setRejectPopup] = useState({
    open: false,
    appointmentIds: [],
    reason: "",
  });
  const [errorPopup, setErrorPopup] = useState("");

  const showErrorPopup = (message) => {
    setErrorPopup(message || "An error occurred, please try again");
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
      showErrorPopup(err.message || "Unable to load appointments");
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
      toast.success("Appointment confirmed and email sent to customer");
      await fetchAppointments();
      return true;
    } catch (err) {
      showErrorPopup(err.message || "Unable to confirm appointment");
      return false;
    } finally {
      setProcessingId("");
    }
  }

  function openRejectPopup(appointmentIdOrIds) {
    const appointmentIds = Array.isArray(appointmentIdOrIds)
      ? appointmentIdOrIds.filter(Boolean)
      : [appointmentIdOrIds].filter(Boolean);

    setSelectedAppointment(null);
    setRejectPopup({
      open: true,
      appointmentIds,
      reason: "",
    });
  }

  function closeRejectPopup() {
    setRejectPopup({
      open: false,
      appointmentIds: [],
      reason: "",
    });
  }

  async function submitReject() {
    const reason = rejectPopup.reason.trim();
    if (!reason) {
      showErrorPopup("Please enter a rejection reason");
      return;
    }

    const ids = Array.isArray(rejectPopup.appointmentIds)
      ? rejectPopup.appointmentIds.filter(Boolean)
      : [];

    if (!ids.length) {
      showErrorPopup("No appointment found to reject");
      return;
    }

    try {
      setProcessingId(`reject-${ids.join("-")}`);
      await Promise.all(ids.map((id) => careAppointmentApi.rejectAppointment(id, reason)));
      toast.success(ids.length > 1 ? `Rejected ${ids.length} appointments` : "Appointment rejected");
      await fetchAppointments();
      if (selectedAppointment && ids.includes(selectedAppointment._id)) {
        setSelectedAppointment(null);
      }
      closeRejectPopup();
    } catch (err) {
      showErrorPopup(err.message || "Unable to reject appointment");
    } finally {
      setProcessingId("");
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
      toast.success(`Status updated: ${statusLabel[nextStatus] || nextStatus}`);
      await fetchAppointments();
      return true;
    } catch (err) {
      showErrorPopup(err.message || "Unable to update status");
      return false;
    } finally {
      setProcessingId("");
    }
  }

  const groupedAppointments = useMemo(() => {
    const grouped = [];
    const groupIndexByBatchId = new Map();

    filteredAppointments.forEach((item) => {
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
          total: 1,
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
      const groupStatus = getGroupStatus(group.items);
      const nextStatus = groupStatus && groupStatus !== "mixed" ? getNextStatus(groupStatus) : "";

      return {
        ...group,
        pendingItems,
        groupStatus,
        nextStatus,
      };
    });
  }, [filteredAppointments]);

  async function handleApproveGroup(group) {
    const ids = (group?.pendingItems || []).map((item) => item._id).filter(Boolean);
    if (!ids.length) return;

    try {
      setProcessingId(group.key);
      await Promise.all(ids.map((id) => careAppointmentApi.approveAppointment(id)));
      toast.success(`Confirmed ${ids.length} appointments and sent email to customer`);
      await fetchAppointments();
    } catch (err) {
      showErrorPopup(err.message || "Unable to confirm group appointments");
    } finally {
      setProcessingId("");
    }
  }

  async function handleAdvanceGroup(group) {
    const nextStatus = group?.nextStatus;
    if (!nextStatus || nextStatus === "confirmed") return;

    const ids = (group?.items || [])
      .filter((item) => String(item.status || "").toLowerCase() === String(group.groupStatus || "").toLowerCase())
      .map((item) => item._id)
      .filter(Boolean);

    if (!ids.length) return;

    try {
      setProcessingId(group.key);
      await Promise.all(ids.map((id) => careAppointmentApi.updateAppointmentStatus(id, nextStatus)));
      toast.success(`Updated ${ids.length} appointments to status: ${statusLabel[nextStatus] || nextStatus}`);
      await fetchAppointments();
    } catch (err) {
      showErrorPopup(err.message || "Unable to update group appointment status");
    } finally {
      setProcessingId("");
    }
  }

  function toggleGroupDetails(groupKey) {
    setExpandedGroups((prev) => ({
      ...prev,
      [groupKey]: !prev[groupKey],
    }));
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-[#2c2c2c] mb-2">Pet Care Appointments</h2>
          <p className="text-gray-500">Review and manage spa appointments booked by customers.</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 flex flex-col md:flex-row gap-3">
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="approved">Confirmed (legacy)</option>
            <option value="confirmed">Confirmed</option>
            <option value="rejected">Rejected</option>
            <option value="cancelled">Cancelled</option>
            <option value="checked_in">Checked In</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
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
            placeholder={["From date", "To date"]}
            allowClear
          />
          <button
            onClick={() => {
              setStatus("all");
              setDateRange(["", ""]);
            }}
            className="px-4 py-2 bg-gray-100 rounded-lg text-gray-700"
          >
                        Reset
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-gray-500">Loading...</div>
          ) : groupedAppointments.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No appointments found</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left px-4 py-3 text-sm font-semibold text-gray-700">Customer</th>
                    <th className="text-left px-4 py-3 text-sm font-semibold text-gray-700">Pet</th>
                    <th className="text-left px-4 py-3 text-sm font-semibold text-gray-700">Service</th>
                    <th className="text-left px-4 py-3 text-sm font-semibold text-gray-700">Appointment</th>
                    <th className="text-right px-4 py-3 text-sm font-semibold text-gray-700">Actions</th>
                    <th className="text-left px-4 py-3 text-sm font-semibold text-gray-700">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {groupedAppointments.map((group) => {
                    if (!group.isBatch) {
                      const item = group.items[0];
                      return (
                        <tr key={item._id} className="border-b border-gray-100">
                          <td className="px-4 py-3 text-sm text-gray-700">
                            <p className="font-medium text-gray-900">{item.customerId?.profile?.fullName || item.customerId?.email || "Customer"}</p>
                            <p className="text-gray-500">{item.customerId?.email || ""}</p>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700">
                            <p className="font-medium text-gray-900">{item.petName}</p>
                            <p className="text-gray-500">{item.petType}</p>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700">{item.serviceType}</td>
                          <td className="px-4 py-3 text-sm text-gray-700">
                            <p>{new Date(item.appointmentDate).toLocaleDateString("en-US")}</p>
                            <p className="text-gray-500">{item.startTime}</p>
                          </td>
                          <td className="px-4 py-3 text-sm text-right">
                            <div className="flex flex-col sm:flex-row items-center justify-end gap-1.5">
                              <button
                                onClick={() => setSelectedAppointment(item)}
                                className="w-full sm:w-auto px-3 py-1.5 rounded-lg bg-sky-100 text-sky-700 hover:bg-sky-200 text-xs font-medium"
                              >
                                View Details
                              </button>
                              <div className="flex items-center gap-1.5 w-full sm:w-auto">
                                {item.status === "pending" ? (
                                  <>
                                    <button
                                      onClick={() => handleApprove(item._id)}
                                      disabled={processingId === item._id}
                                      className="flex-1 sm:flex-none px-2.5 py-1.5 rounded-lg bg-emerald-100 text-emerald-700 hover:bg-emerald-200 disabled:opacity-50 text-xs font-medium"
                                    >
                                      Confirm
                                    </button>
                                    <button
                                      onClick={() => openRejectPopup(item._id)}
                                      disabled={processingId === item._id}
                                      className="flex-1 sm:flex-none px-2.5 py-1.5 rounded-lg bg-rose-100 text-rose-700 hover:bg-rose-200 disabled:opacity-50 text-xs font-medium"
                                    >
                                      Reject
                                    </button>
                                  </>
                                ) : null}
                                {getNextStatus(item.status) && getNextStatus(item.status) !== "confirmed" ? (
                                  <button
                                    onClick={() => handleAdvanceStatus(item)}
                                    disabled={processingId === item._id}
                                    className="flex-1 sm:flex-none px-2.5 py-1.5 rounded-lg bg-indigo-100 text-indigo-700 hover:bg-indigo-200 disabled:opacity-50 text-xs font-medium"
                                  >
                                    {statusActions[getNextStatus(item.status)]?.label || "Update"}
                                  </button>
                                ) : null}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700">{renderStatusBadge(item.status)}</td>
                        </tr>
                      );
                    }

                    const firstItem = group.items[0];
                    const groupSize = group.total || group.items.length;
                    const isExpanded = Boolean(expandedGroups[group.key]);
                    const serviceSummary = Array.from(
                      new Set(group.items.map((item) => item.serviceType).filter(Boolean)),
                    ).join(", ");

                    return (
                      <Fragment key={group.key}>
                        <tr className="border-b border-amber-100 bg-amber-50/70">
                          <td className="px-4 py-3 text-sm text-gray-700">
                            <p className="font-medium text-gray-900">
                              {firstItem?.customerId?.profile?.fullName || firstItem?.customerId?.email || "Customer"}
                            </p>
                            <p className="text-gray-500">{firstItem?.customerId?.email || ""}</p>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700">
                            <p className="font-medium text-amber-800">Group of {groupSize} pets</p>
                            <p className="text-gray-500 truncate max-w-56">
                              {group.items.map((item) => item.petName).filter(Boolean).join(", ")}
                            </p>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700">
                            <p className="truncate max-w-56">{serviceSummary || "-"}</p>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700">
                            <p>{new Date(firstItem?.appointmentDate).toLocaleDateString("en-US")}</p>
                            <p className="text-gray-500">
                              {firstItem?.startTime}
                              {group.items.length > 1
                                ? ` (${group.items.length} consecutive slots)`
                                : ""}
                            </p>
                          </td>
                          <td className="px-4 py-3 text-sm text-right">
                            <div className="flex flex-wrap items-center justify-end gap-1.5">
                              <button
                                onClick={() => toggleGroupDetails(group.key)}
                                className="px-2.5 py-1.5 rounded-lg bg-sky-100 text-sky-700 hover:bg-sky-200 text-xs font-medium"
                              >
                                {isExpanded ? "Hide Details" : "View Details"}
                              </button>
                              {group.pendingItems.length > 0 ? (
                                <button
                                  onClick={() => handleApproveGroup(group)}
                                  disabled={processingId === group.key}
                                  className="px-2.5 py-1.5 rounded-lg bg-emerald-100 text-emerald-700 hover:bg-emerald-200 disabled:opacity-50 text-xs font-medium"
                                >
                                  Confirm
                                </button>
                              ) : null}
                              {group.pendingItems.length > 0 ? (
                                <button
                                  onClick={() => openRejectPopup(group.pendingItems.map((item) => item._id))}
                                  disabled={processingId === group.key}
                                  className="px-2.5 py-1.5 rounded-lg bg-rose-100 text-rose-700 hover:bg-rose-200 disabled:opacity-50 text-xs font-medium"
                                >
                                  Reject
                                </button>
                              ) : null}
                              {group.nextStatus && group.nextStatus !== "confirmed" ? (
                                <button
                                  onClick={() => handleAdvanceGroup(group)}
                                  disabled={processingId === group.key}
                                  className="px-2.5 py-1.5 rounded-lg bg-indigo-100 text-indigo-700 hover:bg-indigo-200 disabled:opacity-50 text-xs font-medium"
                                >
                                  {statusActions[group.nextStatus]?.label || "Update Group"}
                                </button>
                              ) : null}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700">{renderStatusBadge(group.groupStatus)}</td>
                        </tr>

                        {isExpanded ? (
                          <tr className="border-b border-amber-100 bg-amber-50/20">
                            <td colSpan={6} className="px-4 py-3">
                              <div className="space-y-2">
                                {group.items.map((item) => (
                                  <div
                                    key={item._id}
                                    className="rounded-lg border border-amber-100 bg-white px-3 py-2 flex flex-col md:flex-row md:items-center md:justify-between gap-2"
                                  >
                                    <div className="text-sm text-gray-700">
                                      <p className="font-medium text-gray-900">{item.petName} - {item.petType}</p>
                                      <p>
                                        {item.serviceType} | {new Date(item.appointmentDate).toLocaleDateString("en-US")} | {item.startTime}
                                      </p>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                      {renderStatusBadge(item.status)}
                                      <button
                                        onClick={() => setSelectedAppointment(item)}
                                        className="px-2.5 py-1.5 rounded-lg bg-sky-100 text-sky-700 hover:bg-sky-200 text-xs font-medium"
                                      >
                                        View
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </td>
                          </tr>
                        ) : null}
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {selectedAppointment ? (
          <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl">
              <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Appointment Details</h3>
                <button
                  onClick={() => setSelectedAppointment(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  Close
                </button>
              </div>

              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Customer</p>
                  <p className="font-medium text-gray-900">
                    {selectedAppointment.customerId?.profile?.fullName ||
                      selectedAppointment.customerId?.email ||
                      "Customer"}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Email</p>
                  <p className="font-medium text-gray-900">
                    {selectedAppointment.customerId?.email || "-"}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Pet</p>
                  <p className="font-medium text-gray-900">{selectedAppointment.petName}</p>
                </div>
                <div>
                  <p className="text-gray-500">Pet Type</p>
                  <p className="font-medium text-gray-900">{selectedAppointment.petType}</p>
                </div>
                <div>
                  <p className="text-gray-500">Service</p>
                  <p className="font-medium text-gray-900">{selectedAppointment.serviceType}</p>
                </div>
                <div>
                  <p className="text-gray-500">Status</p>
                  <div className="mt-1">{renderStatusBadge(selectedAppointment.status)}</div>
                </div>
                <div>
                  <p className="text-gray-500">Appointment Date</p>
                  <p className="font-medium text-gray-900">
                    {new Date(selectedAppointment.appointmentDate).toLocaleDateString("en-US")}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Time Slot</p>
                  <p className="font-medium text-gray-900">{selectedAppointment.startTime}</p>
                </div>
                <div className="md:col-span-2">
                  <p className="text-gray-500">Note</p>
                  <p className="font-medium text-gray-900 whitespace-pre-wrap">
                    {selectedAppointment.note || "No notes"}
                  </p>
                </div>
                {selectedAppointment.rejectionReason ? (
                  <div className="md:col-span-2">
                    <p className="text-gray-500">Rejection Reason</p>
                    <p className="font-medium text-rose-700 whitespace-pre-wrap">
                      {selectedAppointment.rejectionReason}
                    </p>
                  </div>
                ) : null}
                {selectedAppointment.cancellationReason ? (
                  <div className="md:col-span-2">
                    <p className="text-gray-500">Cancellation Reason</p>
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
                      Confirm
                    </button>
                    <button
                      onClick={() => openRejectPopup(selectedAppointment._id)}
                      disabled={processingId === selectedAppointment._id}
                      className="px-4 py-2 rounded-lg bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-50"
                    >
                      Reject
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
                    {statusActions[getNextStatus(selectedAppointment.status)]?.label || "Update"}
                  </button>
                ) : null}
                <button
                  onClick={() => setSelectedAppointment(null)}
                  className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {rejectPopup.open ? (
          <div className="fixed inset-0 bg-black/40 z-60 flex items-center justify-center p-4">
            <div className="w-full max-w-md rounded-xl bg-white shadow-xl">
              <div className="border-b border-gray-200 px-5 py-4">
                <h3 className="text-lg font-semibold text-gray-900">Reject Appointment</h3>
              </div>
              <div className="px-5 py-4 space-y-2">
                <p className="text-sm text-gray-600">Please enter a rejection reason to send to the customer.</p>
                <textarea
                  rows={4}
                  value={rejectPopup.reason}
                  onChange={(e) =>
                    setRejectPopup((prev) => ({ ...prev, reason: e.target.value }))
                  }
                  placeholder="Enter rejection reason..."
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-800 focus:border-rose-400 focus:outline-none"
                />
              </div>
              <div className="flex justify-end gap-2 border-t border-gray-200 px-5 py-4">
                <button
                  onClick={closeRejectPopup}
                  className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={submitReject}
                  disabled={processingId.startsWith("reject-")}
                  className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium text-white hover:bg-rose-700 disabled:opacity-50"
                >
                  {processingId.startsWith("reject-") ? "Submitting..." : "Confirm Rejection"}
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {errorPopup ? (
          <div className="fixed inset-0 bg-black/40 z-60 flex items-center justify-center p-4">
            <div className="w-full max-w-md rounded-xl bg-white shadow-xl">
              <div className="border-b border-gray-200 px-5 py-4">
                <h3 className="text-lg font-semibold text-gray-900">Error</h3>
              </div>
              <div className="px-5 py-4">
                <p className="text-sm text-gray-700">{errorPopup}</p>
              </div>
              <div className="flex justify-end border-t border-gray-200 px-5 py-4">
                <button
                  onClick={() => setErrorPopup("")}
                  className="rounded-lg bg-[#846551] px-4 py-2 text-sm font-medium text-white hover:bg-[#6d5041]"
                >
                  Got it
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </AdminLayout>
  );
}

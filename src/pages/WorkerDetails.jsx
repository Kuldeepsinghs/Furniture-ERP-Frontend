import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Download, Trash2 } from "lucide-react";
import api from "../api/axios";
import ConfirmDeleteModal from "../components/ConfirmDeleteModal";
import DashboardCard from "../components/DashboardCard";
import DataTable from "../components/DataTable";
import LoadingSpinner from "../components/LoadingSpinner";
import MainLayout from "../layouts/MainLayout";
import { useNotification } from "../hooks/useNotification";
import { getErrorMessage } from "../utils/errors";
import { exportToCsv } from "../utils/exportCsv";
import { getUserRole } from "../utils/auth";
import {
  asArray,
  formatCurrency,
  formatDate,
  formatTime,
  getName,
  getPaymentDateTime,
  getWorkEntryDateTime,
  sortByDateTimeDesc,
} from "../utils/format";

function WorkerDetails() {
  const { id } = useParams();
  const notification = useNotification();
  const isAdmin = getUserRole() === "ADMIN";
  const [worker, setWorker] = useState(null);
  const [ledger, setLedger] = useState(null);
  const [statement, setStatement] = useState(null);
  const [workEntries, setWorkEntries] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showClearModal, setShowClearModal] = useState(false);
  const [clearing, setClearing] = useState(false);

  useEffect(() => {
    const loadWorker = async () => {
      try {
        const [workersRes, ledgerRes, statementRes, entriesRes, paymentsRes] =
          await Promise.allSettled([
            api.get("/workers"),
            api.get(`/workers/${id}/ledger`),
            api.get(`/workers/${id}/statement`),
            api.get("/work-entries"),
            api.get(`/payments/worker/${id}`),
          ]);

        if (workersRes.status === "fulfilled") {
          setWorker(asArray(workersRes.value.data).find((item) => String(item.id) === String(id)));
        }
        if (ledgerRes.status === "fulfilled") setLedger(ledgerRes.value.data);
        if (statementRes.status === "fulfilled") setStatement(statementRes.value.data);
        if (entriesRes.status === "fulfilled") {
          setWorkEntries(
            sortByDateTimeDesc(
              asArray(entriesRes.value.data).filter(
                (entry) => String(entry.worker?.id ?? entry.workerId) === String(id)
              ),
              (entry) => getWorkEntryDateTime(entry),
            )
          );
        }
        if (paymentsRes.status === "fulfilled") {
          setPayments(
            sortByDateTimeDesc(asArray(paymentsRes.value.data), (payment) =>
              getPaymentDateTime(payment),
            ),
          );
        }
      } finally {
        setLoading(false);
      }
    };

    loadWorker();
  }, [id]);

  const summary = useMemo(() => {
    const totalEarned =
      statement?.totalEarned ??
      statement?.totalWorkAmount ??
      ledger?.totalEarned ??
      ledger?.totalWorkAmount ??
      workEntries.reduce((sum, entry) => sum + Number(entry.amount ?? 0), 0);
    const totalPaid =
      statement?.totalPaid ??
      statement?.paidAmount ??
      ledger?.totalPaid ??
      ledger?.paidAmount ??
      payments.reduce((sum, payment) => sum + Number(payment.amount ?? 0), 0);

    return {
      totalEarned,
      totalPaid,
      balance: statement?.balance ?? ledger?.balance ?? Number(totalEarned) - Number(totalPaid),
    };
  }, [ledger, payments, statement, workEntries]);

  const active = worker?.active ?? worker?.status !== "INACTIVE";

  const exportWorkEntries = () => {
    if (!workEntries.length) {
      notification.warning("No Work Entries to Export");
      return;
    }

    exportToCsv(
      `${worker?.name ?? "worker"}-work-entries-${new Date().toISOString().slice(0, 10)}.csv`,
      [
        { key: "design", header: "Design", value: (entry) => getName(entry.design ?? entry.designName) },
        { key: "rateType", header: "Rate Type", value: (entry) => getName(entry.rateType ?? entry.rateTypeName) },
        { key: "quantity", header: "Quantity", value: (entry) => entry.quantity ?? 0 },
        { key: "amount", header: "Amount", value: (entry) => entry.amount ?? 0 },
        { key: "date", header: "Date", value: (entry) => formatDate(getWorkEntryDateTime(entry)) },
        { key: "time", header: "Time", value: (entry) => formatTime(getWorkEntryDateTime(entry)) },
      ],
      workEntries,
    );
  };

  const exportPayments = () => {
    if (!payments.length) {
      notification.warning("No Payments to Export");
      return;
    }

    exportToCsv(
      `${worker?.name ?? "worker"}-payments-${new Date().toISOString().slice(0, 10)}.csv`,
      [
        { key: "date", header: "Date", value: (payment) => formatDate(getPaymentDateTime(payment)) },
        { key: "time", header: "Time", value: (payment) => formatTime(getPaymentDateTime(payment)) },
        { key: "amount", header: "Amount", value: (payment) => payment.amount ?? 0 },
        { key: "remarks", header: "Remarks", value: (payment) => payment.remarks || "" },
      ],
      payments,
    );
  };

  const confirmClearData = async () => {
    setClearing(true);
    try {
      await api.delete(`/workers/${id}/clear-data`);
      setWorkEntries([]);
      setPayments([]);
      setLedger(null);
      setStatement(null);
      setShowClearModal(false);
      notification.success(`Cleared All Work Entries & Payments for ${worker?.name ?? "Worker"}`);
    } catch (error) {
      notification.error(getErrorMessage(error, "Unable to Clear Worker Data"));
    } finally {
      setClearing(false);
    }
  };

  const workColumns = [
    { key: "design", header: "Design", render: (entry) => getName(entry.design ?? entry.designName) },
    { key: "rateType", header: "Rate Type", render: (entry) => getName(entry.rateType ?? entry.rateTypeName) },
    { key: "quantity", header: "Quantity" },
    { key: "amount", header: "Amount", render: (entry) => formatCurrency(entry.amount) },
    { key: "date", header: "Date", render: (entry) => formatDate(getWorkEntryDateTime(entry)) },
    { key: "time", header: "Time", render: (entry) => formatTime(getWorkEntryDateTime(entry)) },
  ];

  const paymentColumns = [
    { key: "date", header: "Date", render: (payment) => formatDate(getPaymentDateTime(payment)) },
    { key: "time", header: "Time", render: (payment) => formatTime(getPaymentDateTime(payment)) },
    { key: "amount", header: "Amount", render: (payment) => formatCurrency(payment.amount) },
    { key: "remarks", header: "Remarks", render: (payment) => payment.remarks || "-" },
  ];

  const productionByDesign = Object.values(
    workEntries.reduce((groups, entry) => {
      const design = getName(entry.design ?? entry.designName, "Unknown Design");
      groups[design] = groups[design] ?? { id: design, design, quantity: 0, amount: 0 };
      groups[design].quantity += Number(entry.quantity ?? 0);
      groups[design].amount += Number(entry.amount ?? 0);
      return groups;
    }, {})
  );

  return (
    <MainLayout>
      <div className="page-stack">
        <Link to="/workers" className="text-sm font-semibold text-blue-700 hover:text-blue-800">
          Back to workers
        </Link>

        {loading ? (
          <LoadingSpinner label="Loading worker profile" />
        ) : (
          <>
            <section className="section-card">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">
                    Worker Profile
                  </p>
                  <h3 className="mt-2 text-3xl font-bold text-slate-950">{worker?.name ?? "Worker"}</h3>
                  <div className="mt-4 grid gap-3 text-sm text-slate-600 sm:grid-cols-2 lg:grid-cols-4">
                    <p><span className="font-semibold text-slate-800">Phone:</span> {worker?.phone || "-"}</p>
                    <p><span className="font-semibold text-slate-800">Role:</span> {worker?.role || "-"}</p>
                    <p><span className="font-semibold text-slate-800">Joining:</span> {formatDate(worker?.joiningDate)}</p>
                    <p>
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${active ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
                        {active ? "Active" : "Inactive"}
                      </span>
                    </p>
                  </div>
                </div>
                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => setShowClearModal(true)}
                    className="inline-flex items-center gap-2 whitespace-nowrap rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-100"
                  >
                    <Trash2 size={16} />
                    Clear Work &amp; Payment Data
                  </button>
                )}
              </div>
            </section>

            <section className="grid gap-5 md:grid-cols-3">
              <DashboardCard title="Total Earned" value={formatCurrency(summary.totalEarned)} tone="blue" />
              <DashboardCard title="Total Paid" value={formatCurrency(summary.totalPaid)} tone="green" />
              <DashboardCard title="Balance" value={formatCurrency(summary.balance)} tone="amber" />
            </section>

            <section className="grid gap-6 xl:grid-cols-2">
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-lg font-bold text-slate-950">Work Entries History</h3>
                  <button
                    type="button"
                    onClick={exportWorkEntries}
                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-700 hover:text-blue-800"
                  >
                    <Download size={14} />
                    Export CSV
                  </button>
                </div>
                <DataTable columns={workColumns} data={workEntries} compact emptyMessage="No work entries for this worker." />
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-lg font-bold text-slate-950">Payment History</h3>
                  <button
                    type="button"
                    onClick={exportPayments}
                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-700 hover:text-blue-800"
                  >
                    <Download size={14} />
                    Export CSV
                  </button>
                </div>
                <DataTable columns={paymentColumns} data={payments} compact emptyMessage="No payments for this worker." />
              </div>
            </section>

            <section className="space-y-4">
              <h3 className="text-lg font-bold text-slate-950">Production Summary</h3>
              <DataTable
                compact
                columns={[
                  { key: "design", header: "Design" },
                  { key: "quantity", header: "Total Quantity" },
                  { key: "amount", header: "Total Amount", render: (row) => formatCurrency(row.amount) },
                ]}
                data={productionByDesign}
                emptyMessage="No production summary available."
              />
            </section>
          </>
        )}
      </div>

      {showClearModal && (
        <ConfirmDeleteModal
          title="Clear Work & Payment Data"
          description={`This will permanently delete ALL ${workEntries.length} work ${
            workEntries.length === 1 ? "entry" : "entries"
          } and ${payments.length} payment${
            payments.length === 1 ? "" : "s"
          } for ${worker?.name ?? "this worker"}. Their profile will stay, but this history cannot be recovered.`}
          busy={clearing}
          onConfirm={confirmClearData}
          onClose={() => setShowClearModal(false)}
        />
      )}
    </MainLayout>
  );
}

export default WorkerDetails;
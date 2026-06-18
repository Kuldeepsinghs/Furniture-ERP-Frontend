import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api from "../api/axios";
import DashboardCard from "../components/DashboardCard";
import DataTable from "../components/DataTable";
import LoadingSpinner from "../components/LoadingSpinner";
import MainLayout from "../layouts/MainLayout";
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
  const [worker, setWorker] = useState(null);
  const [ledger, setLedger] = useState(null);
  const [statement, setStatement] = useState(null);
  const [workEntries, setWorkEntries] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

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
              </div>
            </section>

            <section className="grid gap-5 md:grid-cols-3">
              <DashboardCard title="Total Earned" value={formatCurrency(summary.totalEarned)} tone="blue" />
              <DashboardCard title="Total Paid" value={formatCurrency(summary.totalPaid)} tone="green" />
              <DashboardCard title="Balance" value={formatCurrency(summary.balance)} tone="amber" />
            </section>

            <section className="grid gap-6 xl:grid-cols-2">
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-slate-950">Work Entries History</h3>
                <DataTable columns={workColumns} data={workEntries} compact emptyMessage="No work entries for this worker." />
              </div>
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-slate-950">Payment History</h3>
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
    </MainLayout>
  );
}

export default WorkerDetails;

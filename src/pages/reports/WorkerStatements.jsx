import { useEffect, useState } from "react";
import api from "../../api/axios";
import DashboardCard from "../../components/DashboardCard";
import DataTable from "../../components/DataTable";
import LoadingSpinner from "../../components/LoadingSpinner";
import MainLayout from "../../layouts/MainLayout";
import {
  asArray,
  formatCurrency,
  formatDate,
  formatTime,
  getName,
  getPaymentDateTime,
  getWorkEntryDateTime,
  sortByDateTimeDesc,
} from "../../utils/format";

function WorkerStatements() {
  const [workers, setWorkers] = useState([]);
  const [selectedWorkerId, setSelectedWorkerId] = useState("");
  const [statement, setStatement] = useState(null);
  const [workEntries, setWorkEntries] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statementLoading, setStatementLoading] = useState(false);

  useEffect(() => {
    const loadWorkers = async () => {
      try {
        const response = await api.get("/workers");
        const workerList = asArray(response.data);
        setWorkers(workerList);
        if (workerList[0]?.id) setSelectedWorkerId(String(workerList[0].id));
      } finally {
        setLoading(false);
      }
    };

    loadWorkers();
  }, []);

  useEffect(() => {
    if (!selectedWorkerId) return;

    const loadStatement = async () => {
      setStatementLoading(true);
      try {
        const [statementRes, entriesRes, paymentsRes] = await Promise.allSettled([
          api.get(`/workers/${selectedWorkerId}/statement`),
          api.get("/work-entries"),
          api.get(`/payments/worker/${selectedWorkerId}`),
        ]);

        setStatement(
          statementRes.status === "fulfilled" ? statementRes.value.data : null,
        );

        if (entriesRes.status === "fulfilled") {
          setWorkEntries(
            sortByDateTimeDesc(
              asArray(entriesRes.value.data).filter(
                (entry) =>
                  String(entry.worker?.id ?? entry.workerId) ===
                  String(selectedWorkerId),
              ),
              (entry) => getWorkEntryDateTime(entry),
            ),
          );
        } else {
          setWorkEntries([]);
        }

        if (paymentsRes.status === "fulfilled") {
          setPayments(
            sortByDateTimeDesc(asArray(paymentsRes.value.data), (payment) =>
              getPaymentDateTime(payment),
            ),
          );
        } else {
          setPayments([]);
        }
      } finally {
        setStatementLoading(false);
      }
    };

    loadStatement();
  }, [selectedWorkerId]);

  const statementRows = asArray(
    statement?.entries ??
      statement?.workEntries ??
      statement?.transactions ??
      statement?.ledgerEntries,
  );

  const detailRows = statementRows.length
    ? statementRows
    : [
        ...workEntries.map((entry) => ({
          id: `work-${entry.id}`,
          date: getWorkEntryDateTime(entry),
          type: "Work",
          description: `${getName(entry.design ?? entry.designName)} - ${getName(entry.rateType ?? entry.rateTypeName)}`,
          amount: entry.amount,
        })),
        ...payments.map((payment) => ({
          id: `payment-${payment.id}`,
          date: getPaymentDateTime(payment),
          type: "Payment",
          description: payment.remarks || "Worker payment",
          amount: payment.amount,
        })),
      ];

  const sortedDetailRows = sortByDateTimeDesc(detailRows, (row) => row.date);
  const totalEarned =
    statement?.totalEarned ??
    statement?.totalWorkAmount ??
    statement?.earnedAmount ??
    workEntries.reduce((sum, entry) => sum + Number(entry.amount ?? 0), 0);
  const totalPaid =
    statement?.totalPaid ??
    statement?.paidAmount ??
    statement?.totalPayments ??
    payments.reduce((sum, payment) => sum + Number(payment.amount ?? 0), 0);
  const balance =
    statement?.balance ??
    statement?.pendingAmount ??
    Number(totalEarned ?? 0) - Number(totalPaid ?? 0);

  return (
    <MainLayout>
      <div className="page-stack">
        <section className="section-card">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h3 className="page-heading">Worker Statements</h3>
              <p className="muted-text mt-1">Detailed earning, payment, and balance view for one worker.</p>
            </div>
            <label className="w-full sm:max-w-xs">
              <span className="field-label">Worker</span>
              <select className="field-input" value={selectedWorkerId} onChange={(event) => setSelectedWorkerId(event.target.value)}>
                {workers.map((worker) => (
                  <option key={worker.id} value={worker.id}>{worker.name}</option>
                ))}
              </select>
            </label>
          </div>
        </section>

        {loading || statementLoading ? (
          <LoadingSpinner label="Loading worker statement" />
        ) : (
          <>
            <section className="grid gap-5 md:grid-cols-3">
              <DashboardCard title="Total Earned" value={formatCurrency(totalEarned)} tone="blue" />
              <DashboardCard title="Total Paid" value={formatCurrency(totalPaid)} tone="green" />
              <DashboardCard title="Balance" value={formatCurrency(balance)} tone="amber" />
            </section>
            {sortedDetailRows.length > 0 && (
              <DataTable
                columns={[
                  { key: "date", header: "Date", render: (row) => formatDate(row.date ?? getWorkEntryDateTime(row) ?? getPaymentDateTime(row)) },
                  { key: "time", header: "Time", render: (row) => formatTime(row.date ?? getWorkEntryDateTime(row) ?? getPaymentDateTime(row)) },
                  { key: "type", header: "Type", render: (row) => row.type ?? row.entryType ?? "Entry" },
                  { key: "description", header: "Description", render: (row) => row.description ?? getName(row.design ?? row.rateType ?? row) },
                  { key: "amount", header: "Amount", render: (row) => formatCurrency(row.amount) },
                ]}
                data={sortedDetailRows}
              />
            )}
          </>
        )}
      </div>
    </MainLayout>
  );
}

export default WorkerStatements;

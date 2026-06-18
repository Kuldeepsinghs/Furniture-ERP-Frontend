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
  sortByDateTimeDesc,
} from "../../utils/format";

function PaymentSummary() {
  const [summary, setSummary] = useState(null);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSummary = async () => {
      try {
        const [summaryRes, paymentsRes] = await Promise.all([
          api.get("/payments/summary"),
          api.get("/payments"),
        ]);
        setSummary(summaryRes.data);
        setPayments(
          sortByDateTimeDesc(asArray(paymentsRes.data), (payment) =>
            getPaymentDateTime(payment),
          ),
        );
      } finally {
        setLoading(false);
      }
    };

    loadSummary();
  }, []);

  const totalPaid =
    summary?.totalPaid ??
    summary?.totalPayments ??
    payments.reduce((sum, payment) => sum + Number(payment.amount ?? 0), 0);

  return (
    <MainLayout>
      <div className="page-stack">
        <section className="section-card">
          <h3 className="page-heading">Payment Summary</h3>
          <p className="muted-text mt-1">Worker payment totals and recent payout history.</p>
        </section>
        {loading ? (
          <LoadingSpinner label="Loading payment summary" />
        ) : (
          <>
            <section className="grid gap-5 md:grid-cols-3">
              <DashboardCard title="Total Paid" value={formatCurrency(totalPaid)} tone="green" />
              <DashboardCard title="Payment Count" value={summary?.paymentCount ?? payments.length} tone="blue" />
              <DashboardCard title="Average Payment" value={formatCurrency(payments.length ? totalPaid / payments.length : 0)} tone="slate" />
            </section>
            <DataTable
              columns={[
                { key: "date", header: "Date", render: (row) => formatDate(getPaymentDateTime(row)) },
                { key: "time", header: "Time", render: (row) => formatTime(getPaymentDateTime(row)) },
                { key: "worker", header: "Worker", render: (row) => getName(row.worker ?? row.workerName) },
                { key: "amount", header: "Amount", render: (row) => formatCurrency(row.amount) },
                { key: "remarks", header: "Remarks", render: (row) => row.remarks || "-" },
              ]}
              data={payments}
              emptyMessage="No payment records found."
            />
          </>
        )}
      </div>
    </MainLayout>
  );
}

export default PaymentSummary;

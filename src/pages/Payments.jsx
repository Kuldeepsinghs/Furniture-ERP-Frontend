import { useEffect, useState } from "react";
import api from "../api/axios";
import DataTable from "../components/DataTable";
import LoadingSpinner from "../components/LoadingSpinner";
import MainLayout from "../layouts/MainLayout";
import { useNotification } from "../hooks/useNotification";
import { getErrorMessage } from "../utils/errors";
import {
  formatCurrency,
  formatDate,
  formatTime,
  getName,
  getPaymentDateTime,
  sortByDateTimeDesc,
} from "../utils/format";

const Payments = () => {
  const notification = useNotification();
  const [workers, setWorkers] = useState([]);
  const [payments, setPayments] = useState([]);
  const [form, setForm] = useState({
    workerId: "",
    amount: "",
    paymentType: "CASH",
    remarks: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadData = async () => {
    try {
      const [workersRes, paymentsRes] = await Promise.all([
        api.get("/workers"),
        api.get("/payments"),
      ]);
      setWorkers(workersRes.data);
      setPayments(
        sortByDateTimeDesc(paymentsRes.data, (payment) =>
          getPaymentDateTime(payment),
        ),
      );
    } catch (error) {
      notification.error(getErrorMessage(error, "Unable to load payments."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const savePayment = async (event) => {
    event.preventDefault();

    if (!form.workerId) {
      notification.warning("Please select a worker.");
      return;
    }

    if (Number(form.amount) <= 0) {
      notification.warning("Amount must be greater than zero.");
      return;
    }

    setSaving(true);

    try {
      await api.post("/payments", {
        workerId: Number(form.workerId),
        amount: Number(form.amount),
        paymentType: form.paymentType,
        remarks: form.remarks,
      });
      setForm({ workerId: "", amount: "", paymentType: "CASH", remarks: "" });
      await loadData();
      notification.success("Payment saved successfully.");
    } catch (error) {
      notification.error(getErrorMessage(error, "Failed to save payment."));
    } finally {
      setSaving(false);
    }
  };

  const columns = [
    { key: "date", header: "Date", render: (payment) => formatDate(getPaymentDateTime(payment)) },
    { key: "time", header: "Time", render: (payment) => formatTime(getPaymentDateTime(payment)) },
    { key: "worker", header: "Worker", render: (payment) => getName(payment.worker ?? payment.workerName) },
    { key: "amount", header: "Amount", render: (payment) => formatCurrency(payment.amount) },
    { key: "remarks", header: "Remarks", render: (payment) => payment.remarks || "-" },
  ];

  return (
    <MainLayout>
      <div className="page-stack">
        <section className="section-card">
          <h3 className="text-lg font-bold text-slate-950">New Payment</h3>
          <p className="mt-1 text-sm text-slate-500">Record cash or adjustment payments against a worker ledger.</p>

          <form onSubmit={savePayment} className="mt-5 grid gap-4 lg:grid-cols-4">
            <label>
              <span className="field-label">Worker</span>
              <select
                className="field-input"
                value={form.workerId}
                onChange={(e) => setForm({ ...form, workerId: e.target.value })}
                required
              >
                <option value="">Select worker</option>
                {workers.map((worker) => (
                  <option key={worker.id} value={worker.id}>{worker.name}</option>
                ))}
              </select>
            </label>
            <label>
              <span className="field-label">Amount</span>
              <input
                type="number"
                min="0"
                step="0.01"
                className="field-input"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                placeholder="0"
                required
              />
            </label>
            <label>
              <span className="field-label">Payment Type</span>
              <select
                className="field-input"
                value={form.paymentType}
                onChange={(e) => setForm({ ...form, paymentType: e.target.value })}
              >
                <option value="CASH">Cash</option>
                <option value="ADVANCE">Advance</option>
                <option value="ADJUSTMENT">Adjustment</option>
              </select>
            </label>
            <label>
              <span className="field-label">Remarks</span>
              <input
                className="field-input"
                value={form.remarks}
                onChange={(e) => setForm({ ...form, remarks: e.target.value })}
                placeholder="Payment note"
              />
            </label>
            <div className="lg:col-span-4">
              <button type="submit" disabled={saving} className="primary-button">
                {saving ? "Saving..." : "Save Payment"}
              </button>
            </div>
          </form>
        </section>

        <section className="space-y-4">
          <div>
            <h3 className="text-lg font-bold text-slate-950">Payment History</h3>
            <p className="text-sm text-slate-500">Track worker payments with clean ledger-ready rows.</p>
          </div>
          {loading ? (
            <LoadingSpinner label="Loading payments" />
          ) : (
            <DataTable columns={columns} data={payments} emptyMessage="No payments recorded yet." />
          )}
        </section>
      </div>
    </MainLayout>
  );
};

export default Payments;

import { useEffect, useState } from "react";
import api from "../../api/axios";
import DataTable from "../../components/DataTable";
import LoadingSpinner from "../../components/LoadingSpinner";
import MainLayout from "../../layouts/MainLayout";
import { asArray, formatCurrency, getName } from "../../utils/format";

function WorkerSummary() {
  const [rows, setRows] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadRows = async () => {
      try {
        const response = await api.get("/workers/ledger-summary");
        setRows(asArray(response.data));
      } finally {
        setLoading(false);
      }
    };

    loadRows();
  }, []);

  const filteredRows = rows.filter((row) =>
    JSON.stringify(row).toLowerCase().includes(search.toLowerCase())
  );

  return (
    <MainLayout>
      <div className="page-stack">
        <section className="section-card">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="page-heading">Worker Summary</h3>
              <p className="muted-text mt-1">Ledger balances across all workers.</p>
            </div>
            <input className="field-input mt-0 sm:max-w-xs" placeholder="Search summary" value={search} onChange={(event) => setSearch(event.target.value)} />
          </div>
        </section>
        {loading ? (
          <LoadingSpinner label="Loading worker summary" />
        ) : (
          <DataTable
            columns={[
              { key: "worker", header: "Worker", render: (row) => getName(row.worker ?? row.workerName ?? row.name) },
              { key: "earned", header: "Earned", render: (row) => formatCurrency(row.totalEarned ?? row.totalWorkAmount ?? row.earnedAmount) },
              { key: "paid", header: "Paid", render: (row) => formatCurrency(row.totalPaid ?? row.paidAmount) },
              { key: "balance", header: "Balance", render: (row) => formatCurrency(row.balance ?? row.pendingAmount) },
            ]}
            data={filteredRows}
            emptyMessage="No worker summary available."
          />
        )}
      </div>
    </MainLayout>
  );
}

export default WorkerSummary;

import { useEffect, useMemo, useState } from "react";
import api from "../../api/axios";
import DataTable from "../../components/DataTable";
import LoadingSpinner from "../../components/LoadingSpinner";
import MainLayout from "../../layouts/MainLayout";
import {
  asArray,
  formatCurrency,
  formatDate,
  formatTime,
  getName,
  getWorkEntryDateTime,
  sortByDateTimeDesc,
} from "../../utils/format";

function ProductionReport() {
  const [entries, setEntries] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadEntries = async () => {
      try {
        const response = await api.get("/work-entries");
        setEntries(
          sortByDateTimeDesc(asArray(response.data), (entry) =>
            getWorkEntryDateTime(entry),
          ),
        );
      } finally {
        setLoading(false);
      }
    };

    loadEntries();
  }, []);

  const filteredEntries = useMemo(
    () =>
      sortByDateTimeDesc(
        entries.filter((entry) =>
          JSON.stringify(entry).toLowerCase().includes(search.toLowerCase()),
        ),
        (entry) => getWorkEntryDateTime(entry),
      ),
    [entries, search]
  );

  return (
    <MainLayout>
      <div className="page-stack">
        <section className="section-card">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="page-heading">Production Report</h3>
              <p className="muted-text mt-1">Searchable output report by worker, design, and rate type.</p>
            </div>
            <input className="field-input mt-0 sm:max-w-xs" placeholder="Search production" value={search} onChange={(event) => setSearch(event.target.value)} />
          </div>
        </section>
        {loading ? (
          <LoadingSpinner label="Loading production report" />
        ) : (
          <DataTable
            columns={[
              { key: "worker", header: "Worker", render: (row) => getName(row.worker ?? row.workerName) },
              { key: "design", header: "Design", render: (row) => getName(row.design ?? row.designName) },
              { key: "rateType", header: "Rate Type", render: (row) => getName(row.rateType ?? row.rateTypeName) },
              { key: "quantity", header: "Quantity" },
              { key: "amount", header: "Amount", render: (row) => formatCurrency(row.amount) },
              { key: "date", header: "Date", render: (row) => formatDate(getWorkEntryDateTime(row)) },
              { key: "time", header: "Time", render: (row) => formatTime(getWorkEntryDateTime(row)) },
            ]}
            data={filteredEntries}
            emptyMessage="No production entries found."
          />
        )}
      </div>
    </MainLayout>
  );
}

export default ProductionReport;

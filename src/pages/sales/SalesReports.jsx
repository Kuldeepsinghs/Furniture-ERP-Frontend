import { useEffect, useState } from "react";
import api from "../../api/axios";
import DashboardCard from "../../components/DashboardCard";
import LoadingSpinner from "../../components/LoadingSpinner";
import MainLayout from "../../layouts/MainLayout";
import { useNotification } from "../../hooks/useNotification";
import { getErrorMessage } from "../../utils/errors";
import { formatCurrency } from "../../utils/format";

const filters = [
  { key: "today", label: "Today", endpoint: "/sales/reports/today" },
  { key: "weekly", label: "Week", endpoint: "/sales/reports/weekly" },
  { key: "monthly", label: "Month", endpoint: "/sales/reports/monthly" },
  { key: "yearly", label: "Year", endpoint: "/sales/reports/yearly" },
  { key: "custom", label: "Custom", endpoint: "/sales/reports/custom" },
];

function SalesReports() {
  const notification = useNotification();
  const [filter, setFilter] = useState("today");
  const [custom, setCustom] = useState({ startDate: "", endDate: "" });
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadReport = async () => {
      const active = filters.find((item) => item.key === filter);
      if (!active) return;
      if (filter === "custom" && (!custom.startDate || !custom.endDate)) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const response = await api.get(active.endpoint, {
          params:
            filter === "custom"
              ? { startDate: custom.startDate, endDate: custom.endDate }
              : undefined,
        });
        setReport(response.data);
      } catch (error) {
        notification.error(getErrorMessage(error, "Unable to Load Sales Report"));
      } finally {
        setLoading(false);
      }
    };

    loadReport();
  }, [custom.endDate, custom.startDate, filter, notification]);

  return (
    <MainLayout>
      <div className="page-stack">
        <section className="section-card">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h3 className="page-heading">Sales Reports</h3>
              <p className="muted-text mt-1">Review showroom revenue and sales performance by period.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {filters.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setFilter(item.key)}
                  className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${
                    filter === item.key
                      ? "bg-blue-600 text-white"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {filter === "custom" && (
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <label>
                <span className="field-label">Start Date</span>
                <input type="date" className="field-input" value={custom.startDate} onChange={(event) => setCustom({ ...custom, startDate: event.target.value })} />
              </label>
              <label>
                <span className="field-label">End Date</span>
                <input type="date" className="field-input" value={custom.endDate} onChange={(event) => setCustom({ ...custom, endDate: event.target.value })} />
              </label>
            </div>
          )}
        </section>

        {loading ? (
          <LoadingSpinner label="Loading Sales Report..." />
        ) : (
          <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-5">
            <DashboardCard title="Total Revenue" value={formatCurrency(report?.totalRevenue)} tone="green" />
            <DashboardCard title="Number of Sales" value={report?.numberOfSales ?? 0} tone="blue" />
            <DashboardCard title="Average Sale" value={formatCurrency(report?.averageSale)} tone="amber" />
            <DashboardCard title="Top Category" value={report?.topCategory ?? "N/A"} tone="slate" />
            <DashboardCard title="Top Location" value={report?.topLocation ?? "N/A"} tone="blue" />
          </section>
        )}
      </div>
    </MainLayout>
  );
}

export default SalesReports;

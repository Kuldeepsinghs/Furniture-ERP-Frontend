import { useEffect, useMemo, useState } from "react";
import api from "../../api/axios";
import DashboardCard from "../../components/DashboardCard";
import DataTable from "../../components/DataTable";
import LoadingSpinner from "../../components/LoadingSpinner";
import MainLayout from "../../layouts/MainLayout";
import { useNotification } from "../../hooks/useNotification";
import { getErrorMessage } from "../../utils/errors";
import {
  asArray,
  formatCurrency,
  formatDate,
  formatTime,
  getSaleDateTime,
  sortByDateTimeDesc,
} from "../../utils/format";

function RankingList({ title, items }) {
  return (
    <section className="section-card">
      <h3 className="text-lg font-bold text-slate-950">{title}</h3>
      <div className="mt-5 space-y-3">
        {items.length === 0 ? (
          <p className="text-sm text-slate-500">No sales data available.</p>
        ) : (
          items.map((item) => (
            <div key={item.name} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
              <span className="text-sm font-semibold text-slate-800">{item.name}</span>
              <span className="text-sm font-bold text-blue-700">{formatCurrency(item.amount)}</span>
            </div>
          ))
        )}
      </div>
    </section>
  );
}

function SalesDashboard() {
  const notification = useNotification();
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const response = await api.get("/sales/dashboard");
        setDashboard(response.data);
      } catch (error) {
        notification.error(getErrorMessage(error, "Unable to Load Sales Dashboard"));
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, [notification]);

  const recentSales = useMemo(
    () => sortByDateTimeDesc(asArray(dashboard?.recentSales), (sale) => getSaleDateTime(sale)).slice(0, 10),
    [dashboard],
  );

  return (
    <MainLayout>
      <div className="page-stack">
        {loading ? (
          <LoadingSpinner label="Loading Sales Dashboard..." />
        ) : (
          <>
            <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
              <DashboardCard title="Today's Sales" value={formatCurrency(dashboard?.todaySalesAmount)} tone="green" />
              <DashboardCard title="Week Sales" value={formatCurrency(dashboard?.weeklySalesAmount)} tone="blue" />
              <DashboardCard title="Month Sales" value={formatCurrency(dashboard?.monthlySalesAmount)} tone="amber" />
              <DashboardCard title="Year Sales" value={formatCurrency(dashboard?.yearlySalesAmount)} tone="slate" />
            </section>

            <section className="section-card">
              <h3 className="text-lg font-bold text-slate-950">Weekly Sales</h3>
              <div className="mt-5 grid gap-3 md:grid-cols-7">
                {asArray(dashboard?.weeklySalesChart).map((point) => (
                  <div key={point.date} className="rounded-lg bg-blue-50 p-3 text-center">
                    <p className="text-xs font-bold text-blue-700">{formatDate(point.date)}</p>
                    <p className="mt-2 text-sm font-bold text-slate-950">{formatCurrency(point.amount)}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="grid gap-5 xl:grid-cols-2">
              <RankingList title="Top Selling Categories" items={asArray(dashboard?.topSellingCategories)} />
              <RankingList title="Top Selling Locations" items={asArray(dashboard?.topSellingLocations)} />
            </section>

            <section className="space-y-4">
              <div>
                <h3 className="text-lg font-bold text-slate-950">Recent Sales</h3>
                <p className="text-sm text-slate-500">Latest active showroom sales.</p>
              </div>
              <DataTable
                columns={[
                  { key: "customer", header: "Customer", render: (sale) => sale.customerName || "N/A" },
                  { key: "category", header: "Category" },
                  { key: "location", header: "Location" },
                  { key: "amount", header: "Total Amount", render: (sale) => formatCurrency(sale.totalAmount) },
                  { key: "date", header: "Sale Date", render: (sale) => formatDate(getSaleDateTime(sale)) },
                  { key: "time", header: "Time", render: (sale) => formatTime(getSaleDateTime(sale)) },
                ]}
                data={recentSales}
                emptyMessage="No Sales Available"
              />
            </section>
          </>
        )}
      </div>
    </MainLayout>
  );
}

export default SalesDashboard;

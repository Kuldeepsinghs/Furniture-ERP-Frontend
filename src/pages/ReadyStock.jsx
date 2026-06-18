import { useEffect, useState } from "react";
import api from "../api/axios";
import DashboardCard from "../components/DashboardCard";
import DataTable from "../components/DataTable";
import LoadingSpinner from "../components/LoadingSpinner";
import MainLayout from "../layouts/MainLayout";
import { useNotification } from "../hooks/useNotification";
import { getErrorMessage } from "../utils/errors";
import { formatDate, formatTime, getName, getUpdatedDateTime } from "../utils/format";

const ReadyStock = () => {
  const notification = useNotification();
  const [stock, setStock] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStock = async () => {
      try {
        const response = await api.get("/ready-stock");
        setStock(response.data);
      } catch (error) {
        notification.error(getErrorMessage(error, "Unable to load ready stock."));
      } finally {
        setLoading(false);
      }
    };

    loadStock();
  }, [notification]);

  const columns = [
    { key: "designName", header: "Design", render: (item) => item.designName ?? getName(item.design) },
    { key: "availableQuantity", header: "Quantity", render: (item) => item.availableQuantity ?? item.quantity ?? 0 },
    { key: "lastUpdated", header: "Last Updated", render: (item) => formatDate(getUpdatedDateTime(item)) },
    { key: "lastUpdatedTime", header: "Time", render: (item) => formatTime(getUpdatedDateTime(item)) },
  ];

  const totalQuantity = stock.reduce(
    (sum, item) => sum + Number(item.availableQuantity ?? item.quantity ?? 0),
    0
  );

  return (
    <MainLayout>
      <div className="page-stack">
        <section className="section-card">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="page-heading">Ready Stock</h3>
              <p className="mt-1 text-sm text-slate-500">Finished goods available for showroom dispatch.</p>
            </div>
          </div>
        </section>

        {loading ? (
          <LoadingSpinner label="Loading inventory" />
        ) : (
          <>
            <section className="grid gap-5 md:grid-cols-3">
              <DashboardCard title="Designs In Stock" value={stock.length} tone="blue" />
              <DashboardCard title="Total Quantity" value={totalQuantity} tone="green" />
              <DashboardCard title="Inventory Status" value={totalQuantity > 0 ? "Available" : "Empty"} tone="slate" />
            </section>
            <DataTable columns={columns} data={stock} emptyMessage="No ready stock available." />
          </>
        )}
      </div>
    </MainLayout>
  );
};

export default ReadyStock;

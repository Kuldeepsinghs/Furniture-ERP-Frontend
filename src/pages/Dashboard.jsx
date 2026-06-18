import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ClipboardList, Truck, UserPlus, Wallet } from "lucide-react";
import api from "../api/axios";
import DashboardCard from "../components/DashboardCard";
import LoadingSpinner from "../components/LoadingSpinner";
import MainLayout from "../layouts/MainLayout";
import { useNotification } from "../hooks/useNotification";
import { getErrorMessage } from "../utils/errors";
import {
  asArray,
  formatCurrency,
  formatDate,
  formatTime,
  getName,
  getPaymentDateTime,
  getShipmentDateTime,
  getShipmentItemName,
  getShipmentItems,
  getWorkEntryDateTime,
  sortByDateTimeDesc,
} from "../utils/format";

const isToday = (value) => {
  if (!value) return false;

  const date = new Date(value);
  const today = new Date();

  return (
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
  );
};

function Dashboard() {
  const notification = useNotification();
  const [dashboard, setDashboard] = useState(null);
  const [workers, setWorkers] = useState([]);
  const [stock, setStock] = useState([]);
  const [entries, setEntries] = useState([]);
  const [payments, setPayments] = useState([]);
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const [
          dashboardRes,
          workersRes,
          stockRes,
          entriesRes,
          paymentsRes,
          shipmentsRes,
        ] = await Promise.allSettled([
          api.get("/dashboard"),
          api.get("/workers"),
          api.get("/ready-stock"),
          api.get("/work-entries"),
          api.get("/payments"),
          api.get("/shipments/history"),
        ]);

        if (dashboardRes.status === "fulfilled") setDashboard(dashboardRes.value.data);
        if (workersRes.status === "fulfilled") setWorkers(asArray(workersRes.value.data));
        if (stockRes.status === "fulfilled") setStock(asArray(stockRes.value.data));
        if (entriesRes.status === "fulfilled") setEntries(asArray(entriesRes.value.data));
        if (paymentsRes.status === "fulfilled") setPayments(asArray(paymentsRes.value.data));
        if (shipmentsRes.status === "fulfilled") setShipments(asArray(shipmentsRes.value.data));

        const failed = [
          dashboardRes,
          workersRes,
          stockRes,
          entriesRes,
          paymentsRes,
          shipmentsRes,
        ].find((result) => result.status === "rejected");

        if (failed) {
          notification.error(getErrorMessage(failed.reason, "Unable to load dashboard data."));
        }
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, [notification]);

  const metrics = useMemo(() => {
    const todayEntries = entries.filter((entry) =>
      isToday(getWorkEntryDateTime(entry)),
    );
    const todayPayments = payments.filter((payment) =>
      isToday(getPaymentDateTime(payment)),
    );
    const recentShipments = shipments.filter((shipment) => {
      const value = getShipmentDateTime(shipment);
      if (!value) return false;

      const date = new Date(value);
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      return date >= sevenDaysAgo;
    });
    const activeWorkers = workers.filter(
      (worker) => worker.active ?? worker.status !== "INACTIVE",
    );
    return {
      readyStockCount:
        dashboard?.totalReadyStockItems ??
        stock.reduce((sum, item) => sum + Number(item.availableQuantity ?? item.quantity ?? 0), 0),
      todayWorkEntries: todayEntries.length,
      todayPayments: todayPayments.length,
      recentShipmentCount: recentShipments.length,
      activeWorkers: dashboard?.totalWorkers ?? activeWorkers.length,
    };
  }, [dashboard, entries, payments, shipments, stock, workers]);

  const recentActivities = useMemo(() => {
    const workActivities = entries.map((entry) => ({
      id: `work-${entry.id}`,
      date: getWorkEntryDateTime(entry),
      text: `Worker ${getName(entry.worker ?? entry.workerName, "Unknown")} completed ${entry.quantity ?? 0} ${getName(entry.design ?? entry.designName, "items")} units.`,
      tone: "blue",
    }));

    const paymentActivities = payments.map((payment) => ({
      id: `payment-${payment.id}`,
      date: getPaymentDateTime(payment),
      text: `Payment of ${formatCurrency(payment.amount)} made to ${getName(payment.worker ?? payment.workerName, "worker")}.`,
      tone: "green",
    }));

    const shipmentActivities = shipments.map((shipment) => ({
      id: `shipment-${shipment.id ?? shipment.shipmentId}`,
      date: getShipmentDateTime(shipment),
      text: `Shipment sent to ${shipment.showroomName ?? getName(shipment.showroom, "showroom")}.`,
      tone: "amber",
    }));

    return sortByDateTimeDesc(
      [...workActivities, ...paymentActivities, ...shipmentActivities],
      (activity) => activity.date,
    ).slice(0, 10);
  }, [entries, payments, shipments]);

  const insights = useMemo(() => {
    const shippedProducts = shipments.reduce((groups, shipment) => {
      getShipmentItems(shipment).forEach((item) => {
        const name = getShipmentItemName(item);
        groups[name] = (groups[name] ?? 0) + Number(item.quantity ?? item.qty ?? 0);
      });
      return groups;
    }, {});

    const topShippedProducts = Object.entries(shippedProducts)
      .sort((first, second) => second[1] - first[1])
      .slice(0, 2)
      .map(([name, quantity]) => ({ name, quantity }));

    const workerOutput = entries.reduce((groups, entry) => {
      const worker = getName(entry.worker ?? entry.workerName, "Unknown Worker");
      groups[worker] = (groups[worker] ?? 0) + Number(entry.quantity ?? 0);
      return groups;
    }, {});

    const topWorkers = Object.entries(workerOutput)
      .sort((first, second) => second[1] - first[1])
      .slice(0, 3)
      .map(([name, quantity]) => ({ name, quantity }));

    const earned = entries.reduce((sum, entry) => sum + Number(entry.amount ?? 0), 0);
    const paid = payments.reduce((sum, payment) => sum + Number(payment.amount ?? 0), 0);
    const pendingPayments = Math.max(earned - paid, 0);

    const lowStock = stock
      .map((item) => ({
        name: item.designName ?? getName(item.design, "Unknown Design"),
        quantity: Number(item.availableQuantity ?? item.quantity ?? 0),
      }))
      .filter((item) => item.quantity <= 5)
      .sort((first, second) => first.quantity - second.quantity)
      .slice(0, 5);

    return {
      topShippedProducts,
      topWorkers,
      pendingPayments,
      lowStock,
    };
  }, [entries, payments, shipments, stock]);

  const quickActions = [
    { title: "Work Entry", path: "/work-entries", icon: ClipboardList, tone: "bg-blue-50 text-blue-700" },
    { title: "Payment", path: "/payments", icon: Wallet, tone: "bg-green-50 text-green-700" },
    { title: "Shipment", path: "/shipments", icon: Truck, tone: "bg-amber-50 text-amber-700" },
    { title: "Worker", path: "/workers", icon: UserPlus, tone: "bg-slate-100 text-slate-700" },
  ];

  return (
    <MainLayout>
      <div className="page-stack">
        {loading ? (
          <LoadingSpinner label="Loading Dashboard..." />
        ) : (
          <>
            <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {quickActions.map((action) => {
                const Icon = action.icon;

                return (
                  <Link
                    key={action.path}
                    to={action.path}
                    className="group flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-200/70 transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"
                  >
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                        Quick Action
                      </p>
                      <h3 className="mt-1 text-base font-bold text-slate-950">
                        {action.title}
                      </h3>
                    </div>
                    <span className={`flex h-11 w-11 items-center justify-center rounded-xl ${action.tone}`}>
                      <Icon size={21} />
                    </span>
                  </Link>
                );
              })}
            </section>

            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-5">
              <DashboardCard title="Active Workers" value={metrics.activeWorkers} helper="Available production workforce" tone="blue" />
              <DashboardCard title="Ready Stock Count" value={metrics.readyStockCount} helper="Finished units available" tone="amber" />
              <DashboardCard title="Today's Work Entries" value={metrics.todayWorkEntries} helper="Production records today" tone="blue" />
              <DashboardCard title="Today's Payments" value={metrics.todayPayments} helper="Payments recorded today" tone="green" />
              <DashboardCard title="Recent Shipment Count" value={metrics.recentShipmentCount} helper="Shipments in last 7 days" tone="slate" />
            </div>

            <section className="grid gap-5 xl:grid-cols-4">
              <div className="section-card">
                <h3 className="text-lg font-bold text-slate-950">Most Shipped Items</h3>
                <p className="mt-1 text-sm text-slate-500">Top 2 shipped products.</p>
                <div className="mt-5 space-y-3">
                  {insights.topShippedProducts.length === 0 ? (
                    <p className="text-sm text-slate-500">No shipment item data yet.</p>
                  ) : (
                    insights.topShippedProducts.map((item) => (
                      <div key={item.name} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
                        <span className="text-sm font-semibold text-slate-800">{item.name}</span>
                        <span className="text-sm font-bold text-blue-700">{item.quantity}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="section-card">
                <h3 className="text-lg font-bold text-slate-950">Top Workers</h3>
                <p className="mt-1 text-sm text-slate-500">By production quantity.</p>
                <div className="mt-5 space-y-3">
                  {insights.topWorkers.length === 0 ? (
                    <p className="text-sm text-slate-500">No production data yet.</p>
                  ) : (
                    insights.topWorkers.map((worker) => (
                      <div key={worker.name} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
                        <span className="text-sm font-semibold text-slate-800">{worker.name}</span>
                        <span className="text-sm font-bold text-green-700">{worker.quantity}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="section-card">
                <h3 className="text-lg font-bold text-slate-950">Pending Payments</h3>
                <p className="mt-1 text-sm text-slate-500">Estimated earned minus paid.</p>
                <p className="mt-6 text-3xl font-bold text-slate-950">
                  {formatCurrency(insights.pendingPayments)}
                </p>
              </div>

              <div className="section-card">
                <h3 className="text-lg font-bold text-slate-950">Low Stock Alerts</h3>
                <p className="mt-1 text-sm text-slate-500">Items at 5 or fewer units.</p>
                <div className="mt-5 space-y-3">
                  {insights.lowStock.length === 0 ? (
                    <p className="text-sm text-slate-500">No low stock alerts.</p>
                  ) : (
                    insights.lowStock.map((item) => (
                      <div key={item.name} className="flex items-center justify-between rounded-lg bg-orange-50 px-3 py-2">
                        <span className="text-sm font-semibold text-orange-900">{item.name}</span>
                        <span className="text-sm font-bold text-orange-700">{item.quantity}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </section>

            <section className="section-card">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="text-lg font-bold text-slate-950">Recent Activity</h3>
                  <p className="text-sm text-slate-500">Latest production, payment, and shipment events.</p>
                </div>
              </div>

              <div className="mt-5 space-y-3">
                {recentActivities.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
                    No recent activity yet.
                  </div>
                ) : (
                  recentActivities.map((activity) => (
                    <div
                      key={activity.id}
                      className="flex flex-col gap-2 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <p className="text-sm font-medium text-slate-800">{activity.text}</p>
                      <p className="text-xs font-semibold text-slate-500">
                        {formatDate(activity.date)} {formatTime(activity.date)}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </section>
          </>
        )}
      </div>
    </MainLayout>
  );
}

export default Dashboard;

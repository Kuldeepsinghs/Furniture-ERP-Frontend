import { useEffect, useMemo, useState } from "react";
import api from "../api/axios";
import DataTable from "../components/DataTable";
import LoadingSpinner from "../components/LoadingSpinner";
import MainLayout from "../layouts/MainLayout";
import { useNotification } from "../hooks/useNotification";
import { getErrorMessage } from "../utils/errors";
import {
  formatDate,
  formatTime,
  getName,
  getShipmentDateTime,
  getShipmentItemName,
  getShipmentItems,
  sortByDateTimeDesc,
} from "../utils/format";

const Shipments = () => {
  const notification = useNotification();
  const [showrooms, setShowrooms] = useState([]);
  const [stock, setStock] = useState([]);
  const [shipments, setShipments] = useState([]);
  const [form, setForm] = useState({
    showroomId: "",
    stockId: "",
    quantity: 1,
    remarks: "",
  });
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadData = async () => {
    try {
      const [showroomsRes, stockRes, shipmentsRes] = await Promise.all([
        api.get("/showrooms"),
        api.get("/ready-stock"),
        api.get("/shipments/history"),
      ]);

      setShowrooms(showroomsRes.data);
      setStock(stockRes.data);
      setShipments(
        sortByDateTimeDesc(shipmentsRes.data, (shipment) =>
          getShipmentDateTime(shipment),
        ),
      );
    } catch (error) {
      notification.error(getErrorMessage(error, "Unable to load shipments."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectedStock = useMemo(
    () => stock.find((item) => String(item.id) === String(form.stockId)),
    [form.stockId, stock],
  );

  const addItem = () => {
    if (!selectedStock) {
      notification.warning("Please select an item for shipment.");
      return;
    }

    const requestedQuantity = Number(form.quantity);
    const availableQuantity = Number(
      selectedStock.availableQuantity ?? selectedStock.quantity ?? 0,
    );

    if (requestedQuantity <= 0) {
      notification.warning("Quantity must be greater than zero.");
      return;
    }

    if (requestedQuantity > availableQuantity) {
      notification.warning("Insufficient ready stock available.");
      return;
    }

    setItems([
      ...items,
      {
        stockId: selectedStock.id,
        designId: selectedStock.design?.id ?? selectedStock.designId,
        name: selectedStock.designName ?? getName(selectedStock.design),
        quantity: requestedQuantity,
        availableQuantity,
      },
    ]);
    setForm({ ...form, stockId: "", quantity: 1 });
  };

  const createShipment = async (event) => {
    event.preventDefault();

    if (!form.showroomId) {
      notification.warning("Please select a showroom.");
      return;
    }

    if (items.length === 0) {
      notification.warning("No items selected for shipment.");
      return;
    }

    const hasInsufficientStock = items.some(
      (item) => Number(item.quantity) > Number(item.availableQuantity ?? item.quantity),
    );

    if (hasInsufficientStock) {
      notification.warning("Insufficient ready stock available.");
      return;
    }

    setSaving(true);

    try {
      await api.post("/shipments", {
        showroomId: Number(form.showroomId),
        remarks: form.remarks,
        items: items.map((item) => ({
          designId: Number(item.designId),
          quantity: Number(item.quantity),
        })),
      });
      setForm({ showroomId: "", stockId: "", quantity: 1, remarks: "" });
      setItems([]);
      await loadData();
      notification.success("Shipment created successfully.");
    } catch (error) {
      notification.error(getErrorMessage(error, "Failed to create shipment."));
    } finally {
      setSaving(false);
    }
  };

  const shipmentColumns = [
    {
      key: "shipmentDate",
      header: "Date",
      render: (shipment) => formatDate(getShipmentDateTime(shipment)),
    },
    {
      key: "shipmentTime",
      header: "Time",
      render: (shipment) => formatTime(getShipmentDateTime(shipment)),
    },
    {
      key: "showroom",
      header: "Showroom",
      render: (shipment) => shipment.showroomName,
    },
    {
      key: "items",
      header: "Items",
      render: (shipment) => {
        const shipmentItems = getShipmentItems(shipment);
        if (!shipmentItems.length) return "-";

        return shipmentItems
          .map(
            (item) =>
              `${getShipmentItemName(item)} (${item.quantity ?? item.qty ?? 0})`,
          )
          .join(", ");
      },
    },
    {
      key: "quantities",
      header: "Quantities",
      render: (shipment) => {
        const shipmentItems = getShipmentItems(shipment);
        return shipmentItems.length
          ? shipmentItems.map((item) => item.quantity ?? item.qty ?? 0).join(", ")
          : "-";
      },
    },
    {
      key: "remarks",
      header: "Remarks",
      render: (shipment) => shipment.remarks || "-",
    },
  ];

  const filteredShipments = sortByDateTimeDesc(
    shipments.filter((shipment) =>
      JSON.stringify(shipment).toLowerCase().includes(search.toLowerCase()),
    ),
    (shipment) => getShipmentDateTime(shipment),
  );

  return (
    <MainLayout>
      <div className="page-stack">
        <section className="section-card">
          <h3 className="text-lg font-bold text-slate-950">Create Shipment</h3>
          <p className="mt-1 text-sm text-slate-500">
            Select a showroom and ready stock items for dispatch.
          </p>

          <form onSubmit={createShipment} className="mt-5 space-y-5">
            <div className="grid gap-4 lg:grid-cols-4">
              <label>
                <span className="field-label">Showroom</span>
                <select
                  className="field-input"
                  value={form.showroomId}
                  onChange={(e) =>
                    setForm({ ...form, showroomId: e.target.value })
                  }
                  required
                >
                  <option value="">Select showroom</option>
                  {showrooms.map((showroom) => (
                    <option key={showroom.id} value={showroom.id}>
                      {showroom.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span className="field-label">Product</span>
                <select
                  className="field-input"
                  value={form.stockId}
                  onChange={(e) =>
                    setForm({ ...form, stockId: e.target.value })
                  }
                >
                  <option value="">Select product</option>
                  {stock.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.designName ?? getName(item.design)} -{" "}
                      {item.availableQuantity ?? item.quantity ?? 0} available
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span className="field-label">Quantity</span>
                <input
                  type="number"
                  min="1"
                  className="field-input"
                  value={form.quantity}
                  onChange={(e) =>
                    setForm({ ...form, quantity: e.target.value })
                  }
                />
              </label>
              <div className="flex items-end">
                <button
                  type="button"
                  onClick={addItem}
                  className="secondary-button w-full"
                >
                  Add Item
                </button>
              </div>
            </div>

            <label className="block">
              <span className="field-label">Remarks</span>
              <textarea
                className="field-input min-h-24"
                value={form.remarks}
                onChange={(e) => setForm({ ...form, remarks: e.target.value })}
                placeholder="Dispatch notes"
              />
            </label>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-bold text-slate-800">Selected Items</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {items.length === 0 ? (
                  <p className="text-sm text-slate-500">
                    No shipment items selected.
                  </p>
                ) : (
                  items.map((item, index) => (
                    <span
                      key={`${item.stockId}-${index}`}
                      className="rounded-full bg-white px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm"
                    >
                      {item.name} x {item.quantity}
                    </span>
                  ))
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={saving || items.length === 0}
              className="primary-button"
            >
              {saving ? "Creating..." : "Create Shipment"}
            </button>
          </form>
        </section>

        <section className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-lg font-bold text-slate-950">
                Detailed Shipment History
              </h3>
              <p className="text-sm text-slate-500">
                Completed dispatches by date, time, showroom, item, quantity,
                and remarks.
              </p>
            </div>
            <input
              className="field-input mt-0 sm:max-w-xs"
              placeholder="Search shipments"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
          {loading ? (
            <LoadingSpinner label="Loading shipments" />
          ) : (
            <DataTable
              columns={shipmentColumns}
              data={filteredShipments}
              emptyMessage="No shipments match your search."
            />
          )}
        </section>
      </div>
    </MainLayout>
  );
};

export default Shipments;

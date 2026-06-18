import { useEffect, useMemo, useState } from "react";
import api from "../../api/axios";
import LoadingSpinner from "../../components/LoadingSpinner";
import MainLayout from "../../layouts/MainLayout";
import {
  asArray,
  formatDate,
  formatTime,
  getShipmentDateTime,
  getShipmentItemName,
  getShipmentItems,
  sortByDateTimeDesc,
} from "../../utils/format";

function ShowroomShipmentHistory() {
  const [showrooms, setShowrooms] = useState([]);
  const [selectedShowroomId, setSelectedShowroomId] = useState("");
  const [shipments, setShipments] = useState([]);
  const [loadingShowrooms, setLoadingShowrooms] = useState(true);
  const [loadingShipments, setLoadingShipments] = useState(false);

  useEffect(() => {
    const loadShowrooms = async () => {
      try {
        const response = await api.get("/showrooms");
        setShowrooms(asArray(response.data));
      } finally {
        setLoadingShowrooms(false);
      }
    };

    loadShowrooms();
  }, []);

  useEffect(() => {
    if (!selectedShowroomId) {
      return;
    }

    const loadShipmentHistory = async () => {
      setLoadingShipments(true);

      try {
        const response = await api.get(
          `/shipments/showrooms/${selectedShowroomId}/shipments`
        );
        setShipments(
          sortByDateTimeDesc(asArray(response.data), (shipment) =>
            getShipmentDateTime(shipment),
          ),
        );
      } finally {
        setLoadingShipments(false);
      }
    };

    loadShipmentHistory();
  }, [selectedShowroomId]);

  const selectedShowroom = useMemo(
    () =>
      showrooms.find(
        (showroom) => String(showroom.id) === String(selectedShowroomId)
      ),
    [selectedShowroomId, showrooms]
  );

  return (
    <MainLayout>
      <div className="page-stack">
        <section className="section-card">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h3 className="page-heading">Showroom Shipment History</h3>
              <p className="muted-text mt-1">
                Select a showroom to review all dispatched shipments and item
                quantities.
              </p>
            </div>

            <label className="w-full lg:max-w-sm">
              <span className="field-label">Showroom</span>
              <select
                className="field-input"
                value={selectedShowroomId}
                onChange={(event) => {
                  setSelectedShowroomId(event.target.value);
                  setShipments([]);
                }}
                disabled={loadingShowrooms}
              >
                <option value="">Select showroom</option>
                {showrooms.map((showroom) => (
                  <option key={showroom.id} value={showroom.id}>
                    {showroom.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </section>

        {loadingShowrooms ? (
          <LoadingSpinner label="Loading showrooms" />
        ) : !selectedShowroomId ? (
          <section className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm">
            <h3 className="text-lg font-bold text-slate-950">
              Choose a showroom
            </h3>
            <p className="mt-2 text-sm text-slate-500">
              Shipment history will appear here after selecting a showroom.
            </p>
          </section>
        ) : loadingShipments ? (
          <LoadingSpinner label="Loading shipment history" />
        ) : (
          <section className="space-y-5">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-950">
                  {selectedShowroom?.name ?? "Selected Showroom"}
                </h3>
                <p className="text-sm text-slate-500">
                  {shipments.length} shipment records found
                </p>
              </div>
            </div>

            {shipments.length === 0 ? (
              <div className="rounded-xl border border-slate-200 bg-white p-10 text-center shadow-sm">
                <h3 className="text-lg font-bold text-slate-950">
                  No shipment history
                </h3>
                <p className="mt-2 text-sm text-slate-500">
                  This showroom does not have any shipment records yet.
                </p>
              </div>
            ) : (
              <div className="grid gap-5 xl:grid-cols-2">
                {shipments.map((shipment, index) => {
                  const shipmentDate = getShipmentDateTime(shipment);
                  const items = getShipmentItems(shipment);

                  return (
                    <article
                      key={shipment.shipmentId ?? shipment.id ?? index}
                      className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/60 transition hover:-translate-y-0.5 hover:shadow-md"
                    >
                      <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-center sm:justify-between">
                        <div className="grid gap-4 sm:grid-cols-2">
                          <div>
                            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                              Shipment Date
                            </p>
                            <h3 className="mt-1 text-2xl font-bold text-slate-950">
                              {formatDate(shipmentDate)}
                            </h3>
                          </div>
                          <div>
                            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                              Shipment Time
                            </p>
                            <h3 className="mt-1 text-2xl font-bold text-blue-700">
                              {formatTime(shipmentDate)}
                            </h3>
                          </div>
                        </div>
                      </div>

                      <div className="py-5">
                        <div className="overflow-hidden rounded-lg border border-slate-200">
                          <table className="min-w-full divide-y divide-slate-200">
                            <thead className="bg-slate-100">
                              <tr>
                                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                                  Product Name
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                                  Quantity
                                </th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 bg-white">
                              {items.length === 0 ? (
                                <tr>
                                  <td
                                    colSpan="2"
                                    className="px-4 py-6 text-center text-sm text-slate-500"
                                  >
                                    No items found for this shipment.
                                  </td>
                                </tr>
                              ) : (
                                items.map((item, itemIndex) => (
                                  <tr
                                    key={item.id ?? itemIndex}
                                    className="transition hover:bg-blue-50/40"
                                  >
                                    <td className="px-4 py-3 text-sm font-medium text-slate-800">
                                      {getShipmentItemName(item)}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-slate-700">
                                      {item.quantity ?? item.qty ?? 0}
                                    </td>
                                  </tr>
                                ))
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {shipment.remarks && (
                        <div className="border-t border-slate-100 pt-4">
                          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                            Remarks
                          </p>
                          <p className="mt-1 text-sm leading-6 text-slate-600">
                            {shipment.remarks}
                          </p>
                        </div>
                      )}

                      <div className="mt-5 flex justify-end">
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                          Shipment #{shipment.shipmentId ?? shipment.id ?? "-"}
                        </span>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        )}
      </div>
    </MainLayout>
  );
}

export default ShowroomShipmentHistory;

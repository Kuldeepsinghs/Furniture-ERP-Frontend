import { useEffect, useMemo, useState } from "react";
import api from "../../api/axios";
import DataTable from "../../components/DataTable";
import LoadingSpinner from "../../components/LoadingSpinner";
import MainLayout from "../../layouts/MainLayout";
import {
  asArray,
  formatDate,
  formatTime,
  getName,
  getShipmentDateTime,
  getShipmentItemName,
  getShipmentItems,
  sortByDateTimeDesc,
} from "../../utils/format";

function ShipmentReport() {
  const [shipments, setShipments] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadShipments = async () => {
      try {
        const response = await api.get("/shipments/history");
        setShipments(
          sortByDateTimeDesc(asArray(response.data), (shipment) =>
            getShipmentDateTime(shipment),
          ),
        );
      } finally {
        setLoading(false);
      }
    };

    loadShipments();
  }, []);

  const filteredShipments = useMemo(
    () =>
      sortByDateTimeDesc(
        shipments.filter((shipment) =>
          JSON.stringify(shipment).toLowerCase().includes(search.toLowerCase()),
        ),
        (shipment) => getShipmentDateTime(shipment),
      ),
    [shipments, search]
  );

  return (
    <MainLayout>
      <div className="page-stack">
        <section className="section-card">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="page-heading">Shipment Report</h3>
              <p className="muted-text mt-1">Detailed shipment history with item quantities and remarks.</p>
            </div>
            <input className="field-input mt-0 sm:max-w-xs" placeholder="Search shipments" value={search} onChange={(event) => setSearch(event.target.value)} />
          </div>
        </section>
        {loading ? (
          <LoadingSpinner label="Loading shipment report" />
        ) : (
          <DataTable
            columns={[
              { key: "date", header: "Date", render: (row) => formatDate(getShipmentDateTime(row)) },
              { key: "time", header: "Time", render: (row) => formatTime(getShipmentDateTime(row)) },
              { key: "showroom", header: "Showroom", render: (row) => getName(row.showroom ?? row.showroomName) },
              {
                key: "items",
                header: "Items",
                render: (row) => {
                  const items = getShipmentItems(row);
                  return items.length ? items.map(getShipmentItemName).join(", ") : "-";
                },
              },
              {
                key: "quantities",
                header: "Quantities",
                render: (row) => {
                  const items = getShipmentItems(row);
                  return items.length ? items.map((item) => item.quantity ?? item.qty ?? 0).join(", ") : "-";
                },
              },
              { key: "remarks", header: "Remarks", render: (row) => row.remarks || "-" },
            ]}
            data={filteredShipments}
            emptyMessage="No shipment records found."
          />
        )}
      </div>
    </MainLayout>
  );
}

export default ShipmentReport;

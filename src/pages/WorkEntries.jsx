import { useEffect, useState } from "react";
import { Download } from "lucide-react";
import api from "../api/axios";
import DataTable from "../components/DataTable";
import LoadingSpinner from "../components/LoadingSpinner";
import MainLayout from "../layouts/MainLayout";
import { useNotification } from "../hooks/useNotification";
import { getErrorMessage } from "../utils/errors";
import { exportToCsv } from "../utils/exportCsv";
import {
  formatCurrency,
  formatDate,
  formatTime,
  getName,
  getWorkEntryDateTime,
  sortByDateTimeDesc,
} from "../utils/format";

function WorkEntries() {
  const notification = useNotification();
  const [workers, setWorkers] = useState([]);
  const [designs, setDesigns] = useState([]);
  const [rateTypes, setRateTypes] = useState([]);
  const [productRates, setProductRates] = useState([]);
  const [entries, setEntries] = useState([]);
  const [form, setForm] = useState({
    workerId: "",
    designId: "",
    rateTypeId: "",
    finishType: "NORMAL",
    quantity: 1,
    remarks: "",
  });
  const [search, setSearch] = useState("");
  const [workerFilter, setWorkerFilter] = useState("");
  const [rateTypeFilter, setRateTypeFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  async function loadData() {
    try {
      const workersRes = await api.get("/workers");

      const designsRes = await api.get("/designs");

      const rateTypesRes = await api.get("/rate-types");

      const entriesRes = await api.get("/work-entries");

      const productRatesRes = await api.get("/product-rates");

      setWorkers(workersRes.data);
      setDesigns(designsRes.data);
      setRateTypes(rateTypesRes.data);
      setEntries(
        sortByDateTimeDesc(entriesRes.data, (entry) =>
          getWorkEntryDateTime(entry),
        ),
      );
      setProductRates(productRatesRes.data);
    } catch (error) {
      notification.error(getErrorMessage(error, "Unable to load work entries."));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectedWorker = workers.find((item) => String(item.id) === String(form.workerId));
  const selectedDesign = designs.find((item) => String(item.id) === String(form.designId));
  const selectedRateType = rateTypes.find((item) => String(item.id) === String(form.rateTypeId));
  const selectedWorkerRole = selectedWorker?.role ?? "";
  const isPolisher = selectedWorkerRole === "POLISHER";
  const selectedProductRate = productRates.find((rate) => {
    const designId = String(rate.design?.id ?? rate.designId ?? "");
    const rateTypeId = String(rate.rateType?.id ?? rate.rateTypeId ?? "");

    return designId === String(form.designId) && rateTypeId === String(form.rateTypeId);
  });

  const getNumericRate = (...values) => {
    const value = values.find((item) => item !== null && item !== undefined && item !== "");
    return value === undefined ? null : Number(value);
  };

  const roleRate =
    selectedWorkerRole === "CARPENTER"
      ? {
          label: "Carpenter",
          defaultRate: getNumericRate(
            selectedRateType?.defaultCarpenterRate,
            selectedRateType?.carpenterRate,
          ),
          overrideRate: getNumericRate(
            selectedProductRate?.carpenterRateOverride,
            selectedProductRate?.carpenterOverride,
          ),
        }
      : {
          label: "Polisher",
          defaultRate: getNumericRate(
            selectedRateType?.defaultPolisherRate,
            selectedRateType?.polisherRate,
          ),
          overrideRate: getNumericRate(
            selectedProductRate?.polisherRateOverride,
            selectedProductRate?.polisherOverride,
          ),
        };

  const walnutExtra = getNumericRate(selectedRateType?.walnutExtra) ?? 0;
  const baseRate = roleRate.overrideRate ?? roleRate.defaultRate;
  const hasConfiguredRate = baseRate !== null && !Number.isNaN(baseRate) && baseRate > 0;
  const appliedWalnutExtra = isPolisher && form.finishType === "WALNUT" ? walnutExtra : 0;
  const finalUnitRate = hasConfiguredRate ? baseRate + appliedWalnutExtra : 0;
  const previewTotal = finalUnitRate * Number(form.quantity || 0);
  const rateSource = roleRate.overrideRate ? "Product Override" : "Default Rate";

  const saveEntry = async (event) => {
    event.preventDefault();

    if (!form.workerId) {
      notification.warning("Please select a worker.");
      return;
    }

    if (!form.designId) {
      notification.warning("Please select a design.");
      return;
    }

    if (!form.rateTypeId) {
      notification.warning("Please select a rate type.");
      return;
    }

    if (!hasConfiguredRate) {
      notification.warning("Rate not configured for selected Rate Type");
      return;
    }

    setSaving(true);

    try {
      await api.post("/work-entries", {
        workerId: Number(form.workerId),
        designId: Number(form.designId),
        rateTypeId: Number(form.rateTypeId),
        finishType: isPolisher ? form.finishType : "NORMAL",
        quantity: Number(form.quantity),
        remarks: form.remarks,
      });

      setForm({ ...form, finishType: "NORMAL", quantity: 1, remarks: "" });
      await loadData();
      notification.success("Work Entry Saved Successfully");
    } catch (error) {
      notification.error(getErrorMessage(error, "Failed to save work entry."));
    } finally {
      setSaving(false);
    }
  };

  const columns = [
    { key: "worker", header: "Worker", render: (entry) => getName(entry.worker ?? entry.workerName) },
    { key: "design", header: "Design", render: (entry) => getName(entry.design ?? entry.designName) },
    { key: "rateType", header: "Rate Type", render: (entry) => getName(entry.rateType ?? entry.rateTypeName) },
    { key: "quantity", header: "Quantity" },
    { key: "amount", header: "Amount", render: (entry) => formatCurrency(entry.amount) },
    { key: "date", header: "Date", render: (entry) => formatDate(getWorkEntryDateTime(entry)) },
    { key: "time", header: "Time", render: (entry) => formatTime(getWorkEntryDateTime(entry)) },
  ];

  const exportEntries = () => {
    if (!filteredEntries.length) {
      notification.warning("No Work Entries to Export");
      return;
    }

    exportToCsv(
      `production-entries-${new Date().toISOString().slice(0, 10)}.csv`,
      [
        { key: "worker", header: "Worker", value: (entry) => getName(entry.worker ?? entry.workerName) },
        { key: "design", header: "Design", value: (entry) => getName(entry.design ?? entry.designName) },
        { key: "rateType", header: "Rate Type", value: (entry) => getName(entry.rateType ?? entry.rateTypeName) },
        { key: "quantity", header: "Quantity", value: (entry) => entry.quantity ?? 0 },
        { key: "finishType", header: "Finish Type", value: (entry) => entry.finishType ?? "" },
        { key: "amount", header: "Amount", value: (entry) => entry.amount ?? 0 },
        { key: "date", header: "Date", value: (entry) => formatDate(getWorkEntryDateTime(entry)) },
        { key: "time", header: "Time", value: (entry) => formatTime(getWorkEntryDateTime(entry)) },
        { key: "remarks", header: "Remarks", value: (entry) => entry.remarks || "" },
      ],
      filteredEntries,
    );
  };

  const filteredEntries = sortByDateTimeDesc(entries.filter((entry) => {
    const workerId = String(entry.worker?.id ?? entry.workerId ?? "");
    const rateTypeId = String(entry.rateType?.id ?? entry.rateTypeId ?? "");
    const searchable = [
      getName(entry.worker ?? entry.workerName),
      getName(entry.design ?? entry.designName),
      getName(entry.rateType ?? entry.rateTypeName),
      entry.quantity,
      entry.amount,
    ]
      .join(" ")
      .toLowerCase();

    return (
      searchable.includes(search.toLowerCase()) &&
      (!workerFilter || workerId === workerFilter) &&
      (!rateTypeFilter || rateTypeId === rateTypeFilter)
    );
  }), (entry) => getWorkEntryDateTime(entry));

  return (
    <MainLayout>
      <div className="page-stack">
        <section className="section-card">
          <div>
            <h3 className="text-lg font-bold text-slate-950">Production Entry</h3>
            <p className="mt-1 text-sm text-slate-500">Record completed work and calculate worker payable amount.</p>
          </div>

          <form onSubmit={saveEntry} className="mt-5 grid gap-4 lg:grid-cols-4">
            <label>
              <span className="field-label">Worker</span>
              <select
                className="field-input"
                value={form.workerId}
                onChange={(e) => {
                  const worker = workers.find((item) => String(item.id) === e.target.value);
                  setForm({
                    ...form,
                    workerId: e.target.value,
                    finishType: worker?.role === "POLISHER" ? form.finishType : "NORMAL",
                  });
                }}
                required
              >
                <option value="">Select worker</option>
                {workers.map((worker) => (
                  <option key={worker.id} value={worker.id}>{worker.name}</option>
                ))}
              </select>
            </label>
            <label>
              <span className="field-label">Design</span>
              <select
                className="field-input"
                value={form.designId}
                onChange={(e) => setForm({ ...form, designId: e.target.value })}
                required
              >
                <option value="">Select design</option>
                {designs.map((design) => (
                  <option key={design.id} value={design.id}>{design.designName ?? design.name}</option>
                ))}
              </select>
            </label>
            <label>
              <span className="field-label">Rate Type</span>
              <select
                className="field-input"
                value={form.rateTypeId}
                onChange={(e) => setForm({ ...form, rateTypeId: e.target.value })}
                required
              >
                <option value="">Select rate type</option>
                {rateTypes.map((rateType) => (
                  <option key={rateType.id} value={rateType.id}>{rateType.name ?? rateType.type}</option>
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
                onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                required
              />
            </label>
            {isPolisher && (
              <label>
                <span className="field-label">Finish Type</span>
                <select
                  className="field-input"
                  value={form.finishType}
                  onChange={(e) => setForm({ ...form, finishType: e.target.value })}
                >
                  <option value="NORMAL">NORMAL</option>
                  <option value="WALNUT">WALNUT</option>
                </select>
              </label>
            )}
            <label className="lg:col-span-3">
              <span className="field-label">Remarks</span>
              <textarea
                className="field-input min-h-24"
                value={form.remarks}
                onChange={(e) => setForm({ ...form, remarks: e.target.value })}
                placeholder="Optional production notes"
              />
            </label>
            <div className="flex items-end">
              <button type="submit" disabled={saving} className="primary-button w-full">
                {saving ? "Saving..." : "Save Entry"}
              </button>
            </div>
          </form>

          {form.workerId && form.designId && form.rateTypeId && (
            <div className="mt-5 rounded-xl border border-blue-200 bg-blue-50 p-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <p className="text-sm font-bold text-blue-900">
                    Rate Source: {hasConfiguredRate ? rateSource : "Rate not configured"}
                  </p>
                  <div className="mt-3 grid gap-2 text-sm text-blue-900 sm:grid-cols-2 lg:grid-cols-3">
                    <p>Base {roleRate.label} Rate: {hasConfiguredRate ? formatCurrency(baseRate) : "N/A"}</p>
                    {isPolisher && <p>Walnut Extra: {formatCurrency(walnutExtra)}</p>}
                    <p>Final Unit Rate: {formatCurrency(finalUnitRate)}</p>
                    <p>Quantity: {Number(form.quantity || 0)}</p>
                    <p className="font-bold">Total Amount: {formatCurrency(previewTotal)}</p>
                  </div>
                </div>
                <div className="rounded-lg bg-white px-4 py-3 text-xs font-semibold text-blue-800 shadow-sm">
                  {selectedDesign?.designName ?? selectedDesign?.name} / {selectedRateType?.name}
                </div>
              </div>
            </div>
          )}
        </section>

        <section className="space-y-4">
          <div className="flex flex-col gap-3 xl:max-w-6xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-bold text-slate-950">Recent Entries</h3>
                <p className="text-sm text-slate-500">Compact production records without raw nested JSON.</p>
              </div>
              <button
                type="button"
                onClick={exportEntries}
                className="inline-flex items-center gap-2 whitespace-nowrap rounded-lg bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-200"
              >
                <Download size={16} />
                Export CSV
              </button>
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              <input
                className="field-input mt-0"
                placeholder="Search worker, design, rate"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
              <select
                className="field-input mt-0"
                value={workerFilter}
                onChange={(event) => setWorkerFilter(event.target.value)}
              >
                <option value="">All workers</option>
                {workers.map((worker) => (
                  <option key={worker.id} value={worker.id}>{worker.name}</option>
                ))}
              </select>
              <select
                className="field-input mt-0"
                value={rateTypeFilter}
                onChange={(event) => setRateTypeFilter(event.target.value)}
              >
                <option value="">All rate types</option>
                {rateTypes.map((rateType) => (
                  <option key={rateType.id} value={rateType.id}>{rateType.name ?? rateType.type}</option>
                ))}
              </select>
            </div>
          </div>
          {loading ? (
            <LoadingSpinner label="Loading work entries" />
          ) : (
            <div className="xl:max-w-6xl">
              <DataTable compact columns={columns} data={filteredEntries} emptyMessage="No work entries match the filters." />
            </div>
          )}
        </section>
      </div>
    </MainLayout>
  );
}

export default WorkEntries;
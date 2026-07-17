import { useCallback, useEffect, useState } from "react";
import { Download, Eye, Pencil, PlusCircle, Trash2, X } from "lucide-react";
import api from "../../api/axios";
import DataTable from "../../components/DataTable";
import LoadingSpinner from "../../components/LoadingSpinner";
import MainLayout from "../../layouts/MainLayout";
import { useNotification } from "../../hooks/useNotification";
import { getErrorMessage } from "../../utils/errors";
import { exportToCsv } from "../../utils/exportCsv";
import { toBackendDateTime, toDateTimeLocalValue } from "../../utils/dateInput";
import {
  asArray,
  formatCurrency,
  formatDate,
  formatTime,
  getSaleDateTime,
  sortByDateTimeDesc,
} from "../../utils/format";
import {
  buildSalePayload,
  emptySaleForm,
  emptySaleProduct,
  getSaleProductCount,
  getSaleProducts,
  saleToForm,
  validateSaleForm,
} from "../../utils/sales";

function ProductsTable({ products }) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200">
      <table className="min-w-full divide-y divide-slate-200 text-sm">
        <thead className="bg-slate-50">
          <tr>
            <th className="px-4 py-3 text-left font-bold text-slate-600">Product Name</th>
            <th className="px-4 py-3 text-left font-bold text-slate-600">Category</th>
            <th className="px-4 py-3 text-left font-bold text-slate-600">Quantity</th>
            <th className="px-4 py-3 text-left font-bold text-slate-600">Price</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white">
          {products.length ? (
            products.map((product, index) => (
              <tr key={`${product.productName}-${index}`}>
                <td className="px-4 py-3 font-medium text-slate-900">
                  {product.productName || "N/A"}
                </td>
                <td className="px-4 py-3 text-slate-700">{product.category || "N/A"}</td>
                <td className="px-4 py-3 text-slate-700">{product.quantity ?? "N/A"}</td>
                <td className="px-4 py-3 text-slate-700">{formatCurrency(product.price)}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="4" className="px-4 py-8 text-center text-sm text-slate-500">
                No products available.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function EditableProducts({ products, categories, onChange, onAdd, onRemove }) {
  return (
    <div className="space-y-3">
      {products.map((product, index) => (
        <div
          key={index}
          className="grid gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 md:grid-cols-[1.2fr_1fr_0.7fr_0.9fr_auto] md:items-end"
        >
          <label>
            <span className="field-label">Product Name</span>
            <input
              className="field-input"
              value={product.productName}
              onChange={(event) => onChange(index, "productName", event.target.value)}
              required
            />
          </label>
          <label>
            <span className="field-label">Category</span>
            <select
              className="field-input"
              value={product.category}
              onChange={(event) => onChange(index, "category", event.target.value)}
              required
            >
              <option value="">Select category</option>
              {categories.map((category) => (
                <option key={category.id ?? category.name} value={category.name}>
                  {category.name}
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
              value={product.quantity}
              onChange={(event) => onChange(index, "quantity", event.target.value)}
              required
            />
          </label>
          <label>
            <span className="field-label">Price</span>
            <input
              type="number"
              min="0"
              step="0.01"
              className="field-input"
              value={product.price}
              onChange={(event) => onChange(index, "price", event.target.value)}
              required
            />
          </label>
          <button
            type="button"
            onClick={() => onRemove(index)}
            disabled={products.length === 1}
            className="inline-flex h-11 items-center justify-center rounded-lg border border-red-200 bg-red-50 px-3 text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
            title="Remove product"
          >
            <Trash2 size={17} />
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={onAdd}
        className="inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-100"
      >
        <PlusCircle size={17} />
        Add Product
      </button>
    </div>
  );
}

function SaleModal({ mode, sale, form, setForm, categories, onClose, onSave, saving }) {
  if (!sale) return null;

  const readonly = mode === "view";
  const saleDateTime = getSaleDateTime(sale);

  const updateProduct = (index, field, value) => {
    setForm((current) => ({
      ...current,
      products: current.products.map((product, productIndex) =>
        productIndex === index ? { ...product, [field]: value } : product,
      ),
    }));
  };

  const addProduct = () => {
    setForm((current) => ({
      ...current,
      products: [...current.products, { ...emptySaleProduct }],
    }));
  };

  const removeProduct = (index) => {
    setForm((current) => ({
      ...current,
      products: current.products.filter((_, productIndex) => productIndex !== index),
    }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-slate-950/50 p-3 sm:items-center sm:justify-center">
      <section className="max-h-[92vh] w-full overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl sm:max-w-4xl">
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <h3 className="text-xl font-bold text-slate-950">
              {readonly ? "Sale Details" : "Edit Sale"}
            </h3>
            <p className="mt-1 text-sm text-slate-500">Sale #{sale.id}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100"
            aria-label="Close sale modal"
          >
            <X size={20} />
          </button>
        </div>

        {readonly ? (
          <div className="mt-5 space-y-5">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <p>
                <span className="field-label">Customer Name</span>
                <span className="mt-1 block text-sm font-semibold text-slate-900">
                  {sale.customerName || "N/A"}
                </span>
              </p>
              <p>
                <span className="field-label">Customer Phone</span>
                <span className="mt-1 block text-sm text-slate-800">
                  {sale.customerPhone || "N/A"}
                </span>
              </p>
              <p>
                <span className="field-label">Category</span>
                <span className="mt-1 block text-sm text-slate-800">{sale.category || "N/A"}</span>
              </p>
              <p>
                <span className="field-label">Location</span>
                <span className="mt-1 block text-sm text-slate-800">{sale.location || "N/A"}</span>
              </p>
              <p>
                <span className="field-label">Sale Date & Time</span>
                <span className="mt-1 block text-sm text-slate-800">
                  {formatDate(saleDateTime)} | {formatTime(saleDateTime)}
                </span>
              </p>
              <p>
                <span className="field-label">Created By</span>
                <span className="mt-1 block text-sm text-slate-800">{sale.createdBy || "N/A"}</span>
              </p>
            </div>

            <ProductsTable products={getSaleProducts(sale)} />

            {sale.remarks && (
              <div>
                <span className="field-label">Remarks</span>
                <p className="mt-2 rounded-lg bg-slate-50 p-4 text-sm leading-6 text-slate-700">
                  {sale.remarks}
                </p>
              </div>
            )}

            <div className="rounded-xl border border-green-200 bg-green-50 p-4">
              <span className="field-label text-green-800">Total Amount</span>
              <p className="mt-2 text-2xl font-bold text-green-900">
                {formatCurrency(sale.totalAmount)}
              </p>
            </div>
          </div>
        ) : (
          <form onSubmit={onSave} className="mt-5 space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <label>
                <span className="field-label">Customer Name</span>
                <input
                  className="field-input"
                  value={form.customerName}
                  onChange={(event) => setForm({ ...form, customerName: event.target.value })}
                  required
                />
              </label>
              <label>
                <span className="field-label">Customer Phone</span>
                <input
                  className="field-input"
                  value={form.customerPhone}
                  onChange={(event) => setForm({ ...form, customerPhone: event.target.value })}
                />
              </label>
              <label>
                <span className="field-label">Location</span>
                <input
                  className="field-input"
                  value={form.location}
                  onChange={(event) => setForm({ ...form, location: event.target.value })}
                  required
                />
              </label>
              <label>
                <span className="field-label">Sale Date & Time</span>
                <input
                  type="datetime-local"
                  className="field-input"
                  value={form.saleDateTime}
                  onChange={(event) => setForm({ ...form, saleDateTime: event.target.value })}
                />
              </label>
              <div className="rounded-xl border border-green-200 bg-green-50 p-4">
                <span className="field-label text-green-800">Backend Calculated Total</span>
                <p className="mt-2 text-2xl font-bold text-green-900">
                  {formatCurrency(sale.totalAmount)}
                </p>
              </div>
            </div>

            <EditableProducts
              products={form.products}
              categories={categories}
              onChange={updateProduct}
              onAdd={addProduct}
              onRemove={removeProduct}
            />

            <label className="block">
              <span className="field-label">Remarks</span>
              <textarea
                className="field-input min-h-28"
                value={form.remarks}
                onChange={(event) => setForm({ ...form, remarks: event.target.value })}
              />
            </label>

            <div className="flex flex-col gap-3 sm:flex-row">
              <button type="submit" disabled={saving} className="primary-button">
                {saving ? "Updating..." : "Update Sale"}
              </button>
              <button type="button" onClick={onClose} className="secondary-button">
                Cancel
              </button>
            </div>
          </form>
        )}
      </section>
    </div>
  );
}

function SalesHistory() {
  const notification = useNotification();
  const [sales, setSales] = useState([]);
  const [categories, setCategories] = useState([]);
  const [meta, setMeta] = useState({ page: 0, size: 10, totalPages: 0, totalElements: 0 });
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("saleDateTime");
  const [sortDir, setSortDir] = useState("desc");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [modal, setModal] = useState({ mode: "", sale: null });
  const [editForm, setEditForm] = useState(emptySaleForm);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const response = await api.get("/categories");
        setCategories(asArray(response.data).filter((category) => category.active !== false));
      } catch (error) {
        notification.error(getErrorMessage(error, "Unable to Load Categories"));
      }
    };

    loadCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadSales = useCallback(async (page = 0) => {
    setLoading(true);
    try {
      const response = await api.get("/sales", {
        params: {
          page,
          size: meta.size,
          sortBy,
          sortDir,
          search: search || undefined,
        },
      });
      const sortedSales = sortByDateTimeDesc(asArray(response.data), (sale) => getSaleDateTime(sale));
      setSales(sortedSales);
      setMeta({
        page: response.data.page ?? response.data.number ?? page,
        size: response.data.size ?? meta.size,
        totalPages: response.data.totalPages ?? 0,
        totalElements: response.data.totalElements ?? sortedSales.length,
      });
    } catch (error) {
      notification.error(getErrorMessage(error, "Unable to Load Sales"));
    } finally {
      setLoading(false);
    }
  }, [meta.size, notification, search, sortBy, sortDir]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadSales(0);
  }, [loadSales]);

  const openView = (sale) => setModal({ mode: "view", sale });

  const openEdit = (sale) => {
    setEditForm(saleToForm(sale, toDateTimeLocalValue(getSaleDateTime(sale))));
    setModal({ mode: "edit", sale });
  };

  const closeModal = () => {
    setModal({ mode: "", sale: null });
    setEditForm(emptySaleForm);
  };

  const updateSale = async (event) => {
    event.preventDefault();
    const validationMessage = validateSaleForm(editForm);
    if (validationMessage) {
      notification.warning(validationMessage);
      return;
    }

    setSaving(true);
    try {
      const payload = buildSalePayload(editForm, toBackendDateTime(editForm.saleDateTime));
      await api.put(`/sales/${modal.sale.id}`, payload);
      notification.success("Sale Updated Successfully");
      closeModal();
      await loadSales(meta.page);
    } catch (error) {
      notification.error(getErrorMessage(error, "Unable to Update Sale"));
    } finally {
      setSaving(false);
    }
  };

  const deleteSale = async (sale) => {
    if (!window.confirm(`Delete sale #${sale.id}?`)) return;

    try {
      await api.delete(`/sales/${sale.id}`);
      notification.success("Sale Deleted Successfully");
      await loadSales(meta.page);
    } catch (error) {
      notification.error(getErrorMessage(error, "Unable to Delete Sale"));
    }
  };

  const exportSales = async () => {
    setExporting(true);
    try {
      // Export honors the current search/sort, but ignores pagination so
      // the whole matching result set is included, not just this page.
      const response = await api.get("/sales", {
        params: {
          page: 0,
          size: 5000,
          sortBy,
          sortDir,
          search: search || undefined,
        },
      });

      const allSales = sortByDateTimeDesc(asArray(response.data), (sale) => getSaleDateTime(sale));

      if (!allSales.length) {
        notification.warning("No Sales to Export");
        return;
      }

      exportToCsv(
        `sales-history-${new Date().toISOString().slice(0, 10)}.csv`,
        [
          {
            key: "dateTime",
            header: "Sale Date & Time",
            value: (sale) => {
              const value = getSaleDateTime(sale);
              return `${formatDate(value)} ${formatTime(value)}`;
            },
          },
          { key: "customerName", header: "Customer" },
          { key: "customerPhone", header: "Phone" },
          { key: "category", header: "Category" },
          { key: "location", header: "Location" },
          { key: "products", header: "Number of Products", value: (sale) => getSaleProductCount(sale) },
          { key: "totalAmount", header: "Total Amount", value: (sale) => sale.totalAmount ?? 0 },
          { key: "createdBy", header: "Created By" },
          { key: "remarks", header: "Remarks" },
        ],
        allSales,
      );

      notification.success(`Exported ${allSales.length} Sales`);
    } catch (error) {
      notification.error(getErrorMessage(error, "Unable to Export Sales"));
    } finally {
      setExporting(false);
    }
  };

  const columns = [
    {
      key: "dateTime",
      header: "Sale Date & Time",
      render: (sale) => {
        const value = getSaleDateTime(sale);
        return `${formatDate(value)} | ${formatTime(value)}`;
      },
    },
    { key: "customer", header: "Customer", render: (sale) => sale.customerName || "N/A" },
    { key: "category", header: "Category", render: (sale) => sale.category || "N/A" },
    { key: "location", header: "Location", render: (sale) => sale.location || "N/A" },
    {
      key: "products",
      header: "Number Of Products",
      render: (sale) => getSaleProductCount(sale),
    },
    { key: "amount", header: "Total Amount", render: (sale) => formatCurrency(sale.totalAmount) },
    {
      key: "actions",
      header: "Actions",
      render: (sale) => (
        <div className="flex items-center justify-end gap-2 md:justify-start">
          <button type="button" onClick={() => openView(sale)} className="rounded-lg border border-slate-200 bg-slate-50 p-2 text-slate-700 transition hover:bg-slate-100" title="View"><Eye size={16} /></button>
          <button type="button" onClick={() => openEdit(sale)} className="rounded-lg border border-blue-200 bg-blue-50 p-2 text-blue-700 transition hover:bg-blue-100" title="Edit"><Pencil size={16} /></button>
          <button type="button" onClick={() => deleteSale(sale)} className="rounded-lg border border-red-200 bg-red-50 p-2 text-red-700 transition hover:bg-red-100" title="Delete"><Trash2 size={16} /></button>
        </div>
      ),
    },
  ];

  return (
    <MainLayout>
      <div className="page-stack">
        <section className="section-card">
          <div className="grid gap-4 lg:grid-cols-[1fr_auto_auto_auto] lg:items-end">
            <div>
              <h3 className="page-heading">Sales History</h3>
              <p className="muted-text mt-1">Search, sort, view, edit, and soft-delete showroom sales.</p>
            </div>
            <input
              className="field-input mt-0"
              placeholder="Search sales"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
            <div className="grid grid-cols-2 gap-2">
              <select className="field-input mt-0" value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
                <option value="saleDateTime">Sale Date</option>
                <option value="totalAmount">Amount</option>
                <option value="customerName">Customer</option>
                <option value="category">Category</option>
                <option value="location">Location</option>
                <option value="createdAt">Created</option>
              </select>
              <select className="field-input mt-0" value={sortDir} onChange={(event) => setSortDir(event.target.value)}>
                <option value="desc">Newest</option>
                <option value="asc">Oldest</option>
              </select>
            </div>
            <button
              type="button"
              onClick={exportSales}
              disabled={exporting}
              className="secondary-button inline-flex items-center justify-center gap-2 whitespace-nowrap"
            >
              <Download size={16} />
              {exporting ? "Exporting..." : "Export CSV"}
            </button>
          </div>
        </section>

        {loading ? (
          <LoadingSpinner label="Loading Sales..." />
        ) : (
          <>
            <DataTable columns={columns} data={sales} emptyMessage="No Sales Available" />
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-slate-500">{meta.totalElements} sales found</p>
              <div className="flex gap-2">
                <button type="button" className="secondary-button" disabled={meta.page <= 0} onClick={() => loadSales(meta.page - 1)}>Previous</button>
                <span className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm">Page {meta.page + 1} of {Math.max(meta.totalPages, 1)}</span>
                <button type="button" className="secondary-button" disabled={meta.page + 1 >= meta.totalPages} onClick={() => loadSales(meta.page + 1)}>Next</button>
              </div>
            </div>
          </>
        )}

        <SaleModal
          mode={modal.mode}
          sale={modal.sale}
          form={editForm}
          setForm={setEditForm}
          categories={categories}
          onClose={closeModal}
          onSave={updateSale}
          saving={saving}
        />
      </div>
    </MainLayout>
  );
}

export default SalesHistory;
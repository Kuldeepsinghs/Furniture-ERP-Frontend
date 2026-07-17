import { useEffect, useState } from "react";
import { PlusCircle, Trash2 } from "lucide-react";
import api from "../../api/axios";
import MainLayout from "../../layouts/MainLayout";
import { useNotification } from "../../hooks/useNotification";
import { getErrorMessage } from "../../utils/errors";
import { toBackendDateTime } from "../../utils/dateInput";
import { asArray, formatCurrency } from "../../utils/format";
import {
  buildSalePayload,
  emptySaleForm,
  emptySaleProduct,
  validateSaleForm,
} from "../../utils/sales";

function ProductRows({ products, categories, onChange, onAdd, onRemove }) {
  return (
    <div className="space-y-3">
      <div className="hidden rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold uppercase tracking-[0.16em] text-slate-500 md:grid md:grid-cols-[1.2fr_1fr_0.7fr_0.9fr_auto] md:gap-3">
        <span>Product Name</span>
        <span>Category</span>
        <span>Quantity</span>
        <span>Price</span>
        <span className="sr-only">Action</span>
      </div>

      {products.map((product, index) => (
        <div
          key={index}
          className="grid gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm md:grid-cols-[1.2fr_1fr_0.7fr_0.9fr_auto] md:items-end"
        >
          <label>
            <span className="field-label md:hidden">Product Name</span>
            <input
              className="field-input"
              value={product.productName}
              onChange={(event) => onChange(index, "productName", event.target.value)}
              placeholder="Bahubali Sofa"
              required
            />
          </label>
          <label>
            <span className="field-label md:hidden">Category</span>
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
            <span className="field-label md:hidden">Quantity</span>
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
            <span className="field-label md:hidden">Price</span>
            <input
              type="number"
              min="0"
              step="0.01"
              className="field-input"
              value={product.price}
              onChange={(event) => onChange(index, "price", event.target.value)}
              placeholder="0"
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

function SalesForm() {
  const notification = useNotification();
  const [form, setForm] = useState(emptySaleForm);
  const [categories, setCategories] = useState([]);
  const [savedTotal, setSavedTotal] = useState(null);
  const [submitting, setSubmitting] = useState(false);

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

  const updateField = (name, value) => {
    setForm((current) => ({ ...current, [name]: value }));
  };

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

  const clearForm = () => {
    setForm(emptySaleForm);
    setSavedTotal(null);
  };

  const submit = async (event) => {
    event.preventDefault();
    const validationMessage = validateSaleForm(form);

    if (validationMessage) {
      notification.warning(validationMessage);
      return;
    }

    setSubmitting(true);

    try {
      const payload = buildSalePayload(form, toBackendDateTime(form.saleDateTime));
      const response = await api.post("/sales", payload);
      setSavedTotal(response.data?.totalAmount ?? null);
      setForm(emptySaleForm);
      notification.success("Sale Created Successfully");
    } catch (error) {
      notification.error(getErrorMessage(error, "Unable to Create Sale"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <MainLayout>
      <div className="page-stack">
        <section className="section-card">
          <div className="border-b border-slate-200 pb-5">
            <h3 className="page-heading">Add Sale</h3>
            <p className="muted-text mt-1">
              Capture customer, location, and product details. Total amount is calculated by the backend.
            </p>
          </div>

          <form onSubmit={submit} className="mt-5 space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <label>
                <span className="field-label">Customer Name</span>
                <input
                  className="field-input"
                  value={form.customerName}
                  onChange={(event) => updateField("customerName", event.target.value)}
                  placeholder="Customer name"
                  required
                />
              </label>
              <label>
                <span className="field-label">Customer Phone</span>
                <input
                  className="field-input"
                  value={form.customerPhone}
                  onChange={(event) => updateField("customerPhone", event.target.value)}
                  placeholder="Optional"
                />
              </label>
              <label>
                <span className="field-label">Location</span>
                <input
                  className="field-input"
                  value={form.location}
                  onChange={(event) => updateField("location", event.target.value)}
                  placeholder="Main Showroom"
                  required
                />
              </label>
              <label>
                <span className="field-label">Sale Date & Time</span>
                <input
                  type="datetime-local"
                  className="field-input"
                  value={form.saleDateTime}
                  onChange={(event) => updateField("saleDateTime", event.target.value)}
                />
              </label>
              <div className="rounded-xl border border-green-200 bg-green-50 p-4">
                <span className="field-label text-green-800">Backend Calculated Total</span>
                <p className="mt-2 text-2xl font-bold text-green-900">
                  {savedTotal === null ? "Calculated after save" : formatCurrency(savedTotal)}
                </p>
              </div>
            </div>

            <section>
              <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h4 className="text-base font-bold text-slate-950">Products</h4>
                  <p className="text-sm text-slate-500">
                    Add each item with its own category - a sale can mix categories (e.g. a sofa and a cot).
                  </p>
                </div>
              </div>
              <ProductRows
                products={form.products}
                categories={categories}
                onChange={updateProduct}
                onAdd={addProduct}
                onRemove={removeProduct}
              />
            </section>

            <label className="block">
              <span className="field-label">Remarks</span>
              <textarea
                className="field-input min-h-32"
                value={form.remarks}
                onChange={(event) => updateField("remarks", event.target.value)}
                placeholder="Delivery notes, customer preferences, or payment context"
              />
            </label>

            <div className="flex flex-col gap-3 sm:flex-row">
              <button type="submit" disabled={submitting} className="primary-button">
                {submitting ? "Saving..." : "Save Sale"}
              </button>
              <button type="button" onClick={clearForm} className="secondary-button">
                Clear
              </button>
            </div>
          </form>
        </section>
      </div>
    </MainLayout>
  );
}

export default SalesForm;
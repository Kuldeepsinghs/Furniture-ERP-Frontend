import { getSaleDateTime } from "./format";

const dayLabel = (date) =>
  date.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });

/**
 * Builds one entry per calendar day between the sales' min/max dates
 * (inclusive), so days with zero sales still show up as a zero bar.
 */
export const buildRevenueTrend = (sales) => {
  if (!sales.length) return [];

  const byDay = new Map();

  sales.forEach((sale) => {
    const date = new Date(getSaleDateTime(sale));
    if (Number.isNaN(date.getTime())) return;

    const key = date.toISOString().slice(0, 10);
    const existing = byDay.get(key) ?? 0;
    byDay.set(key, existing + Number(sale.totalAmount ?? 0));
  });

  const days = [...byDay.keys()].sort();
  if (!days.length) return [];

  const start = new Date(days[0]);
  const end = new Date(days[days.length - 1]);
  const result = [];

  // Cap at 60 points so a huge custom range doesn't render a wall of bars.
  const msPerDay = 24 * 60 * 60 * 1000;
  const totalDays = Math.round((end - start) / msPerDay) + 1;
  const step = totalDays > 60 ? Math.ceil(totalDays / 60) : 1;

  for (let cursor = new Date(start); cursor <= end; cursor.setDate(cursor.getDate() + step)) {
    const key = cursor.toISOString().slice(0, 10);
    let revenue = 0;

    for (let i = 0; i < step; i += 1) {
      const dayKey = new Date(cursor);
      dayKey.setDate(dayKey.getDate() + i);
      revenue += byDay.get(dayKey.toISOString().slice(0, 10)) ?? 0;
    }

    result.push({ label: dayLabel(new Date(key)), revenue });
  }

  return result;
};

/**
 * Groups revenue by product category, at the product-line level (not the
 * whole-sale level) - a single sale can mix categories (e.g. a sofa and a
 * cot), so each product line contributes only its own price*quantity to
 * its own category, matching how the backend's dashboard/report
 * aggregation works. Category matching is case-insensitive to tolerate any
 * older free-text data.
 */
export const buildProductCategoryBreakdown = (sales, maxSlices = 6) => {
  const totals = new Map();
  const labels = new Map();

  sales.forEach((sale) => {
    const products = Array.isArray(sale.products) ? sale.products : [];

    products.forEach((product) => {
      const rawCategory = (product.category || "Unspecified").trim();
      const key = rawCategory.toLowerCase();
      const lineTotal = Number(product.price ?? 0) * Number(product.quantity ?? 0);

      totals.set(key, (totals.get(key) ?? 0) + lineTotal);
      if (!labels.has(key)) labels.set(key, rawCategory);
    });
  });

  const sorted = [...totals.entries()]
    .filter(([, value]) => value > 0)
    .sort((a, b) => b[1] - a[1])
    .map(([key, value]) => ({ label: labels.get(key), value }));

  if (sorted.length <= maxSlices) return sorted;

  const top = sorted.slice(0, maxSlices - 1);
  const otherTotal = sorted.slice(maxSlices - 1).reduce((sum, entry) => sum + entry.value, 0);

  return [...top, { label: "Other", value: otherTotal }];
};

/**
 * Groups sales revenue by an arbitrary field (category, location, ...),
 * sorted descending, with the smallest entries folded into "Other" so the
 * chart stays readable.
 */
export const buildRevenueBreakdown = (sales, getKey, maxSlices = 6) => {
  const totals = new Map();

  sales.forEach((sale) => {
    const key = getKey(sale) || "Unspecified";
    totals.set(key, (totals.get(key) ?? 0) + Number(sale.totalAmount ?? 0));
  });

  const sorted = [...totals.entries()]
    .filter(([, value]) => value > 0)
    .sort((a, b) => b[1] - a[1])
    .map(([label, value]) => ({ label, value }));

  if (sorted.length <= maxSlices) return sorted;

  const top = sorted.slice(0, maxSlices - 1);
  const otherTotal = sorted.slice(maxSlices - 1).reduce((sum, entry) => sum + entry.value, 0);

  return [...top, { label: "Other", value: otherTotal }];
};
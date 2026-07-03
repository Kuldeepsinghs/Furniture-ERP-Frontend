export const emptySaleProduct = {
  productName: "",
  quantity: 1,
  price: "",
};

export const emptySaleForm = {
  customerName: "",
  customerPhone: "",
  category: "",
  location: "",
  products: [{ ...emptySaleProduct }],
  remarks: "",
  saleDateTime: "",
};

export function getSaleProducts(sale) {
  return Array.isArray(sale?.products) ? sale.products : [];
}

export function getSaleProductCount(sale) {
  return getSaleProducts(sale).reduce(
    (sum, product) => sum + Number(product.quantity ?? 0),
    0,
  );
}

export function saleToForm(sale, saleDateTimeValue) {
  const products = getSaleProducts(sale);

  return {
    customerName: sale.customerName ?? "",
    customerPhone: sale.customerPhone ?? "",
    category: sale.category ?? "",
    location: sale.location ?? "",
    products: products.length
      ? products.map((product) => ({
          productName: product.productName ?? "",
          quantity: product.quantity ?? 1,
          price: product.price ?? "",
        }))
      : [{ ...emptySaleProduct }],
    remarks: sale.remarks ?? "",
    saleDateTime: saleDateTimeValue ?? "",
  };
}

export function validateSaleForm(form) {
  if (!form.customerName.trim()) return "Customer Name is required";
  if (!form.category.trim()) return "Category is required";
  if (!form.location.trim()) return "Location is required";

  if (!form.products.length) return "At least one product is required";

  for (const [index, product] of form.products.entries()) {
    const line = index + 1;
    if (!product.productName.trim()) return `Product Name is required for row ${line}`;
    if (Number(product.quantity) <= 0) return `Quantity must be greater than 0 for row ${line}`;
    if (Number(product.price) <= 0) return `Price must be greater than 0 for row ${line}`;
  }

  return "";
}

export function buildSalePayload(form, saleDateTime) {
  const payload = {
    customerName: form.customerName,
    customerPhone: form.customerPhone || null,
    category: form.category,
    location: form.location,
    products: form.products.map((product) => ({
      productName: product.productName,
      quantity: Number(product.quantity),
      price: Number(product.price),
    })),
    remarks: form.remarks,
  };

  if (saleDateTime) payload.saleDateTime = saleDateTime;

  return payload;
}

export const getName = (value, fallback = "-") => {
  if (!value) return fallback;
  if (typeof value === "string" || typeof value === "number") return value;

  return (
    value.name ??
    value.designName ??
    value.categoryName ??
    value.rateTypeName ??
    value.title ??
    value.workerName ??
    value.showroomName ??
    fallback
  );
};

export const formatDate = (value) => {
  if (!value) return "N/A";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "N/A";

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

export const formatTime = (value) => {
  if (!value) return "N/A";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "N/A";

  return date.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const formatCurrency = (value) => {
  const amount = Number(value ?? 0);

  return amount.toLocaleString("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  });
};

export const asArray = (value) => {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.content)) return value.content;
  if (Array.isArray(value?.items)) return value.items;
  return [];
};

const toTime = (value) => {
  const time = new Date(value ?? 0).getTime();
  return Number.isNaN(time) ? 0 : time;
};

export const sortByDateTimeDesc = (items, getValue) =>
  [...asArray(items)].sort((first, second) => toTime(getValue(second)) - toTime(getValue(first)));

export const getShipmentDateTime = (shipment) =>
  shipment?.shipmentDateTime ??
  shipment?.shipmentDate ??
  shipment?.createdAt ??
  shipment?.date;

export const getPaymentDateTime = (payment) =>
  payment?.paymentDateTime ??
  payment?.paidAt ??
  payment?.paymentDate ??
  payment?.createdAt ??
  payment?.date;

export const getWorkEntryDateTime = (entry) =>
  entry?.workDateTime ??
  entry?.workDate ??
  entry?.createdAt ??
  entry?.date;

export const getUpdatedDateTime = (record) =>
  record?.updatedAt ??
  record?.lastUpdated ??
  record?.createdAt ??
  record?.date;

export const getSaleDateTime = (sale) =>
  sale?.saleDateTime ??
  sale?.createdAt ??
  sale?.updatedAt ??
  sale?.date;

export const getShipmentItems = (shipment) =>
  asArray(shipment?.items ?? shipment?.shipmentItems ?? shipment?.products);

export const getShipmentItemName = (item) =>
  item?.productName ??
  item?.designName ??
  getName(item?.product, undefined) ??
  getName(item?.design, undefined) ??
  getName(item?.readyStock?.design, undefined) ??
  getName(item?.readyStock, undefined) ??
  "-";

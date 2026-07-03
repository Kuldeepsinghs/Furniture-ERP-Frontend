import MasterDataPage from "../components/MasterDataPage";
import { formatCurrency, getName } from "../utils/format";

function ProductRates() {
  return (
    <MasterDataPage
      title="Product Rates"
      description="Optional design-specific rate overrides."
      endpoint="/product-rates"
      successMessage="Product Rate saved successfully."
      failureMessage="Failed to save product rate."
      infoBanner="If no override exists, default rates from Rate Type will be used."
      defaultValues={{ designId: "", rateTypeId: "", carpenterRateOverride: "", polisherRateOverride: "" }}
      dependencies={[
        { key: "designs", endpoint: "/designs" },
        { key: "rateTypes", endpoint: "/rate-types" },
      ]}
      fields={[
        {
          name: "designId",
          label: "Design",
          type: "select",
          optionsKey: "designs",
          required: true,
          optionLabel: (option) => option.designName ?? option.name,
        },
        {
          name: "rateTypeId",
          label: "Rate Type",
          type: "select",
          optionsKey: "rateTypes",
          required: true,
        },
        { name: "carpenterRateOverride", label: "Carpenter Rate Override", type: "number", min: "0", step: "0.01", placeholder: "Optional" },
        { name: "polisherRateOverride", label: "Polisher Rate Override", type: "number", min: "0", step: "0.01", placeholder: "Optional" },
      ]}
      columns={[
        { key: "design", header: "Design", render: (row) => getName(row.design ?? row.designName) },
        { key: "rateType", header: "Rate Type", render: (row) => getName(row.rateType ?? row.rateTypeName) },
        { key: "carpenterRateOverride", header: "Carpenter Override", render: (row) => row.carpenterRateOverride == null ? "N/A" : formatCurrency(row.carpenterRateOverride) },
        { key: "polisherRateOverride", header: "Polisher Override", render: (row) => row.polisherRateOverride == null ? "N/A" : formatCurrency(row.polisherRateOverride) },
      ]}
      buildPayload={(form) => ({
        designId: Number(form.designId),
        rateTypeId: Number(form.rateTypeId),
        carpenterRateOverride: form.carpenterRateOverride === "" ? null : Number(form.carpenterRateOverride),
        polisherRateOverride: form.polisherRateOverride === "" ? null : Number(form.polisherRateOverride),
      })}
      validate={(form, { records, editingRecord }) => {
        if (form.carpenterRateOverride !== "" && Number(form.carpenterRateOverride) <= 0) {
          return "Amount must be greater than zero.";
        }
        if (form.polisherRateOverride !== "" && Number(form.polisherRateOverride) <= 0) {
          return "Amount must be greater than zero.";
        }
        if (form.carpenterRateOverride === "" && form.polisherRateOverride === "") {
          return "Enter at least one override amount.";
        }

        const exists = records.some((record) => {
          if (editingRecord && record.id === editingRecord.id) return false;
          const designId = String(record.design?.id ?? record.designId ?? "");
          const rateTypeId = String(record.rateType?.id ?? record.rateTypeId ?? "");

          return designId === String(form.designId) && rateTypeId === String(form.rateTypeId);
        });

        return exists ? "This Design + Rate Type combination already exists." : "";
      }}
      recordToForm={(record) => ({
        designId: String(record.design?.id ?? record.designId ?? ""),
        rateTypeId: String(record.rateType?.id ?? record.rateTypeId ?? ""),
        carpenterRateOverride: record.carpenterRateOverride ?? "",
        polisherRateOverride: record.polisherRateOverride ?? "",
      })}
    />
  );
}

export default ProductRates;

import MasterDataPage from "../components/MasterDataPage";

function RateTypes() {
  return (
    <MasterDataPage
      title="Rate Types"
      description="Define work pricing types used while recording production."
      endpoint="/rate-types"
      successMessage="Rate Type Added Successfully"
      failureMessage="Failed to save rate type."
      defaultValues={{
        name: "",
        defaultCarpenterRate: "",
        defaultPolisherRate: "",
        walnutExtra: "",
      }}
      fields={[
        { name: "name", label: "Name", placeholder: "Plain, Premium, Carving", required: true },
        { name: "defaultCarpenterRate", label: "Default Carpenter Rate", type: "number", min: "0", step: "0.01", placeholder: "0", required: true },
        { name: "defaultPolisherRate", label: "Default Polisher Rate", type: "number", min: "0", step: "0.01", placeholder: "0", required: true },
        { name: "walnutExtra", label: "Walnut Extra", type: "number", min: "0", step: "0.01", placeholder: "0", required: true },
      ]}
      columns={[
        { key: "name", header: "Name" },
        { key: "defaultCarpenterRate", header: "Carpenter Rate", currency: true },
        { key: "defaultPolisherRate", header: "Polisher Rate", currency: true },
        { key: "walnutExtra", header: "Walnut Extra", currency: true },
      ]}
      buildPayload={(form) => ({
        name: form.name,
        defaultCarpenterRate: Number(form.defaultCarpenterRate),
        defaultPolisherRate: Number(form.defaultPolisherRate),
        walnutExtra: Number(form.walnutExtra),
      })}
      validate={(form) => {
        if (Number(form.defaultCarpenterRate) < 0) return "Default carpenter rate cannot be negative.";
        if (Number(form.defaultPolisherRate) < 0) return "Default polisher rate cannot be negative.";
        if (Number(form.walnutExtra) < 0) return "Walnut extra cannot be negative.";
        return "";
      }}
      recordToForm={(record) => ({
        name: record.name ?? "",
        defaultCarpenterRate: record.defaultCarpenterRate ?? "",
        defaultPolisherRate: record.defaultPolisherRate ?? "",
        walnutExtra: record.walnutExtra ?? "",
      })}
    />
  );
}

export default RateTypes;

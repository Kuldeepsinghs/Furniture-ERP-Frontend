import MasterDataPage from "../components/MasterDataPage";
import { getName } from "../utils/format";

function Designs() {
  return (
    <MasterDataPage
      title="Designs"
      description="Maintain production designs and link them to categories."
      endpoint="/designs"
      successMessage="Design Added Successfully"
      failureMessage="Failed to save design."
      defaultValues={{ designName: "", categoryId: "", description: "" }}
      dependencies={[{ key: "categories", endpoint: "/categories" }]}
      fields={[
        { name: "designName", label: "Design Name", placeholder: "Classic teak chair", required: true },
        { name: "categoryId", label: "Category", type: "select", optionsKey: "categories", required: true },
        { name: "description", label: "Description", placeholder: "Optional design notes", span: "xl:col-span-2" },
      ]}
      columns={[
        { key: "designName", header: "Design", render: (row) => row.designName ?? row.name },
        { key: "category", header: "Category", render: (row) => getName(row.category ?? row.categoryName) },
        { key: "description", header: "Description" },
      ]}
      buildPayload={(form) => ({
        designName: form.designName,
        name: form.designName,
        categoryId: Number(form.categoryId),
        description: form.description,
      })}
    />
  );
}

export default Designs;

import MasterDataPage from "../components/MasterDataPage";

function Categories() {
  return (
    <MasterDataPage
      title="Categories"
      description="Group furniture designs into searchable production categories."
      endpoint="/categories"
      successMessage="Category Added Successfully"
      failureMessage="Failed to save category."
      defaultValues={{ name: "", description: "" }}
      fields={[
        { name: "name", label: "Category Name", placeholder: "Dining, Sofa, Bed", required: true },
        { name: "description", label: "Description", placeholder: "Optional description", span: "xl:col-span-2" },
      ]}
      columns={[
        { key: "name", header: "Category" },
        { key: "description", header: "Description" },
      ]}
      recordToForm={(record) => ({
        name: record.name ?? "",
        description: record.description ?? "",
      })}
    />
  );
}

export default Categories;

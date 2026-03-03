import SheetImportForm from "@/components/import/SheetImportForm";

export default function ImportPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-100">
          Import DSA Sheet
        </h1>
        <p className="mt-1 text-sm text-gray-400">
          Upload a CSV exported from Google Sheets to import problems.
          Existing problems are deduplicated by slug — only the sheet tag is added.
        </p>
      </div>
      <SheetImportForm />
    </div>
  );
}

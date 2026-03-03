import { getAllProblems } from "@/lib/problems";
import ImportTabs from "@/components/import/ImportTabs";

export default async function ImportPage() {
  const problems = await getAllProblems();

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">
          Import
        </h1>
      </div>
      <ImportTabs problems={problems} />
    </div>
  );
}

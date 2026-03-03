import { Suspense } from "react";
import { getAllProblems, getCategories, getSheets } from "@/lib/problems";
import ProblemBrowser from "@/components/practice/ProblemBrowser";

export default async function PracticePage() {
  const problems = await getAllProblems();
  const categories = await getCategories();
  const sheets = await getSheets();

  return (
    <div className="h-[calc(100vh-4rem)]">
      <Suspense>
        <ProblemBrowser problems={problems} categories={categories} sheets={sheets} />
      </Suspense>
    </div>
  );
}

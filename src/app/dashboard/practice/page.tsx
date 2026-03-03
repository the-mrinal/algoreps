import { Suspense } from "react";
import { getAllProblems, getCategories, getSheets } from "@/lib/problems";
import ProblemBrowser from "@/components/practice/ProblemBrowser";
import DesktopOnly from "@/components/dashboard/DesktopOnly";

export default async function PracticePage() {
  const problems = await getAllProblems();
  const categories = await getCategories();
  const sheets = await getSheets();

  return (
    <DesktopOnly>
      <div className="h-[calc(100vh-4rem)]">
        <Suspense>
          <ProblemBrowser problems={problems} categories={categories} sheets={sheets} />
        </Suspense>
      </div>
    </DesktopOnly>
  );
}

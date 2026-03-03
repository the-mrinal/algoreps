import { getAllProblems, getCategories } from "@/lib/problems";
import ProblemBrowser from "@/components/practice/ProblemBrowser";

export default function PracticePage() {
  const problems = getAllProblems();
  const categories = getCategories();

  return (
    <div className="h-[calc(100vh-4rem)]">
      <ProblemBrowser problems={problems} categories={categories} />
    </div>
  );
}

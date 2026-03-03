import { createClient } from "@/lib/supabase/server";
import { getAllProblems } from "@/lib/problems";
import RevisionQueue, {
  type DueRevision,
} from "@/components/srs/RevisionQueue";

export default async function DashboardHome() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: submissions } = await supabase
    .from("user_progress")
    .select(
      "id, problem_id, performance_score, created_at, topics, approach, remarks, code"
    )
    .eq("user_id", user.id)
    .lte("next_revision_date", new Date().toISOString())
    .order("created_at", { ascending: false });

  const problems = getAllProblems();
  const problemMap = new Map(problems.map((p) => [p.slug, p]));

  const dueRevisions: DueRevision[] = (submissions ?? []).map((sub) => {
    const problem = problemMap.get(sub.problem_id);
    return {
      id: sub.id,
      problem_id: sub.problem_id,
      performance_score: sub.performance_score,
      created_at: sub.created_at,
      problem_title: problem?.title ?? sub.problem_id,
      category: problem?.category ?? "Unknown",
      difficulty: problem?.difficulty ?? "Medium",
      topics: sub.topics ?? [],
      approach: sub.approach ?? null,
      remarks: sub.remarks ?? null,
      code: sub.code ?? null,
    };
  });

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
        Revision Queue
      </h1>
      <RevisionQueue dueRevisions={dueRevisions} />
    </div>
  );
}

import { getAllProblems } from "@/lib/problems";
import TrustModeForm from "@/components/logger/TrustModeForm";

export default async function LogPage() {
  const problems = await getAllProblems();

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">
          Log External Submission
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Track a problem you solved on LeetCode or elsewhere. Your submission
          will be added to your SRS revision schedule.
        </p>
      </div>
      <TrustModeForm problems={problems} />
    </div>
  );
}

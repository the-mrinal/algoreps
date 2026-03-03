import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="text-center space-y-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          DSA Dashboard
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Spaced repetition for mastering Data Structures & Algorithms
        </p>
        <Link
          href="/login"
          className="inline-block rounded-md bg-blue-600 px-6 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Sign In
        </Link>
      </div>
    </div>
  );
}

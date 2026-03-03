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
    <div className="min-h-screen flex items-center justify-center bg-[var(--background)] px-4">
      <div className="text-center space-y-6">
        <h1 className="text-4xl font-bold tracking-tight">
          <span className="text-foreground">Algo</span>
          <span className="text-neon-cyan text-glow-cyan">Reps</span>
        </h1>
        <div className="h-0.5 w-24 mx-auto bg-gradient-to-r from-neon-cyan/0 via-neon-cyan to-neon-cyan/0" />
        <p className="text-gray-500 dark:text-gray-400 max-w-xs mx-auto">
          Spaced repetition for mastering Data Structures & Algorithms
        </p>
        <Link
          href="/login"
          className="inline-block rounded-md border border-neon-cyan/50 bg-neon-cyan/10 px-6 py-2 text-sm font-medium text-neon-cyan hover:bg-neon-cyan/20 hover:shadow-glow-cyan focus:outline-none focus:ring-2 focus:ring-neon-cyan/50 transition-all"
        >
          Sign In
        </Link>
      </div>
    </div>
  );
}

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
    <div className="min-h-screen bg-[var(--background)] px-4">
      {/* Hero Section */}
      <section className="flex flex-col items-center justify-center min-h-[70vh] text-center">
        <h1 className="text-5xl md:text-6xl font-bold tracking-tight">
          <span className="text-foreground">Algo</span>
          <span className="text-neon-cyan text-glow-cyan">Reps</span>
        </h1>
        <div className="h-0.5 w-24 mx-auto mt-4 bg-gradient-to-r from-neon-cyan/0 via-neon-cyan to-neon-cyan/0" />
        <p className="mt-6 text-lg text-gray-400 max-w-md mx-auto">
          Spaced repetition for mastering Data Structures & Algorithms.
          <br />
          Stop forgetting what you solved last week.
        </p>
        <Link
          href="/login"
          className="mt-8 inline-block rounded-md border border-neon-cyan/50 bg-neon-cyan/10 px-8 py-3 text-base font-medium text-neon-cyan hover:bg-neon-cyan/20 hover:shadow-glow-cyan focus:outline-none focus:ring-2 focus:ring-neon-cyan/50 transition-all"
        >
          Get Started
        </Link>
      </section>

      {/* Problem Section */}
      <section className="max-w-3xl mx-auto py-16 space-y-12">
        <div className="text-center space-y-4">
          <h2 className="text-2xl md:text-3xl font-semibold text-foreground">
            The problem with grinding LeetCode
          </h2>
          <p className="text-gray-400 leading-relaxed max-w-2xl mx-auto">
            You solve 200+ problems, feel confident, then blank out in an
            interview on a problem you&apos;ve already done. Sound familiar?
            That&apos;s because{" "}
            <span className="text-neon-cyan">brute-force practice without review is wasted effort</span>.
            Research shows you forget ~70% of new material within 24 hours
            without reinforcement.
          </p>
        </div>

        {/* Feature Cards */}
        <div className="grid gap-6 md:grid-cols-3">
          <div className="rounded-lg border border-gray-800 bg-gray-900/50 p-6 space-y-3">
            <div className="text-neon-cyan text-2xl">&#x23F0;</div>
            <h3 className="text-lg font-medium text-foreground">
              Spaced Repetition Scheduling
            </h3>
            <p className="text-sm text-gray-400 leading-relaxed">
              Problems resurface at scientifically optimal intervals. Easy
              problems fade back; hard ones keep coming until they stick.
            </p>
          </div>

          <div className="rounded-lg border border-gray-800 bg-gray-900/50 p-6 space-y-3">
            <div className="text-neon-cyan text-2xl">&#x1F4CA;</div>
            <h3 className="text-lg font-medium text-foreground">
              Progress Dashboard
            </h3>
            <p className="text-sm text-gray-400 leading-relaxed">
              Track your coverage across topics like trees, graphs, DP, and
              more. See what&apos;s due, what&apos;s overdue, and where your weak spots
              are.
            </p>
          </div>

          <div className="rounded-lg border border-gray-800 bg-gray-900/50 p-6 space-y-3">
            <div className="text-neon-cyan text-2xl">&#x1F4E7;</div>
            <h3 className="text-lg font-medium text-foreground">
              Daily Review Reminders
            </h3>
            <p className="text-sm text-gray-400 leading-relaxed">
              Get a daily email with your review queue so you never lose
              momentum. Consistency beats intensity.
            </p>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="max-w-3xl mx-auto py-16 border-t border-gray-800 space-y-10">
        <h2 className="text-2xl md:text-3xl font-semibold text-foreground text-center">
          How it works
        </h2>
        <div className="space-y-6">
          {[
            {
              step: "01",
              title: "Import your problem set",
              desc: "Load problems from the curated NeetCode 150 / Blind 75 sheets, or add your own.",
            },
            {
              step: "02",
              title: "Solve & rate difficulty",
              desc: "After each attempt, rate how it went. The algorithm adjusts your next review date accordingly.",
            },
            {
              step: "03",
              title: "Review on schedule",
              desc: "Come back when problems are due. Over time, you build long-term retention instead of short-term memorization.",
            },
          ].map((item) => (
            <div key={item.step} className="flex gap-4 items-start">
              <span className="text-neon-cyan font-mono text-sm mt-1 shrink-0">
                {item.step}
              </span>
              <div>
                <h3 className="text-foreground font-medium">{item.title}</h3>
                <p className="text-sm text-gray-400 mt-1">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-3xl mx-auto py-16 border-t border-gray-800 text-center space-y-6">
        <h2 className="text-2xl md:text-3xl font-semibold text-foreground">
          Ready to retain what you practice?
        </h2>
        <p className="text-gray-400">
          Free and open-source. Sign in to start building real, lasting DSA
          fluency.
        </p>
        <Link
          href="/login"
          className="inline-block rounded-md border border-neon-cyan/50 bg-neon-cyan/10 px-8 py-3 text-base font-medium text-neon-cyan hover:bg-neon-cyan/20 hover:shadow-glow-cyan focus:outline-none focus:ring-2 focus:ring-neon-cyan/50 transition-all"
        >
          Sign In
        </Link>
      </section>

      <footer className="max-w-3xl mx-auto py-8 border-t border-gray-800 text-center text-xs text-gray-600">
        Built for engineers who are tired of re-solving the same problems.
      </footer>
    </div>
  );
}

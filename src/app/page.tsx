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
      {/* GitHub Link */}
      <div className="flex justify-end pt-4 max-w-5xl mx-auto">
        <a
          href="https://github.com/the-mrinal/algoreps"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-sm text-gray-400 hover:text-neon-cyan transition-colors"
        >
          <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
          </svg>
          Star on GitHub
        </a>
      </div>

      {/* Hero Section */}
      <section className="flex flex-col items-center justify-center pt-12 pb-12 text-center">
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
            <div className="text-neon-cyan text-2xl">&#x23F1;</div>
            <h3 className="text-lg font-medium text-foreground">
              Built-in Timer
            </h3>
            <p className="text-sm text-gray-400 leading-relaxed">
              Track how long each attempt takes with a live timer. Builds
              interview-pace awareness and logs time spent per problem
              automatically.
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
              desc: "NeetCode 150 and Blind 75 are already loaded. Import additional sheets or add your own problems anytime.",
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

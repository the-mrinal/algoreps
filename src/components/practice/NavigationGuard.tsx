"use client";

interface NavigationGuardProps {
  open: boolean;
  lastRunSuccess: boolean | null;
  onMarkSolved: () => void;
  onLeave: () => void;
  onStay: () => void;
}

export default function NavigationGuard({
  open,
  lastRunSuccess,
  onMarkSolved,
  onLeave,
  onStay,
}: NavigationGuardProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onStay} />
      <div className="relative z-10 w-full max-w-md rounded-lg border border-[var(--surface-border)] bg-[var(--surface)] p-6 shadow-xl">
        <h3 className="text-lg font-semibold text-foreground">
          Question Pending
        </h3>
        <p className="mt-2 text-sm text-gray-400">
          You haven&apos;t solved this problem yet. What would you like to do?
        </p>

        {lastRunSuccess !== null && (
          <div
            className={`mt-3 rounded-md px-3 py-2 text-xs font-medium ${
              lastRunSuccess
                ? "bg-green-500/10 text-green-400 border border-green-500/20"
                : "bg-red-500/10 text-red-400 border border-red-500/20"
            }`}
          >
            Last run: {lastRunSuccess ? "Passed" : "Failed"}
          </div>
        )}

        <div className="mt-5 flex flex-col gap-2">
          <button
            onClick={onMarkSolved}
            className="w-full rounded-md bg-neon-cyan/20 px-4 py-2 text-sm font-medium text-neon-cyan hover:bg-neon-cyan/30 transition-colors"
          >
            Mark Solved &amp; Continue
          </button>
          <button
            onClick={onLeave}
            className="w-full rounded-md border border-[var(--surface-border)] px-4 py-2 text-sm font-medium text-gray-400 hover:text-foreground hover:bg-white/5 transition-colors"
          >
            Leave Without Solving
          </button>
          <button
            onClick={onStay}
            className="w-full rounded-md border border-[var(--surface-border)] px-4 py-2 text-sm font-medium text-gray-400 hover:text-foreground hover:bg-white/5 transition-colors"
          >
            Stay
          </button>
        </div>
      </div>
    </div>
  );
}

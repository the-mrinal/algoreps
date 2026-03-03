"use client";

export default function DesktopOnly({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div className="hidden md:contents">{children}</div>
      <div className="flex md:hidden flex-col items-center justify-center h-[60vh] text-center px-6">
        <svg className="h-12 w-12 text-gray-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
        <h2 className="text-lg font-semibold text-foreground mb-2">Desktop Only</h2>
        <p className="text-sm text-gray-400 max-w-xs">
          This page is optimized for larger screens. Please open it on a desktop or tablet for the best experience.
        </p>
      </div>
    </>
  );
}

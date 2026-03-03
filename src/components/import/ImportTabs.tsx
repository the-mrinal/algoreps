"use client";

import { useState } from "react";
import type { Problem } from "@/types";
import TrustModeForm from "@/components/logger/TrustModeForm";
import SheetImportForm from "@/components/import/SheetImportForm";

const TABS = [
  { key: "log", label: "Log Submission" },
  { key: "sheet", label: "Import Sheet" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

export default function ImportTabs({ problems }: { problems: Problem[] }) {
  const [activeTab, setActiveTab] = useState<TabKey>("log");

  return (
    <div>
      {/* Tab bar */}
      <div className="flex border-b border-[var(--surface-border)] mb-6">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2.5 text-sm font-medium transition-colors relative ${
              activeTab === tab.key
                ? "text-neon-cyan"
                : "text-gray-400 hover:text-foreground"
            }`}
          >
            {tab.label}
            {activeTab === tab.key && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-neon-cyan shadow-[0_0_8px_rgba(0,255,242,0.4)]" />
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === "log" ? (
        <div>
          <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
            Track a problem you solved on LeetCode or elsewhere. Your submission
            will be added to your SRS revision schedule.
          </p>
          <TrustModeForm problems={problems} />
        </div>
      ) : (
        <div>
          <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
            Upload a CSV exported from Google Sheets to import problems.
            Existing problems are deduplicated by slug — only the sheet tag is added.
          </p>
          <SheetImportForm />
        </div>
      )}
    </div>
  );
}

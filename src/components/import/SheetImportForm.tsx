"use client";

import { useState, useRef } from "react";

const PRESET_SHEETS = [
  { value: "striver-sde", label: "Striver SDE Sheet" },
  { value: "neetcode-150", label: "NeetCode 150" },
  { value: "blind-75", label: "Blind 75" },
  { value: "grind-75", label: "Grind 75" },
];

interface ImportResult {
  imported: number;
  updated: number;
  errors: string[];
}

export default function SheetImportForm() {
  const [sheetName, setSheetName] = useState("");
  const [customSheet, setCustomSheet] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const effectiveSheetName = sheetName === "__custom" ? customSheet.trim() : sheetName;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setResult(null);

    if (!effectiveSheetName) {
      setError("Please select or enter a sheet name.");
      return;
    }
    if (!file) {
      setError("Please select a CSV file.");
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("sheet_name", effectiveSheetName);

      const res = await fetch("/api/import-problems", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const body = await res.json();
        setError(body.error || "Import failed");
        return;
      }

      const data: ImportResult = await res.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Import failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Sheet Name */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">
          Sheet Name
        </label>
        <select
          value={sheetName}
          onChange={(e) => setSheetName(e.target.value)}
          className="w-full rounded-md border border-gray-600 bg-gray-700 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Select a sheet...</option>
          {PRESET_SHEETS.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
          <option value="__custom">Custom...</option>
        </select>

        {sheetName === "__custom" && (
          <input
            type="text"
            placeholder="e.g. love-babbar-450"
            value={customSheet}
            onChange={(e) => setCustomSheet(e.target.value)}
            className="mt-2 w-full rounded-md border border-gray-600 bg-gray-700 px-3 py-2 text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        )}
      </div>

      {/* CSV File */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">
          CSV File
        </label>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="rounded-md border border-gray-600 bg-gray-700 px-4 py-2 text-sm text-gray-300 hover:bg-gray-600 transition-colors"
          >
            Choose File
          </button>
          <span className="text-sm text-gray-400 truncate">
            {file ? file.name : "No file selected"}
          </span>
          <input
            ref={fileRef}
            type="file"
            accept=".csv"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="hidden"
          />
        </div>
        <p className="mt-1 text-xs text-gray-500">
          Expected columns: title, slug, difficulty, category, topics (semicolon-separated), leetcode_url
        </p>
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
      >
        {loading ? "Importing..." : "Import"}
      </button>

      {/* Error */}
      {error && (
        <div className="rounded-md bg-red-900/50 border border-red-700 p-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="rounded-md bg-gray-800 border border-gray-700 p-4 space-y-2">
          <h3 className="text-sm font-semibold text-white">Import Results</h3>
          <div className="flex gap-4 text-sm">
            <span className="text-green-400">
              {result.imported} new
            </span>
            <span className="text-blue-400">
              {result.updated} updated
            </span>
            {result.errors.length > 0 && (
              <span className="text-red-400">
                {result.errors.length} error{result.errors.length !== 1 ? "s" : ""}
              </span>
            )}
          </div>
          {result.errors.length > 0 && (
            <div className="mt-2 max-h-40 overflow-y-auto text-xs text-red-300 space-y-1">
              {result.errors.map((err, i) => (
                <p key={i}>{err}</p>
              ))}
            </div>
          )}
        </div>
      )}
    </form>
  );
}

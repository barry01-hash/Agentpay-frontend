"use client";

import { useEffect, useState } from "react";
import { apiGet } from "@/lib/apiClient";

type Entry = { version: string; date: string; notes: string[] };

export default function ChangelogPage() {
  const [entries, setEntries] = useState<Entry[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiGet<{ entries: Entry[] }>("/api/v1/changelog")
      .then((b) => setEntries(b.entries))
      .catch((e) => setError(e.message));
  }, []);

  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="mx-auto flex min-h-[60vh] max-w-3xl flex-col gap-6 p-8 focus:outline-none"
    >
      <h1 className="text-3xl font-semibold tracking-tight">Changelog</h1>
      {error && (
        <p role="alert" className="text-sm text-rose-600">
          {error}
        </p>
      )}
      {entries && (
        <ol className="flex flex-col gap-6">
          {entries.map((e) => (
            <li key={e.version} className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
              <h2 className="text-lg font-semibold">
                {e.version} <span className="text-sm text-zinc-500">— {e.date}</span>
              </h2>
              <ul className="mt-2 list-inside list-disc text-sm text-zinc-700 dark:text-zinc-300">
                {e.notes.map((n, i) => (
                  <li key={i}>{n}</li>
                ))}
              </ul>
            </li>
          ))}
        </ol>
      )}
    </main>
  );
}

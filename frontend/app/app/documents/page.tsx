"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { listMyDocuments, type SavedDocumentSummary } from "@/lib/documents";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

type CatalogEntry = { id: string; name: string };

export default function MyDocumentsPage() {
  const [documents, setDocuments] = useState<SavedDocumentSummary[] | null>(null);
  const [catalog, setCatalog] = useState<Record<string, string>>({});

  useEffect(() => {
    listMyDocuments().then(setDocuments);
    fetch(`${API_BASE_URL}/api/documents`)
      .then((response) => (response.ok ? response.json() : null))
      .then((data: { templates: CatalogEntry[] } | null) => {
        if (!data) return;
        const names: Record<string, string> = {};
        for (const template of data.templates) names[template.id] = template.name;
        setCatalog(names);
      })
      .catch(() => {
        // Leave the catalog empty; the list falls back to raw documentTypeId values.
      });
  }, []);

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-10">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground dark:text-white">
          My Documents
        </h1>
        <p className="max-w-2xl text-sm text-neutral-600 dark:text-neutral-300">
          Documents you&apos;ve previously created. Click one to keep editing it.
        </p>
      </header>

      {documents === null ? (
        <p className="text-sm text-neutral-500 dark:text-neutral-400">Loading…</p>
      ) : documents.length === 0 ? (
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          You haven&apos;t created any documents yet.{" "}
          <Link href="/app" className="text-primary hover:underline">
            Start one
          </Link>
          .
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {documents.map((document) => (
            <li key={document.id}>
              <Link
                href={`/app?resume=${document.id}`}
                className="flex items-center justify-between rounded-xl border border-neutral-100 bg-white px-5 py-4 shadow-xs transition hover:border-primary/40 dark:border-neutral-700 dark:bg-neutral-900/40"
              >
                <span className="font-medium text-foreground dark:text-neutral-100">
                  {catalog[document.documentTypeId] ?? document.documentTypeId}
                </span>
                <span className="text-sm text-neutral-500 dark:text-neutral-400">
                  {new Date(document.updatedAt).toLocaleString()}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}

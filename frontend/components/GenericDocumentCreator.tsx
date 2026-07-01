"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import GenericChat from "@/components/GenericChat";
import GenericForm from "@/components/GenericForm";
import GenericPreview from "@/components/GenericPreview";
import { fillGenericDocument, type FieldValues } from "@/lib/genericDocument";
import { exportElementToPdf } from "@/lib/pdf";

type Props = {
  documentId: string;
};

type DocumentContent = {
  name: string;
  standardTerms: string;
  fields: string[];
};

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

export default function GenericDocumentCreator({ documentId }: Props) {
  const [content, setContent] = useState<DocumentContent | null>(null);
  const [fields, setFields] = useState<FieldValues>({});
  const [isDownloading, setIsDownloading] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`${API_BASE_URL}/api/documents/${documentId}/content`)
      .then((response) => response.json())
      .then((data: DocumentContent) => {
        if (!cancelled) setContent(data);
      });
    return () => {
      cancelled = true;
    };
  }, [documentId]);

  const handleFieldsUpdate = (update: FieldValues) => {
    setFields((previous) => {
      const next = { ...previous };
      for (const [variable, value] of Object.entries(update)) {
        if (value !== null && value !== undefined) {
          next[variable] = value;
        }
      }
      return next;
    });
  };

  const handleFieldUpdate = (field: string, value: string) => {
    setFields((previous) => ({ ...previous, [field]: value }));
  };

  const filledDocument = useMemo(
    () => (content ? fillGenericDocument(content.standardTerms, fields) : ""),
    [content, fields]
  );

  const handleDownload = async () => {
    if (!previewRef.current) return;
    setIsDownloading(true);
    try {
      await exportElementToPdf(previewRef.current, `${documentId}.pdf`);
    } finally {
      setIsDownloading(false);
    }
  };

  if (!content) {
    return <p className="px-6 py-10 text-sm text-neutral-500 dark:text-neutral-400">Loading document…</p>;
  }

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-10">
      <header className="flex flex-col gap-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-primary">Prototype</span>
        <h1 className="text-3xl font-semibold tracking-tight text-foreground dark:text-white">
          {content.name}
        </h1>
        <p className="max-w-2xl text-sm text-neutral-600 dark:text-neutral-300">
          Chat with the assistant or fill in the form to generate this document —
          both update the same document. The preview on the right updates as you go,
          and you can download the completed document as a PDF.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <section className="flex flex-col gap-6">
          <GenericChat
            documentId={documentId}
            greeting={`Great — let's fill out your ${content.name}. What can you tell me first?`}
            onDocumentIdChange={() => {}}
            onFieldsUpdate={handleFieldsUpdate}
          />
          <GenericForm fields={content.fields} values={fields} onUpdate={handleFieldUpdate} />
        </section>

        <section className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground dark:text-neutral-100">Preview</h2>
            <button
              type="button"
              onClick={handleDownload}
              disabled={isDownloading}
              className="rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground shadow-xs transition hover:bg-primary/90 hover:shadow-sm disabled:cursor-not-allowed disabled:bg-neutral-400 disabled:shadow-none dark:disabled:bg-neutral-600"
            >
              {isDownloading ? "Generating PDF…" : "Download PDF"}
            </button>
          </div>
          <div className="max-h-[80vh] overflow-y-auto rounded-xl border border-neutral-200 bg-neutral-50 p-4 shadow-xs dark:border-neutral-700 dark:bg-neutral-900/40">
            <GenericPreview ref={previewRef} markdown={filledDocument} />
          </div>
        </section>
      </div>
    </main>
  );
}

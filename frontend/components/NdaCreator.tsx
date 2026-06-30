"use client";

import { useMemo, useRef, useState } from "react";
import NdaForm from "@/components/NdaForm";
import NdaPreview from "@/components/NdaPreview";
import { defaultMndaFormValues, fillMndaDocument, type MndaFormValues } from "@/lib/mnda";
import { exportElementToPdf } from "@/lib/pdf";

type Props = {
  coverPageTemplate: string;
  standardTermsTemplate: string;
};

export default function NdaCreator({ coverPageTemplate, standardTermsTemplate }: Props) {
  const [values, setValues] = useState<MndaFormValues>(defaultMndaFormValues);
  const [isDownloading, setIsDownloading] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);

  const handleUpdate = <K extends keyof MndaFormValues>(field: K, value: MndaFormValues[K]) => {
    setValues((previous) => ({ ...previous, [field]: value }));
  };

  const { coverPage, standardTerms } = useMemo(
    () => fillMndaDocument(coverPageTemplate, standardTermsTemplate, values),
    [coverPageTemplate, standardTermsTemplate, values]
  );

  const handleDownload = async () => {
    if (!previewRef.current) return;
    setIsDownloading(true);
    try {
      await exportElementToPdf(previewRef.current, "mutual-nda.pdf");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-10">
      <header className="flex flex-col gap-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-primary">
          Prototype
        </span>
        <h1 className="text-3xl font-semibold tracking-tight text-foreground dark:text-white">
          Mutual NDA Creator
        </h1>
        <p className="max-w-2xl text-sm text-neutral-600 dark:text-neutral-300">
          Fill in the form to generate a Common Paper Mutual Non-Disclosure Agreement.
          The preview on the right updates as you type, and you can download the
          completed document as a PDF.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <section>
          <NdaForm values={values} onUpdate={handleUpdate} />
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
            <NdaPreview
              ref={previewRef}
              coverPageMarkdown={coverPage}
              standardTermsMarkdown={standardTerms}
            />
          </div>
        </section>
      </div>
    </main>
  );
}

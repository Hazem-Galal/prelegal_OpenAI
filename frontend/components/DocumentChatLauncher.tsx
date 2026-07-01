"use client";

import { useState } from "react";
import GenericChat from "@/components/GenericChat";
import GenericDocumentCreator from "@/components/GenericDocumentCreator";
import NdaCreator from "@/components/NdaCreator";

type Props = {
  mndaCoverPageTemplate: string;
  mndaStandardTermsTemplate: string;
};

const SELECTION_GREETING =
  "Hi! What kind of legal agreement do you need help with today?";

export default function DocumentChatLauncher({
  mndaCoverPageTemplate,
  mndaStandardTermsTemplate,
}: Props) {
  const [documentId, setDocumentId] = useState<string | null>(null);

  if (documentId === "mutual-nda") {
    return (
      <NdaCreator
        coverPageTemplate={mndaCoverPageTemplate}
        standardTermsTemplate={mndaStandardTermsTemplate}
      />
    );
  }

  if (documentId) {
    return <GenericDocumentCreator documentId={documentId} />;
  }

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-6 px-6 py-10">
      <header className="flex flex-col gap-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-primary">
          Prototype
        </span>
        <h1 className="text-3xl font-semibold tracking-tight text-foreground dark:text-white">
          Legal Document Creator
        </h1>
        <p className="max-w-2xl text-sm text-neutral-600 dark:text-neutral-300">
          Tell the assistant what kind of agreement you need, and it will guide you
          through creating it.
        </p>
      </header>

      <GenericChat
        documentId={null}
        greeting={SELECTION_GREETING}
        onDocumentIdChange={setDocumentId}
        onFieldsUpdate={() => {}}
      />
    </main>
  );
}

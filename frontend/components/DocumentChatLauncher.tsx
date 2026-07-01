"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import GenericChat from "@/components/GenericChat";
import GenericDocumentCreator from "@/components/GenericDocumentCreator";
import NdaCreator from "@/components/NdaCreator";
import Spinner from "@/components/Spinner";
import { getSavedDocument, type SavedDocument } from "@/lib/documents";
import type { FieldValues } from "@/lib/genericDocument";
import type { MndaFormValues } from "@/lib/mnda";

type Props = {
  mndaCoverPageTemplate: string;
  mndaStandardTermsTemplate: string;
};

const SWITCH_GREETING = "What kind of legal agreement do you need instead?";

export default function DocumentChatLauncher({
  mndaCoverPageTemplate,
  mndaStandardTermsTemplate,
}: Props) {
  const searchParams = useSearchParams();
  const resumeId = searchParams.get("resume");

  const [documentId, setDocumentId] = useState("mutual-nda");
  const [isSwitching, setIsSwitching] = useState(false);
  const [resumedDocument, setResumedDocument] = useState<SavedDocument | null>(null);
  const [isLoadingResume, setIsLoadingResume] = useState(Boolean(resumeId));

  useEffect(() => {
    if (!resumeId) return;
    let cancelled = false;
    getSavedDocument(resumeId).then((saved) => {
      if (cancelled) return;
      if (saved) {
        setResumedDocument(saved);
        setDocumentId(saved.documentTypeId);
      }
      setIsLoadingResume(false);
    });
    return () => {
      cancelled = true;
    };
  }, [resumeId]);

  const handleDocumentSwitch = (newDocumentId: string) => {
    setDocumentId(newDocumentId);
    setIsSwitching(false);
  };

  if (isLoadingResume) {
    return (
      <p className="flex items-center gap-2 px-6 py-10 text-sm text-neutral-500 dark:text-neutral-400">
        <Spinner /> Loading document…
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="mx-auto w-full max-w-6xl px-6 pt-6">
        <button
          type="button"
          onClick={() => setIsSwitching((previous) => !previous)}
          className="text-xs font-medium text-primary underline-offset-2 hover:underline"
        >
          {isSwitching ? "Cancel" : "Need a different document instead?"}
        </button>
      </div>

      {isSwitching && (
        <div className="mx-auto w-full max-w-6xl px-6">
          <GenericChat
            documentId={null}
            greeting={SWITCH_GREETING}
            onDocumentIdChange={handleDocumentSwitch}
            onFieldsUpdate={() => {}}
          />
        </div>
      )}

      {documentId === "mutual-nda" ? (
        <NdaCreator
          coverPageTemplate={mndaCoverPageTemplate}
          standardTermsTemplate={mndaStandardTermsTemplate}
          initialSavedDocumentId={resumedDocument?.id}
          // Field values round-trip through the backend as opaque JSON; this
          // cast is the one place that boundary is asserted back to a shape.
          initialValues={resumedDocument?.fieldValues as MndaFormValues | undefined}
        />
      ) : (
        <GenericDocumentCreator
          documentId={documentId}
          initialSavedDocumentId={resumedDocument?.id}
          initialFields={resumedDocument?.fieldValues as FieldValues | undefined}
        />
      )}
    </div>
  );
}

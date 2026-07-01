"use client";

import { useState } from "react";
import GenericChat from "@/components/GenericChat";
import GenericDocumentCreator from "@/components/GenericDocumentCreator";
import NdaCreator from "@/components/NdaCreator";

type Props = {
  mndaCoverPageTemplate: string;
  mndaStandardTermsTemplate: string;
};

const SWITCH_GREETING = "What kind of legal agreement do you need instead?";

export default function DocumentChatLauncher({
  mndaCoverPageTemplate,
  mndaStandardTermsTemplate,
}: Props) {
  const [documentId, setDocumentId] = useState("mutual-nda");
  const [isSwitching, setIsSwitching] = useState(false);

  const handleDocumentSwitch = (newDocumentId: string) => {
    setDocumentId(newDocumentId);
    setIsSwitching(false);
  };

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
        />
      ) : (
        <GenericDocumentCreator documentId={documentId} />
      )}
    </div>
  );
}

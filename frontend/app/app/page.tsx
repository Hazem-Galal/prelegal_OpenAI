import { readFileSync } from "node:fs";
import path from "node:path";
import type { Metadata } from "next";
import DocumentChatLauncher from "@/components/DocumentChatLauncher";

export const metadata: Metadata = {
  title: "Legal Document Creator | Prelegal",
  description:
    "Chat with an AI assistant to create a legal agreement from a Common Paper template and download it as a PDF.",
};

function readTemplate(fileName: string): string {
  const filePath = path.join(
    process.cwd(),
    "..",
    "templates",
    "mutual-nda",
    fileName
  );
  return readFileSync(filePath, "utf-8");
}

export default function Page() {
  const coverPageTemplate = readTemplate("Mutual-NDA-coverpage.md");
  const standardTermsTemplate = readTemplate("Mutual-NDA.md");

  return (
    <DocumentChatLauncher
      mndaCoverPageTemplate={coverPageTemplate}
      mndaStandardTermsTemplate={standardTermsTemplate}
    />
  );
}

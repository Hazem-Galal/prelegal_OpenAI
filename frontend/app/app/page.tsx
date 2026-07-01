import { readFileSync } from "node:fs";
import path from "node:path";
import type { Metadata } from "next";
import NdaCreator from "@/components/NdaCreator";

export const metadata: Metadata = {
  title: "Mutual NDA Creator | Prelegal",
  description:
    "Fill in a form to generate a Common Paper Mutual Non-Disclosure Agreement and download it as a PDF.",
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
    <NdaCreator
      coverPageTemplate={coverPageTemplate}
      standardTermsTemplate={standardTermsTemplate}
    />
  );
}

import { readFileSync } from "node:fs";
import path from "node:path";
import NdaCreator from "@/components/NdaCreator";

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

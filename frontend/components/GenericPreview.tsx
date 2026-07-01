"use client";

import type { Ref } from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import DraftDisclaimer from "@/components/DraftDisclaimer";

type Props = {
  markdown: string;
  ref?: Ref<HTMLDivElement>;
};

export default function GenericPreview({ markdown, ref }: Props) {
  return (
    <div
      ref={ref}
      className="prose prose-sm sm:prose-base dark:prose-invert prose-headings:text-primary prose-a:text-primary mx-auto max-w-3xl rounded-xl border border-neutral-100 bg-white px-8 py-10 text-neutral-900 shadow-xs dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
    >
      <DraftDisclaimer />
      <Markdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
        {markdown}
      </Markdown>
    </div>
  );
}

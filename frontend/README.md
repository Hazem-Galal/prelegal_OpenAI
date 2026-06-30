# Mutual NDA Creator (frontend)

A Next.js prototype for [PR-3](https://hazemali1978.atlassian.net/browse/PR-3): a web app that
fills in a Common Paper Mutual Non-Disclosure Agreement from a form and lets the user download
the completed document as a PDF.

The Mutual NDA cover page and standard terms are read directly from
[`../templates/mutual-nda`](../templates/mutual-nda) (see [PR-2](../templates)), so the dataset
stays the single source of truth for the document content.

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## How it works

- `app/page.tsx` is a Server Component that reads the cover page and standard terms markdown
  from `templates/mutual-nda`.
- `components/NdaCreator.tsx` holds the form state and renders the form and live preview side by
  side.
- `lib/mnda.ts` fills the bracketed placeholders and `coverpage_link` references in the
  templates with the form values.
- `lib/pdf.ts` captures the rendered preview and exports it as a paginated A4 PDF using
  `html2canvas-pro` and `jspdf`.

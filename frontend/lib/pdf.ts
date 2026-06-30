import html2canvas from "html2canvas-pro";
import { jsPDF } from "jspdf";

/** Captures a DOM element and exports it as a multi-page A4 PDF, splitting the snapshot into page-sized slices. */
export async function exportElementToPdf(
  element: HTMLElement,
  fileName: string
): Promise<void> {
  const canvas = await html2canvas(element, {
    scale: 2,
    backgroundColor: "#ffffff",
  });

  const pdf = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const imageWidth = pageWidth;
  const pageHeightInCanvasPx = (pageHeight * canvas.width) / imageWidth;

  let renderedHeight = 0;
  let isFirstPage = true;

  while (renderedHeight < canvas.height) {
    const sliceHeight = Math.min(pageHeightInCanvasPx, canvas.height - renderedHeight);

    const pageCanvas = document.createElement("canvas");
    pageCanvas.width = canvas.width;
    pageCanvas.height = sliceHeight;
    const context = pageCanvas.getContext("2d");
    if (!context) {
      throw new Error("Could not create a canvas context for PDF export.");
    }
    context.drawImage(
      canvas,
      0,
      renderedHeight,
      canvas.width,
      sliceHeight,
      0,
      0,
      canvas.width,
      sliceHeight
    );

    const sliceImageHeight = (sliceHeight * imageWidth) / canvas.width;

    if (!isFirstPage) {
      pdf.addPage();
    }
    pdf.addImage(pageCanvas.toDataURL("image/png"), "PNG", 0, 0, imageWidth, sliceImageHeight);

    renderedHeight += sliceHeight;
    isFirstPage = false;
  }

  pdf.save(fileName);
}

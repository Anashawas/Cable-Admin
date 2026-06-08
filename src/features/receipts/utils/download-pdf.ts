/**
 * Triggers a browser download for a PDF Blob.
 */
export function downloadPdfBlob(blob: Blob, fileName: string): void {
  const finalName = fileName.toLowerCase().endsWith(".pdf")
    ? fileName
    : `${fileName}.pdf`;
  const pdfBlob =
    blob.type === "application/pdf"
      ? blob
      : new Blob([blob], { type: "application/pdf" });
  const url = URL.createObjectURL(pdfBlob);

  const link = document.createElement("a");
  link.href = url;
  link.download = finalName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

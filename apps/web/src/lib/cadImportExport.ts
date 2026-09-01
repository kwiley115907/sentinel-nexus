import jsPDF from "jspdf";

export async function exportCanvasPdf(elementId: string, filename: string) {
  const html2canvas = (await import("html2canvas")).default;
  const element = document.getElementById(elementId);

  if (!element) {
    throw new Error("Export area not found.");
  }

  const canvas = await html2canvas(element);
  const image = canvas.toDataURL("image/png");

  const pdf = new jsPDF("landscape", "pt", "letter");
  pdf.addImage(image, "PNG", 20, 20, 752, 572);
  pdf.save(filename);
}

export async function parseImportedPlan(file: File) {
  if (file.name.toLowerCase().endsWith(".dxf")) {
    const DxfParser = (await import("dxf-parser")).default;
    const parser = new DxfParser();
    return parser.parseSync(await file.text());
  }

  return {
    name: file.name,
    type: file.type,
    message: "PDF/image import placeholder ready.",
  };
}

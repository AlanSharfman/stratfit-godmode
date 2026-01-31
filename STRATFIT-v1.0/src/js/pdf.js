// STRATFIT v1.0 PDF Export
// - Loaded as a module: <script type="module" src="../src/js/pdf.js"></script>
// - Requires html2pdf bundle in page head:
//   <script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"></script>

function getHtml2Pdf() {
  if (!window.html2pdf) {
    throw new Error("html2pdf.js not loaded. Include the html2pdf.bundle.min.js script tag.");
  }
  return window.html2pdf;
}

export function exportRunPDF(runId = "SIM-2026-X9") {
  const html2pdf = getHtml2Pdf();
  const element = document.getElementById("export-target") || document.body;

  html2pdf()
    .set({
      margin: 0.5,
      filename: `${runId}_strategy_pack.pdf`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: "in", format: "letter", orientation: "portrait" },
    })
    .from(element)
    .save();
}

export function exportPageAsPDF(filename = "stratfit-report.pdf") {
  const html2pdf = getHtml2Pdf();
  const element = document.body;

  html2pdf()
    .set({
      margin: 0.5,
      filename,
      html2canvas: { scale: 2 },
      jsPDF: { unit: "in", format: "letter", orientation: "portrait" },
    })
    .from(element)
    .save();
}

// Also expose for inline onclick handlers
window.exportRunPDF = exportRunPDF;
window.exportPageAsPDF = exportPageAsPDF;



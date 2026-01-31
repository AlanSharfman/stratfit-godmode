// Minimal PDF export helper for the static prototype.
// Usage:
// 1) Add: <script src="../src/js/pdf.js"></script>
// 2) Add: <button onclick="exportPageAsPDF('sim_run.pdf')">📄 Export PDF</button>
//
// This loads html2pdf on-demand from CDN if not already present.

(function () {
  async function ensureHtml2Pdf() {
    if (window.html2pdf) return window.html2pdf;

    await new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = "https://cdn.jsdelivr.net/npm/html2pdf.js@0.10.1/dist/html2pdf.bundle.min.js";
      s.onload = () => resolve();
      s.onerror = () => reject(new Error("Failed to load html2pdf.js"));
      document.head.appendChild(s);
    });

    return window.html2pdf;
  }

  window.exportPageAsPDF = async function exportPageAsPDF(filename = "stratfit-report.pdf") {
    const html2pdf = await ensureHtml2Pdf();
    const element = document.body;

    html2pdf()
      .from(element)
      .set({
        margin: 0.5,
        filename,
        html2canvas: { scale: 2 },
        jsPDF: { unit: "in", format: "letter", orientation: "portrait" },
      })
      .save();
  };
})();



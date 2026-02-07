import jsPDF from "jspdf";
import { FoundationData } from "../store/foundationStore";

export function exportFoundationPDF(data: FoundationData) {
  const doc = new jsPDF();

  doc.setFontSize(16);
  doc.text("STRATFIT FOUNDATION SNAPSHOT", 20, 20);

  let y = 40;

  Object.entries(data).forEach(([key, value]) => {
    doc.setFontSize(11);
    doc.text(`${key}: ${value}`, 20, y);
    y += 8;
  });

  doc.save("STRATFIT_Foundation_Snapshot.pdf");
}


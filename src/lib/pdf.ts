import { jsPDF } from "jspdf";
import type { Decision } from "@/components/kyr/ResultView";

// Transliterate so non-Latin scripts render in default jsPDF fonts.
// (Embedding Devanagari/Kannada/Telugu fonts would bloat the bundle.)
function asciiSafe(s: string): string {
  if (!s) return "";
  // Keep printable ASCII; drop other glyphs jsPDF cannot render with built-in fonts.
  return s
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/\u2013|\u2014/g, "-")
    .replace(/\u20B9/g, "Rs.")
    .replace(/[^\x09\x0A\x20-\x7E]/g, "");
}

function isLatin(s: string): boolean {
  return asciiSafe(s).replace(/\s+/g, "").length >=
    s.replace(/\s+/g, "").length * 0.6;
}

export function downloadDecisionPDF(decision: Decision, labels: {
  appName: string;
  category: string;
  problem: string;
  decision: string;
  why: string;
  law: string;
  rights: string;
  next: string;
  documents: string;
  helplines: string;
  warnings: string;
  freeHelp: string;
  checklist: string;
  disclaimer: string;
  generated: string;
}) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 40;
  const contentW = pageW - margin * 2;
  let y = margin;

  // If the decision is in a non-Latin script, fall back to ASCII transliteration
  // to avoid empty glyphs in the PDF.
  const useAscii = !isLatin(decision.problem + decision.decision);
  const T = (s: string) => (useAscii ? asciiSafe(s) : s);

  const ensureSpace = (h: number) => {
    if (y + h > pageH - margin) {
      doc.addPage();
      y = margin;
    }
  };

  const writeWrapped = (text: string, size: number, opts: { bold?: boolean; color?: [number, number, number]; gap?: number } = {}) => {
    doc.setFont("helvetica", opts.bold ? "bold" : "normal");
    doc.setFontSize(size);
    if (opts.color) doc.setTextColor(...opts.color); else doc.setTextColor(20, 20, 20);
    const lines = doc.splitTextToSize(T(text), contentW);
    for (const line of lines) {
      ensureSpace(size + 4);
      doc.text(line, margin, y);
      y += size + 4;
    }
    y += opts.gap ?? 4;
  };

  const sectionHeader = (label: string, color: [number, number, number]) => {
    ensureSpace(28);
    doc.setFillColor(...color);
    doc.rect(margin, y, 4, 16, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.setTextColor(...color);
    doc.text(T(label), margin + 10, y + 12);
    y += 22;
  };

  const checkboxList = (items: string[]) => {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.setTextColor(30, 30, 30);
    for (const item of items) {
      const lines = doc.splitTextToSize(T(item), contentW - 22);
      ensureSpace(lines.length * 14 + 6);
      // checkbox
      doc.setDrawColor(120, 120, 120);
      doc.setLineWidth(0.8);
      doc.rect(margin + 2, y - 9, 11, 11);
      // text
      lines.forEach((ln: string, i: number) => {
        doc.text(ln, margin + 22, y + i * 14);
      });
      y += lines.length * 14 + 6;
    }
    y += 4;
  };

  // Header bar
  doc.setFillColor(217, 119, 6); // saffron
  doc.rect(0, 0, pageW, 56, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(255, 255, 255);
  doc.text(asciiSafe(labels.appName), margin, 36);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(new Date().toLocaleString(), pageW - margin, 36, { align: "right" });
  y = 80;

  // Category pill
  doc.setFillColor(245, 230, 211);
  doc.roundedRect(margin, y, contentW, 24, 6, 6, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(140, 70, 10);
  doc.text(`${asciiSafe(labels.category)}: ${T(decision.category)}`, margin + 10, y + 16);
  y += 36;

  // Title
  writeWrapped(labels.checklist, 16, { bold: true, color: [40, 40, 40], gap: 8 });

  sectionHeader(labels.problem, [180, 60, 60]);
  writeWrapped(decision.problem, 11, { gap: 8 });

  sectionHeader(labels.decision, [22, 130, 70]);
  writeWrapped(decision.decision, 12, { bold: true, gap: 8 });

  sectionHeader(labels.why, [180, 130, 30]);
  writeWrapped(decision.reasoning, 11, { gap: 8 });

  sectionHeader(labels.law, [80, 90, 180]);
  writeWrapped(decision.law, 11, { gap: 8 });

  if (decision.rights?.length) {
    sectionHeader(labels.rights, [22, 130, 70]);
    checkboxList(decision.rights);
  }

  sectionHeader(labels.documents, [180, 130, 30]);
  checkboxList(decision.documents ?? []);

  sectionHeader(labels.next, [217, 119, 6]);
  checkboxList((decision.nextSteps ?? []).map((s, i) => `Step ${i + 1}: ${s}`));

  if (decision.helplines?.length) {
    sectionHeader(labels.helplines, [180, 60, 60]);
    checkboxList(decision.helplines.map((h) => `${h.name} - ${h.number}`));
  }

  if (decision.warnings?.length) {
    sectionHeader(labels.warnings, [180, 60, 60]);
    checkboxList(decision.warnings);
  }

  if (decision.freeHelp) {
    sectionHeader(labels.freeHelp, [22, 130, 70]);
    writeWrapped(decision.freeHelp, 11, { gap: 4 });
    writeWrapped("DLSA Helpline: 15100", 11, { bold: true, gap: 8 });
  }

  // Footer on every page
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setDrawColor(220, 220, 220);
    doc.line(margin, pageH - 32, pageW - margin, pageH - 32);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(120, 120, 120);
    doc.text(asciiSafe(labels.disclaimer), margin, pageH - 18);
    doc.text(`${i} / ${pageCount}`, pageW - margin, pageH - 18, { align: "right" });
  }

  const safeCat = decision.category.replace(/[^a-z0-9]+/gi, "-").toLowerCase();
  doc.save(`know-your-rights-${safeCat || "checklist"}.pdf`);
}
export interface HistoryPoint {
  label: string;
  score: number;
}

function stamp() {
  return new Date().toISOString().slice(0, 10);
}

function download(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/** Export CSV de l'historique de risque affiché. */
export function exportHistoryCsv(
  rows: HistoryPoint[],
  meta: { area: string; zone: string; days: number },
) {
  const lines = [
    "Date;Score de risque",
    ...rows.map((r) => `${r.label};${r.score}`),
  ];
  const csv = "\uFEFF" + lines.join("\n");
  download(
    new Blob([csv], { type: "text/csv;charset=utf-8;" }),
    `historique-${meta.area}-${meta.days}j-${stamp()}.csv`,
  );
}

/** Export PDF (tableau + mini graphique) de l'historique de risque affiché. */
export async function exportHistoryPdf(
  rows: HistoryPoint[],
  meta: { area: string; zone: string; territory: string; days: number; risk: string; score: number },
) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const M = 48;
  let y = M;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("SITREP-NK · Historique de risque", M, y);
  y += 20;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(`Aire de sante : ${meta.area}`, M, y);
  y += 14;
  doc.text(`Zone de sante : ${meta.zone} · Territoire : ${meta.territory}`, M, y);
  y += 14;
  doc.text(`Fenetre : ${meta.days} jours · Score actuel : ${meta.score} (${meta.risk})`, M, y);
  y += 14;
  doc.text(`Genere le ${new Date().toLocaleString("fr-FR")}`, M, y);
  y += 24;

  // Graphique en barres
  const chartW = 500;
  const chartH = 110;
  doc.setDrawColor(200);
  doc.rect(M, y, chartW, chartH);
  const bw = chartW / Math.max(1, rows.length);
  rows.forEach((r, i) => {
    const h = (Math.max(0, Math.min(100, r.score)) / 100) * (chartH - 6);
    doc.setFillColor(59, 90, 220);
    doc.rect(M + i * bw + bw * 0.15, y + chartH - h, bw * 0.7, h, "F");
  });
  y += chartH + 24;

  // Tableau
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("Date", M, y);
  doc.text("Score", M + 160, y);
  y += 6;
  doc.setDrawColor(150);
  doc.line(M, y, M + 260, y);
  y += 14;
  doc.setFont("helvetica", "normal");

  for (const r of rows) {
    if (y > 780) {
      doc.addPage();
      y = M;
    }
    doc.text(r.label, M, y);
    doc.text(String(r.score), M + 160, y);
    y += 14;
  }

  doc.save(`historique-${meta.area}-${meta.days}j-${stamp()}.pdf`);
}

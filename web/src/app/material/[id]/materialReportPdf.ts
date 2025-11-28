import jsPDF from "jspdf";

// Helper to convert public PNG → Base64
async function loadImageAsBase64(src: string) {
  const res = await fetch(src);
  const blob = await res.blob();
  return new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.readAsDataURL(blob);
  });
}

export default async function generateMaterialPdf(material: any) {
  const pdf = new jsPDF("p", "pt", "a4");
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  let y = 40;

  // ======================================================
  // LOAD LOGOS FROM PUBLIC FOLDER
  // ======================================================
  const g20Logo = await loadImageAsBase64("/g20.png");
  const railwayLogo = await loadImageAsBase64("/railway.png");
  const tourismLogo = await loadImageAsBase64("/tourism.png");

  // ======================================================
  // PAGE BORDER
  // ======================================================
  pdf.setDrawColor(50);
  pdf.setLineWidth(1.2);
  pdf.rect(20, 20, pageWidth - 40, pageHeight - 40);

  // ======================================================
  // LOGO ROW (3 LOGOS)
  // ======================================================
  const logoSize = 60;

  pdf.addImage(g20Logo, "PNG", 60, y, logoSize, logoSize);
  pdf.addImage(railwayLogo, "PNG", pageWidth / 2 - 30, y, logoSize, logoSize);
  pdf.addImage(tourismLogo, "PNG", pageWidth - 60 - logoSize, y, logoSize, logoSize);

  y += 80;

  // ======================================================
  // GOVERNMENT TITLE
  // ======================================================
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(18);
  pdf.text("INDIAN RAILWAYS – MATERIAL RECORD", pageWidth / 2, y, {
    align: "center",
  });
  y += 25;

  pdf.setFontSize(12);
  pdf.text("Issued by: Materials & Track Maintenance Division", pageWidth / 2, y, {
    align: "center",
  });
  y += 20;

  pdf.setDrawColor(180);
  pdf.line(40, y, pageWidth - 40, y);
  y += 20;

  // ======================================================
  // HELPERS
  // ======================================================
  const sectionHeader = (title: string) => {
    y += 15;
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(14);
    pdf.text(title, 40, y);
    y += 10;
    pdf.setDrawColor(80);
    pdf.line(40, y, pageWidth - 40, y);
    y += 15;
  };

  const writeLine = (label: string, value: any) => {
    if (y > pageHeight - 80) {
      pdf.addPage();
      y = 60;
    }

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(11);

    const content = pdf.splitTextToSize(`${value || "—"}`, pageWidth - 250);

    pdf.text(label, 40, y);
    pdf.text(": ", 180, y);
    pdf.text(content, 200, y);

    y += Math.max(18, content.length * 14);
  };

  // ======================================================
  // SECTIONS
  // ======================================================
  sectionHeader("1. Core Details");
  writeLine("Material ID", material.materialId);
  writeLine("Manufacturer ID", material.manufacturerId);
  writeLine("Manufacturer Name", material.manufacturerName);

  sectionHeader("2. Technical Specifications");
  writeLine("Fitting Type", material.fittingType);
  writeLine("Drawing Number", material.drawingNumber);
  writeLine("Material Specification", material.materialSpec);
  writeLine("Weight (kg)", material.weightKg);
  writeLine("Board Gauge", material.boardGauge);
  writeLine("Manufacturing Date", material.manufacturingDate);
  writeLine("Expected Service Life", `${material.expectedLifeYears} years`);

  sectionHeader("3. UDM & Purchase Details");
  writeLine("PO Number", material.purchaseOrderNumber);
  writeLine("Batch Number", material.batchNumber);
  writeLine("Depot Code", material.depotCode);
  writeLine("Depot Entry Date", material.depotEntryDate);
  writeLine("UDM Lot Number", material.udmLotNumber);
  writeLine("Inspection Officer", material.inspectionOfficer);

  sectionHeader("4. TMS & Lifecycle Information");
  writeLine("TMS Track ID", material.tmsTrackId);
  writeLine("GPS Location", material.gpsLocation);
  writeLine("Installation Status", material.installationStatus);
  writeLine("Dispatch Date", material.dispatchDate);
  writeLine("Warranty Expiry", material.warrantyExpiry);
  writeLine("Failure Count", material.failureCount);
  writeLine("Last Maintenance Date", material.lastMaintenanceDate);

  // ======================================================
  // FOOTER (OPTIONAL VIMARSHA LOGO)
  // ======================================================
  // const vimarshaLogo = await loadImageAsBase64("/vimarsha.png");
  // pdf.addImage(vimarshaLogo, "PNG", pageWidth / 2 - 40, pageHeight - 100, 80, 40);

  pdf.setFont("helvetica", "italic");
  pdf.setFontSize(10);
  pdf.text(
    "This document is system-generated and valid for official Railways use.",
    pageWidth / 2,
    pageHeight - 40,
    { align: "center" }
  );

  pdf.save(`${material.materialId}_Railway_Report.pdf`);
}

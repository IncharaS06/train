import jsPDF from "jspdf";

export default function generateMaterialPdf(material: any) {
  const pdf = new jsPDF("p", "pt", "a4");
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  let y = 60;

  // ======================================================
  // PAGE BORDER (GOVERNMENT STYLE)
  // ======================================================
  pdf.setDrawColor(50);
  pdf.setLineWidth(1.2);
  pdf.rect(20, 20, pageWidth - 40, pageHeight - 40);

  // ======================================================
  // SIMPLE GOVERNMENT EMBLEM (VECTOR)
  // ======================================================
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(22);
  pdf.text("☸", pageWidth / 2 - 10, y); // Wheel symbol (Ashoka Chakra style)
  y += 35;

  // ======================================================
  // DOCUMENT HEADER
  // ======================================================
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
  // REUSABLE HELPERS
  // ======================================================

  const sectionHeader = (title: string) => {
    y += 15;
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(14);
    pdf.text(title, 40, y);
    y += 8;
    pdf.setDrawColor(80);
    pdf.setLineWidth(0.6);
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

    const wrappedText = pdf.splitTextToSize(`${value || "—"}`, pageWidth - 250);

    pdf.text(label, 40, y);
    pdf.text(": ", 180, y);
    pdf.text(wrappedText, 200, y);
    y += wrappedText.length > 1 ? wrappedText.length * 14 : 18;
  };

  // ======================================================
  // DOCUMENT BODY
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
  writeLine("Purchase Order Number", material.purchaseOrderNumber);
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
  // FOOTER
  // ======================================================
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

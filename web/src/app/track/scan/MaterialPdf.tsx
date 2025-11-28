import jsPDF from "jspdf";

export default async function generateMaterialPdf(material: any) {
  const pdf = new jsPDF("p", "pt", "a4");

  let y = 40;
  const line = (txt: string, val?: any) => {
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(12);
    pdf.text(`${txt}: ${val || "—"}`, 40, y);
    y += 22;
  };

  const header = (txt: string) => {
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(14);
    pdf.text(txt, 40, y);
    y += 26;
  };

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(20);
  pdf.text("Material Detailed Report", 40, y);
  y += 30;

  // Sections
  header("Core Details");
  line("Material ID", material.materialId);
  line("Firestore Doc ID", material.id);
  line("Manufacturer ID", material.manufacturerId);
  line("Manufacturer Name", material.manufacturerName);

  header("Technical Specification");
  line("Fitting Type", material.fittingType);
  line("Drawing Number", material.drawingNumber);
  line("Material Spec", material.materialSpec);
  line("Weight (kg)", material.weightKg);
  line("Board Gauge", material.boardGauge);
  line("Manufacturing Date", material.manufacturingDate);
  line("Expected Life (years)", material.expectedLifeYears);

  header("UDM Purchase & Lot Details");
  line("PO Number", material.purchaseOrderNumber);
  line("Batch Number", material.batchNumber);
  line("Depot Code", material.depotCode);
  line("Depot Entry Date", material.depotEntryDate);
  line("UDM Lot Number", material.udmLotNumber);
  line("Inspection Officer", material.inspectionOfficer);

  header("TMS Lifecycle");
  line("TMS Track ID", material.tmsTrackId);
  line("GPS Location", material.gpsLocation);
  line("Installation Status", material.installationStatus);
  line("Dispatch Date", material.dispatchDate);
  line("Warranty Expiry", material.warrantyExpiry);
  line("Failure Count", material.failureCount);
  line("Last Maintenance Date", material.lastMaintenanceDate);

  pdf.save(`${material.materialId}_report.pdf`);
}

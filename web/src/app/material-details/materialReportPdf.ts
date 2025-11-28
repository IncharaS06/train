import jsPDF from "jspdf";

export default function generateMaterialPdf(material: any) {
  const pdf = new jsPDF("p", "pt", "a4");
  let y = 40;

  const header = (text: string) => {
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(16);
    pdf.text(text, 40, y);
    y += 25;
  };

  const line = (label: string, value: any) => {
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(12);
    pdf.text(`${label}: ${value || "—"}`, 40, y);
    y += 18;
  };

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(20);
  pdf.text("Material Detailed Report", 40, y);
  y += 30;

  header("Core Details");
  line("Material ID", material.materialId);
  line("Manufacturer ID", material.manufacturerId);
  line("Manufacturer Name", material.manufacturerName);

  header("Technical Specifications");
  line("Fitting Type", material.fittingType);
  line("Drawing Number", material.drawingNumber);
  line("Material Spec", material.materialSpec);
  line("Weight (kg)", material.weightKg);
  line("Board Gauge", material.boardGauge);
  line("Manufacturing Date", material.manufacturingDate);
  line("Expected Life (yrs)", material.expectedLifeYears);

  header("UDM & Purchase");
  line("PO Number", material.purchaseOrderNumber);
  line("Batch Number", material.batchNumber);
  line("Depot Code", material.depotCode);
  line("Depot Entry Date", material.depotEntryDate);
  line("UDM Lot Number", material.udmLotNumber);
  line("Inspection Officer", material.inspectionOfficer);

  header("TMS & Lifecycle");
  line("TMS Track ID", material.tmsTrackId);
  line("GPS Location", material.gpsLocation);
  line("Dispatch Date", material.dispatchDate);
  line("Warranty Expiry", material.warrantyExpiry);
  line("Failure Count", material.failureCount);
  line("Last Maintenance", material.lastMaintenanceDate);

  pdf.save(`${material.materialId}_report.pdf`);
}

"use client";

import { useSearchParams } from "next/navigation";
import { db } from "@/shared/firebaseConfig";
import { doc, getDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import generateMaterialPdf from "./MaterialPdf";

export default function MaterialDetails() {
  const params = useSearchParams();
  const id = params.get("id");

  const [material, setMaterial] = useState<any>(null);

  useEffect(() => {
    async function load() {
      if (!id) return;

      try {
        const snap = await getDoc(doc(db, "materials", id));
        if (snap.exists()) {
          setMaterial({ id: snap.id, ...snap.data() });
        } else {
          setMaterial("NOT_FOUND");
        }
      } catch (err) {
        console.error("Error loading material:", err);
        setMaterial("ERROR");
      }
    }

    load();
  }, [id]);

  if (!material) return <p className="mt-10 text-center">Loading…</p>;
  if (material === "NOT_FOUND")
    return <p className="mt-10 text-center text-red-500">Material not found.</p>;
  if (material === "ERROR")
    return (
      <p className="mt-10 text-center text-red-600">
        Failed to load material.
      </p>
    );

  return (
    <div className="min-h-screen bg-[#FFF7E6] p-10">
      <div className="bg-white rounded-2xl p-8 shadow-xl max-w-3xl mx-auto">
        <h2 className="text-2xl font-bold mb-6 text-orange-600 text-center">
          Material Detailed Report
        </h2>

        {/* MAIN GRID */}
        <div className="grid grid-cols-2 gap-4 text-sm">

          {/* Core IDs */}
          <Section title="Core Details" />
          <Field label="Material ID" value={material.materialId} />
          <Field label="Firestore Doc ID" value={material.id} />
          <Field label="Manufacturer ID" value={material.manufacturerId} />
          <Field label="Manufacturer Name" value={material.manufacturerName} />

          {/* Technical Specification */}
          <Section title="Technical Specification" />
          <Field label="Fitting Type" value={material.fittingType} />
          <Field label="Drawing Number" value={material.drawingNumber} />
          <Field label="Material Spec" value={material.materialSpec} />
          <Field label="Weight (kg)" value={material.weightKg} />
          <Field label="Board Gauge" value={material.boardGauge} />
          <Field label="Manufacturing Date" value={material.manufacturingDate} />
          <Field label="Expected Life (years)" value={material.expectedLifeYears} />

          {/* UDM Details */}
          <Section title="UDM Purchase & Lot Data" />
          <Field label="Purchase Order No" value={material.purchaseOrderNumber} />
          <Field label="Batch Number" value={material.batchNumber} />
          <Field label="Depot Code" value={material.depotCode} />
          <Field label="Depot Entry Date" value={material.depotEntryDate} />
          <Field label="UDM Lot Number" value={material.udmLotNumber} />
          <Field label="Inspection Officer" value={material.inspectionOfficer} />

          {/* TMS Lifecycle */}
          <Section title="Track Mapping / TMS Lifecycle" />
          <Field label="TMS Track ID" value={material.tmsTrackId} />
          <Field label="GPS Location" value={material.gpsLocation} />
          <Field label="Installation Status" value={material.installationStatus} />
          <Field label="Dispatch Date" value={material.dispatchDate} />
          <Field label="Warranty Expiry" value={material.warrantyExpiry} />
          <Field label="Failure Count" value={material.failureCount} />
          <Field label="Last Maintenance Date" value={material.lastMaintenanceDate} />

        </div>

        {/* DOWNLOAD PDF BUTTON */}
        <button
          onClick={() => generateMaterialPdf(material)}
          className="mt-6 w-full py-3 rounded-xl bg-orange-600 text-white font-semibold"
        >
          Download Report (PDF)
        </button>
      </div>
    </div>
  );
}

/* UI Helpers */
function Section({ title }: { title: string }) {
  return (
    <div className="col-span-2 mt-4 mb-1">
      <h3 className="text-md font-semibold text-orange-700 border-b pb-1">
        {title}
      </h3>
    </div>
  );
}

function Field({ label, value }: { label: string; value: any }) {
  return (
    <p>
      <b>{label}:</b> {value || "—"}
    </p>
  );
}


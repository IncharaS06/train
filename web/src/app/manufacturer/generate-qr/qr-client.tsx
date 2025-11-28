"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import QRCode from "react-qr-code";
import { db } from "@/shared/firebaseConfig";
import { doc, getDoc } from "firebase/firestore";
import MainHeader from "@/components/Header";
import ManufacturerSidebar from "@/components/ManufacturerSidebar";

type Material = {
  materialId: string;
  manufacturerId: string;
  manufacturerName: string;
  fittingType: string;
  drawingNumber: string;
  batchNumber: string;
  purchaseOrderNumber: string;
  manufacturingDate: string;
};

export default function QRClient() {
  const searchParams = useSearchParams();
  const docId = searchParams.get("id");

  const [material, setMaterial] = useState<Material | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!docId) {
      setError("No material id provided in URL.");
      setLoading(false);
      return;
    }

    async function fetchData() {
      try {
        if (!docId) {
          setError("No material id provided in URL.");
          setLoading(false);
          return;
        }
        const snap = await getDoc(doc(db, "materials", docId));
        if (!snap.exists()) {
          setError("Material not found.");
        } else {
          setMaterial(snap.data() as Material);
        }
      } catch (err) {
        console.error(err);
        setError("Failed to load material.");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [docId]);

  let qrPayload = "";
  if (material && docId) {
    qrPayload = JSON.stringify({
      materialId: material.materialId,
      docId,
      manufacturerId: material.manufacturerId,
      fittingType: material.fittingType,
      drawingNumber: material.drawingNumber,
      batchNumber: material.batchNumber,
      poNumber: material.purchaseOrderNumber,
    });
  }

  return (
    <div className="min-h-screen bg-[#F7E8FF]">
      <MainHeader />

      <div className="flex pt-[90px]">
        <ManufacturerSidebar />

        <main className="ml-64 w-[calc(100%-16rem)] p-10 flex flex-col items-center">
          <h1 className="text-3xl font-extrabold text-[#A259FF] mb-6">
            Generate QR – Material
          </h1>

          {loading && <p>Loading material…</p>}
          {error && <p className="text-red-600">{error}</p>}

          {material && (
            <div className="bg-white rounded-3xl shadow-xl p-6 w-[400px] flex flex-col items-center">
              <QRCode value={qrPayload} size={220} />
              <div className="text-xs mt-4 space-y-1">
                <p><b>Material ID:</b> {material.materialId}</p>
                <p><b>Manufacturer:</b> {material.manufacturerName}</p>
                <p><b>Fitting Type:</b> {material.fittingType}</p>
                <p><b>Drawing No:</b> {material.drawingNumber}</p>
                <p><b>Batch:</b> {material.batchNumber}</p>
                <p><b>PO:</b> {material.purchaseOrderNumber}</p>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

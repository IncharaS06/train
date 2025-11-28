"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { db } from "@/shared/firebaseConfig";
import { doc, getDoc } from "firebase/firestore";
import QRCode from "qrcode-generator";

type Material = {
    materialId: string;
    manufacturerId: string;
    manufacturerName: string;
    fittingType: string;
    drawingNumber: string;
    materialSpec: string;
    weightKg: string;
    boardGauge: string;
    manufacturingDate: string;
    expectedLifeYears: string;
    purchaseOrderNumber: string;
    batchNumber: string;
    depotCode: string;
    depotEntryDate: string;
    udmLotNumber: string;
    inspectionOfficer: string;
    tmsTrackId: string;
    gpsLocation: string;
    installationStatus: string;
    dispatchDate: string;
    warrantyExpiry: string;
    failureCount: string;
    lastMaintenanceDate: string;
};

export default function ViewMaterial() {
    const { id } = useParams();
    const [data, setData] = useState<Material | null>(null);
    const [loading, setLoading] = useState(true);
    const [qrSvg, setQrSvg] = useState<string | null>(null);

    // Create QR SVG
    function generateQR(payload: string) {
        const qr = QRCode(1, "L");
        qr.addData(payload);
        qr.make();

        let size = 4;
        let margin = 4;

        let svg = `
          <svg xmlns="http://www.w3.org/2000/svg"
               width="${(qr.getModuleCount() + margin * 2) * size}"
               height="${(qr.getModuleCount() + margin * 2) * size}"
               viewBox="0 0 ${(qr.getModuleCount() + margin * 2) * size} ${(qr.getModuleCount() + margin * 2) * size}">
          <rect width="100%" height="100%" fill="white"/>
          <g fill="black">
        `;

        for (let r = 0; r < qr.getModuleCount(); r++) {
            for (let c = 0; c < qr.getModuleCount(); c++) {
                if (qr.isDark(r, c)) {
                    svg += `<rect x="${(c + margin) * size}" y="${(r + margin) * size}"
                               width="${size}" height="${size}"/>`;
                }
            }
        }

        svg += "</g></svg>";
        return svg;
    }

    // Fetch material by docId
    useEffect(() => {
        async function load() {
            const ref = doc(db, "materials", id as string);
            const snap = await getDoc(ref);

            if (snap.exists()) {
                const d = snap.data() as Material;
                setData(d);

                // Short payload for QR
                const qrPayload = JSON.stringify({
                    id: d.materialId,
                    m: d.manufacturerId.substring(0, 4),
                    f: d.fittingType.substring(0, 3),
                });

                setQrSvg(generateQR(qrPayload));
            }

            setLoading(false);
        }

        load();
    }, [id]);

    if (loading) {
        return (
            <div className="p-20 text-center text-xl">
                Loading material details…
            </div>
        );
    }

    if (!data) {
        return (
            <div className="p-20 text-center text-xl text-red-500">
                Material not found.
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F7E8FF] p-10">
            <h1 className="text-3xl font-extrabold text-[#A259FF] mb-5">
                Material Details
            </h1>

            <div className="bg-white rounded-3xl shadow-xl p-8">
                {/* QR Preview */}
                <div className="flex flex-col items-center mb-6">
                    <div dangerouslySetInnerHTML={{ __html: qrSvg || "" }} />

                    <p className="text-xs text-gray-500 mt-2">
                        Version-1 QR generated automatically
                    </p>
                </div>

                {/* Material Core Info */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                    <Info label="Material ID" value={data.materialId} />
                    <Info label="Manufacturer" value={data.manufacturerName} />
                    <Info label="Fitting Type" value={data.fittingType} />
                    <Info label="Drawing Number" value={data.drawingNumber} />
                    <Info label="Material Spec" value={data.materialSpec} />
                    <Info label="Weight (kg)" value={data.weightKg} />
                    <Info label="Board Gauge" value={data.boardGauge} />
                    <Info label="Manufacturing Date" value={data.manufacturingDate} />
                    <Info label="Expected Life (Years)" value={data.expectedLifeYears} />

                    {/* UDM */}
                    <Info label="PO Number" value={data.purchaseOrderNumber} />
                    <Info label="Batch Number" value={data.batchNumber} />
                    <Info label="Depot Code" value={data.depotCode} />
                    <Info label="Depot Entry Date" value={data.depotEntryDate} />
                    <Info label="UDM Lot Number" value={data.udmLotNumber} />
                    <Info label="Inspection Officer" value={data.inspectionOfficer} />

                    {/* TMS */}
                    <Info label="TMS Track ID" value={data.tmsTrackId} />
                    <Info label="GPS Location" value={data.gpsLocation} />
                    <Info label="Installation Status" value={data.installationStatus} />
                    <Info label="Dispatch Date" value={data.dispatchDate} />
                    <Info label="Warranty Expiry" value={data.warrantyExpiry} />
                    <Info label="Failure Count" value={data.failureCount} />
                    <Info label="Last Maintenance" value={data.lastMaintenanceDate} />
                </div>
            </div>
        </div>
    );
}

function Info({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex flex-col bg-gray-50 p-3 rounded-xl">
            <span className="text-[11px] text-gray-500">{label}</span>
            <span className="font-semibold text-gray-900">{value || "-"}</span>
        </div>
    );
}

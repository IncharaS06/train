"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/shared/firebaseConfig";
import MainHeader from "@/components/Header";
import ManufacturerSidebar from "@/components/ManufacturerSidebar";
import generateMaterialPdf from "../material/materialReportPdf";

// Type for Material
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

export default function MaterialDetailsPage() {
    const router = useRouter();
    const { materialId } = router.query;

    const [material, setMaterial] = useState<Material | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchMaterial() {
            if (!materialId) return;

            try {
                setLoading(true);
                const docRef = doc(db, "materials", materialId as string);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    setMaterial(docSnap.data() as Material);
                } else {
                    setError("Material not found.");
                }
            } catch (err) {
                console.error("Error:", err);
                setError("Failed to load material details.");
            } finally {
                setLoading(false);
            }
        }

        fetchMaterial();
    }, [materialId]);

    if (loading) return <PageLayout><div>Loading material details...</div></PageLayout>;
    if (error || !material) return <PageLayout><div className="text-red-500">{error}</div></PageLayout>;

    return (
        <PageLayout>
            <div className="bg-white rounded-3xl shadow-xl p-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-extrabold text-[#A259FF] mb-1">
                        Material Details
                    </h1>

                    <div className="flex justify-between items-center">
                        <p className="text-sm text-gray-600">
                            Material ID:{" "}
                            <span className="font-mono font-bold">{material.materialId}</span>
                        </p>

                        <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold ${material.installationStatus === "Installed"
                                ? "bg-green-100 text-green-800"
                                : "bg-yellow-100 text-yellow-800"
                                }`}
                        >
                            {material.installationStatus}
                        </span>
                    </div>
                </div>

                {/* Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                    {/* LEFT SIDE */}
                    <Section title="Manufacturer Details">
                        <Detail label="Manufacturer ID" value={material.manufacturerId} />
                        <Detail label="Manufacturer Name" value={material.manufacturerName} />
                    </Section>

                    <Section title="Technical Specifications">
                        <Detail label="Fitting Type" value={material.fittingType} />
                        <Detail label="Drawing Number" value={material.drawingNumber} />
                        <Detail label="Material Spec" value={material.materialSpec} />
                        <Detail label="Weight (kg)" value={material.weightKg} />
                        <Detail label="Board Gauge" value={material.boardGauge} />
                        <Detail label="Manufacturing Date" value={formatDate(material.manufacturingDate)} />
                        <Detail label="Expected Life" value={`${material.expectedLifeYears} yrs`} />
                    </Section>

                    {/* RIGHT SIDE */}
                    <Section title="UDM & Purchase Details">
                        <Detail label="Purchase Order" value={material.purchaseOrderNumber} />
                        <Detail label="Batch Number" value={material.batchNumber} />
                        <Detail label="Depot Code" value={material.depotCode} />
                        <Detail label="Depot Entry Date" value={formatDate(material.depotEntryDate)} />
                        <Detail label="UDM Lot Number" value={material.udmLotNumber} />
                        <Detail label="Inspection Officer" value={material.inspectionOfficer} />
                    </Section>

                    <Section title="TMS & Lifecycle">
                        <Detail label="TMS Track ID" value={material.tmsTrackId} />
                        <Detail label="GPS Location" value={material.gpsLocation} />
                        <Detail label="Dispatch Date" value={formatDate(material.dispatchDate)} />
                        <Detail label="Warranty Expiry" value={formatDate(material.warrantyExpiry)} />
                        <Detail label="Failure Count" value={material.failureCount} />
                        <Detail label="Last Maintenance Date" value={formatDate(material.lastMaintenanceDate)} />
                    </Section>
                </div>

                {/* Buttons */}
                <div className="mt-10 flex gap-4">
                    <button
                        onClick={() => generateMaterialPdf(material)}
                        className="px-6 py-2 bg-green-600 text-white rounded-xl font-semibold"
                    >
                        Download Report (PDF)
                    </button>

                    <button
                        onClick={() => router.push("/manufacturer/add-material")}
                        className="px-6 py-2 bg-[#A259FF] text-white rounded-xl font-semibold"
                    >
                        Add New Material
                    </button>

                    <button
                        onClick={() => router.push("/manufacturer/dashboard")}
                        className="px-6 py-2 border border-[#A259FF] text-[#A259FF] rounded-xl font-semibold"
                    >
                        Back to Dashboard
                    </button>
                </div>
            </div>
        </PageLayout>
    );
}

/* Layout Wrapper */
function PageLayout({ children }: any) {
    return (
        <div className="min-h-screen bg-[#F7E8FF]">
            <MainHeader />
            <div className="flex pt-[90px]">
                <ManufacturerSidebar />
                <main className="ml-64 w-[calc(100%-16rem)] px-10 py-10">{children}</main>
            </div>
        </div>
    );
}

/* Reusable Section UI */
function Section({ title, children }: any) {
    return (
        <section>
            <h2 className="text-lg font-semibold text-[#4B3A7A] mb-3 border-b pb-2">
                {title}
            </h2>
            <div className="space-y-2">{children}</div>
        </section>
    );
}

/* Reusable field */
function Detail({ label, value }: any) {
    return (
        <div className="flex justify-between items-center py-2 border-b border-gray-100">
            <span className="text-sm text-gray-600">{label}</span>
            <span className="text-sm text-gray-900 font-mono">{value || "Not set"}</span>
        </div>
    );
}

/* Date formatter */
function formatDate(dateString: string) {
    if (!dateString) return "Not set";
    try {
        return new Date(dateString).toLocaleDateString("en-IN");
    } catch {
        return dateString;
    }
}

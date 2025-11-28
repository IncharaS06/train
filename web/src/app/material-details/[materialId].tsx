"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/shared/firebaseConfig";
import MainHeader from "@/components/Header";
import ManufacturerSidebar from "@/components/ManufacturerSidebar";

// Reuse the same Material type
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
                    setError("Material not found");
                }
            } catch (err) {
                console.error("Error fetching material:", err);
                setError("Failed to load material details");
            } finally {
                setLoading(false);
            }
        }

        fetchMaterial();
    }, [materialId]);

    if (loading) {
        return (
            <div className="min-h-screen bg-[#F7E8FF]">
                <MainHeader />
                <div className="flex pt-[90px]">
                    <ManufacturerSidebar />
                    <main className="ml-64 w-[calc(100%-16rem)] px-10 py-10">
                        <div className="text-center">Loading material details...</div>
                    </main>
                </div>
            </div>
        );
    }

    if (error || !material) {
        return (
            <div className="min-h-screen bg-[#F7E8FF]">
                <MainHeader />
                <div className="flex pt-[90px]">
                    <ManufacturerSidebar />
                    <main className="ml-64 w-[calc(100%-16rem)] px-10 py-10">
                        <div className="text-center text-red-500">{error || "Material not found"}</div>
                    </main>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F7E8FF]">
            <MainHeader />

            <div className="flex pt-[90px]">
                <ManufacturerSidebar />

                <main className="ml-64 w-[calc(100%-16rem)] px-10 py-10">
                    <div className="bg-white rounded-3xl shadow-xl p-8">
                        {/* Header */}
                        <div className="mb-8">
                            <h1 className="text-3xl font-extrabold text-[#A259FF] mb-2">
                                Material Details
                            </h1>
                            <div className="flex justify-between items-center">
                                <p className="text-sm text-gray-600">
                                    Material ID: <span className="font-mono font-bold">{material.materialId}</span>
                                </p>
                                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${material.installationStatus === "Installed"
                                    ? "bg-green-100 text-green-800"
                                    : "bg-yellow-100 text-yellow-800"
                                    }`}>
                                    {material.installationStatus}
                                </span>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            {/* Left Column */}
                            <div className="space-y-6">
                                {/* Manufacturer Details */}
                                <section>
                                    <h2 className="text-lg font-semibold text-[#4B3A7A] mb-4 border-b pb-2">
                                        Manufacturer Details
                                    </h2>
                                    <div className="space-y-3">
                                        <DetailRow label="Manufacturer ID" value={material.manufacturerId} />
                                        <DetailRow label="Manufacturer Name" value={material.manufacturerName} />
                                    </div>
                                </section>

                                {/* Technical Specifications */}
                                <section>
                                    <h2 className="text-lg font-semibold text-[#4B3A7A] mb-4 border-b pb-2">
                                        Technical Specifications
                                    </h2>
                                    <div className="space-y-3">
                                        <DetailRow label="Fitting Type" value={material.fittingType} />
                                        <DetailRow label="Drawing Number" value={material.drawingNumber} />
                                        <DetailRow label="Material Specification" value={material.materialSpec} />
                                        <DetailRow label="Weight (kg)" value={material.weightKg} />
                                        <DetailRow label="Board Gauge" value={material.boardGauge} />
                                        <DetailRow label="Manufacturing Date" value={formatDate(material.manufacturingDate)} />
                                        <DetailRow label="Expected Life" value={`${material.expectedLifeYears} years`} />
                                    </div>
                                </section>
                            </div>

                            {/* Right Column */}
                            <div className="space-y-6">
                                {/* UDM Details */}
                                <section>
                                    <h2 className="text-lg font-semibold text-[#4B3A7A] mb-4 border-b pb-2">
                                        UDM & Purchase Details
                                    </h2>
                                    <div className="space-y-3">
                                        <DetailRow label="Purchase Order" value={material.purchaseOrderNumber} />
                                        <DetailRow label="Batch Number" value={material.batchNumber} />
                                        <DetailRow label="Depot Code" value={material.depotCode} />
                                        <DetailRow label="Depot Entry Date" value={formatDate(material.depotEntryDate)} />
                                        <DetailRow label="UDM Lot Number" value={material.udmLotNumber} />
                                        <DetailRow label="Inspection Officer" value={material.inspectionOfficer} />
                                    </div>
                                </section>

                                {/* TMS & Lifecycle */}
                                <section>
                                    <h2 className="text-lg font-semibold text-[#4B3A7A] mb-4 border-b pb-2">
                                        TMS & Lifecycle
                                    </h2>
                                    <div className="space-y-3">
                                        <DetailRow label="TMS Track ID" value={material.tmsTrackId} />
                                        <DetailRow label="GPS Location" value={material.gpsLocation} />
                                        <DetailRow label="Dispatch Date" value={formatDate(material.dispatchDate)} />
                                        <DetailRow label="Warranty Expiry" value={formatDate(material.warrantyExpiry)} />
                                        <DetailRow label="Failure Count" value={material.failureCount} />
                                        <DetailRow label="Last Maintenance" value={formatDate(material.lastMaintenanceDate)} />
                                    </div>
                                </section>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="mt-8 pt-6 border-t border-gray-200 flex gap-4">
                            <button
                                onClick={() => router.push("/manufacturer/add-material")}
                                className="px-6 py-2 bg-[#A259FF] text-white rounded-xl text-sm font-semibold hover:bg-[#8a4bd8] transition-colors"
                            >
                                Add New Material
                            </button>
                            <button
                                onClick={() => router.push("/manufacturer/dashboard")}
                                className="px-6 py-2 border border-[#A259FF] text-[#A259FF] rounded-xl text-sm font-semibold hover:bg-[#F7E8FF] transition-colors"
                            >
                                Back to Dashboard
                            </button>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}

// Helper component for detail rows
function DetailRow({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex justify-between items-center py-2 border-b border-gray-100">
            <span className="text-sm font-medium text-gray-600">{label}</span>
            <span className="text-sm text-gray-900 font-mono">{value || "Not set"}</span>
        </div>
    );
}

// Helper function to format dates
function formatDate(dateString: string): string {
    if (!dateString) return "Not set";
    try {
        return new Date(dateString).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    } catch {
        return dateString;
    }
}
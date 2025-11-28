"use client";

import { useSearchParams } from "next/navigation";
import { db } from "@/shared/firebaseConfig";
import { doc, getDoc } from "firebase/firestore";
import { useEffect, useState } from "react";

export default function MaterialDetailsClient() {
    const params = useSearchParams();
    const id = params.get("id");

    const [material, setMaterial] = useState<any>(null);

    useEffect(() => {
        async function load() {
            if (!id) return;
            const snap = await getDoc(doc(db, "materials", id));
            if (snap.exists()) setMaterial(snap.data());
        }
        load();
    }, [id]);

    if (!material)
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p>Loading…</p>
            </div>
        );

    return (
        <div className="min-h-screen bg-[#FFF7E6] p-10">
            <div className="bg-white rounded-2xl p-8 shadow-xl max-w-2xl mx-auto">
                <h2 className="text-xl font-bold mb-4 text-orange-600">
                    {material.fittingType} – Details
                </h2>

                <div className="grid grid-cols-2 text-sm gap-2">
                    <p><b>Material ID:</b> {material.materialId}</p>
                    <p><b>PO Number:</b> {material.purchaseOrderNumber}</p>
                    <p><b>Batch:</b> {material.batchNumber}</p>
                    <p><b>Gauge:</b> {material.boardGauge}</p>
                    <p><b>Date of Manufacture:</b> {material.manufacturingDate}</p>
                    <p><b>Expected Life:</b> {material.expectedLifeYears}</p>
                </div>
            </div>
        </div>
    );
}

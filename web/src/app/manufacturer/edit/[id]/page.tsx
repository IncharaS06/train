"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { db } from "@/shared/firebaseConfig";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import ManufacturerSidebar from "@/components/ManufacturerSidebar";
import MainHeader from "@/components/Header";

export default function EditMaterialPage() {
    const router = useRouter();
    const { id } = useParams();
    const docId = Array.isArray(id) ? id[0] : id;

    const [form, setForm] = useState<any>(null);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        async function load() {
            if (!docId) return;
            const ref = doc(db, "materials", docId);
            const snap = await getDoc(ref);

            if (snap.exists()) {
                const data = snap.data();

                // ❗ PREVENT accidental overwrite of QR-related fields
                delete data.qrCode;
                delete data.qrImageUrl;
                delete data.qrHash;
                delete data.materialId;

                setForm(data);
            }
        }
        load();
    }, [docId]);

    async function saveChanges() {
        setSaving(true);

        // ensure we have a docId before calling Firestore helpers
        if (!docId) {
            setSaving(false);
            console.error("Missing document id");
            return;
        }

        // ❗ THE IMPORTANT PART — update only what user edited
        const ref = doc(db, "materials", docId);

        await updateDoc(ref, {
            ...form, // all edited fields
            updatedAt: new Date().toISOString(), // useful field
        });

        setSaving(false);
        router.push("/manufacturer/view");
    }

    if (!form) {
        return (
            <div className="min-h-screen bg-[#F7E8FF] flex justify-center items-center">
                Loading…
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F7E8FF]">
            <MainHeader />

            <div className="flex pt-[90px]">
                <ManufacturerSidebar />

                <main className="ml-64 w-[calc(100%-16rem)] px-10 py-10">
                    <h1 className="text-3xl font-extrabold text-[#A259FF] mb-6">
                        Edit Material (QR Unchanged)
                    </h1>

                    <div className="bg-white rounded-3xl shadow-xl p-6 max-w-3xl">
                        {[
                            ["manufacturerName", "Manufacturer Name"],
                            ["fittingType", "Fitting Type"],
                            ["drawingNumber", "Drawing Number"],
                            ["materialSpec", "Material Specification"],
                            ["weightKg", "Weight (kg)"],
                            ["boardGauge", "Board Gauge"],
                            ["manufacturingDate", "Manufacturing Date"],
                            ["expectedLifeYears", "Expected Life (years)"],
                            ["batchNumber", "Batch Number"],
                            ["purchaseOrderNumber", "Purchase Order Number"],
                        ].map(([key, label]) => (
                            <div key={key} className="mb-4">
                                <label className="text-xs text-gray-600">{label}</label>
                                <input
                                    value={form[key] || ""}
                                    onChange={(e) =>
                                        setForm({ ...form, [key]: e.target.value })
                                    }
                                    className="w-full border rounded-xl px-3 py-2 mt-1 text-sm"
                                />
                            </div>
                        ))}

                        <button
                            onClick={saveChanges}
                            className="mt-4 px-5 py-2 rounded-xl bg-[#A259FF] text-white text-sm font-semibold"
                        >
                            {saving ? "Saving..." : "Save Changes"}
                        </button>
                    </div>
                </main>
            </div>
        </div>
    );
}

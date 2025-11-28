"use client";

import { useState } from "react";
import { db, storage } from "@/shared/firebaseConfig";
import { collection, addDoc } from "firebase/firestore";
import { ref, uploadString, getDownloadURL } from "firebase/storage";
// @ts-ignore -- no type declarations for 'qrcode'
import QRCode from "qrcode";

export default function AddMaterialPage() {
    const [form, setForm] = useState({
        manufacturerId: "",
        drawingNumber: "",
        fittingType: "",
        materialSpecs: "",
        weight: "",
        gauge: "",
        mfgDate: "",
        expectedLife: "",
        batchNumber: "",
        purchaseOrder: "",
    });

    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState("");

    // Auto Material ID Generator
    const generateMaterialId = () => {
        return (
            "MAT-" +
            form.manufacturerId +
            "-" +
            Date.now().toString().slice(-6)
        );
    };

    const handleSubmit = async () => {
        setSaving(true);
        try {
            const materialId = generateMaterialId();

            // Create JSON for QR
            const qrPayload = {
                materialId,
                ...form,
                timestamp: Date.now(),
            };

            const qrString = JSON.stringify(qrPayload);

            // Generate QR code as DataURL
            const qrImage = await QRCode.toDataURL(qrString);

            // Upload to Storage
            const storageRef = ref(storage, `qr/${materialId}.png`);
            await uploadString(storageRef, qrImage, "data_url");
            const qrUrl = await getDownloadURL(storageRef);

            // Save data to Firestore
            await addDoc(collection(db, "materials"), {
                materialId,
                ...form,
                qrUrl,
                status: "manufactured",
                createdAt: new Date(),
            });

            setMessage("Material Added Successfully!");
        } catch (e) {
            console.error(e);
            setMessage("Error saving material.");
        }
        setSaving(false);
    };

    return (
        <div className="min-h-screen bg-[#F7E8FF] p-10">
            <h1 className="text-4xl font-bold text-[#A259FF] mb-8">Add Material</h1>

            <div className="grid grid-cols-2 gap-6 bg-white p-8 rounded-2xl shadow-xl">
                {Object.keys(form).map((key) => (
                    <div key={key} className="flex flex-col gap-1">
                        <label className="font-semibold text-[#5A4B81]">
                            {key.toUpperCase()}
                        </label>
                        <input
                            className="border p-3 rounded-md"
                            value={(form as any)[key]}
                            onChange={(e) =>
                                setForm({ ...form, [key]: e.target.value })
                            }
                        />
                    </div>
                ))}
            </div>

            <button
                onClick={handleSubmit}
                disabled={saving}
                className="mt-8 bg-[#A259FF] hover:bg-[#8d41e6] text-white py-3 px-8 rounded-xl shadow-lg text-xl"
            >
                {saving ? "Saving..." : "Save Material"}
            </button>

            {message && <p className="mt-4 text-xl text-[#4b2bb4]">{message}</p>}
        </div>
    );
}

"use client";

import { useEffect, useState } from "react";
import { db } from "@/shared/firebaseConfig";
import { doc, getDoc } from "firebase/firestore";
import { useParams } from "next/navigation";

export default function MaterialDetailsPage() {
    const { id } = useParams() as { id: string };
    const [material, setMaterial] = useState<any>(null);

    useEffect(() => {
        const load = async () => {
            const ref = doc(db, "materials", id);
            const snap = await getDoc(ref);
            if (snap.exists()) setMaterial(snap.data());
        };
        load();
    }, [id]);

    if (!material)
        return (
            <div className="h-screen flex justify-center items-center text-xl">
                Loading...
            </div>
        );

    return (
        <div className="min-h-screen bg-[#F7E8FF] p-10">
            <h1 className="text-3xl font-bold text-[#A259FF] mb-8">
                Material Details
            </h1>

            <div className="bg-white p-10 rounded-2xl shadow-xl w-[700px]">
                {Object.entries(material).map(([key, value]) => (
                    <p key={key} className="mb-3">
                        <b>{key}:</b> {String(value)}
                    </p>
                ))}

                <img src={material.qrUrl} className="w-52 mt-6" />
            </div>
        </div>
    );
}

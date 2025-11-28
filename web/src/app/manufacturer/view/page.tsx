"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { db, auth } from "@/shared/firebaseConfig";
import {
    collection,
    query,
    where,
    orderBy,
    onSnapshot
} from "firebase/firestore";

import ManufacturerSidebar from "@/components/ManufacturerSidebar";
import MainHeader from "@/components/Header";

export default function ViewMaterialsPage() {
    const [materials, setMaterials] = useState<any[]>([]);
    const [userId, setUserId] = useState<string | null>(null);

    useEffect(() => {
        const unsub = auth.onAuthStateChanged((user) => {
            if (user) setUserId(user.uid);
        });
        return () => unsub();
    }, []);

    useEffect(() => {
        if (!userId) return;

        const q = query(
            collection(db, "materials"),
            where("manufacturerId", "==", userId),
            orderBy("createdAt", "desc")
        );

        const unsub = onSnapshot(q, (snap) => {
            const rows: any[] = [];
            snap.forEach((doc) => rows.push({ id: doc.id, ...doc.data() }));
            setMaterials(rows);
        });

        return () => unsub();
    }, [userId]);

    return (
        <div className="min-h-screen bg-[#F7E8FF]">
            {/* FIXED HEADER */}
            <MainHeader />

            {/* SIDEBAR + CONTENT */}
            <div className="flex pt-[90px]">
                <ManufacturerSidebar />

                {/* MAIN CONTENT */}
                <main className="ml-64 w-[calc(100%-16rem)] px-10 py-10">
                    <h1 className="text-3xl font-extrabold text-[#A259FF] mb-6">
                        Manufactured Components
                    </h1>

                    <div className="bg-white rounded-3xl shadow-xl p-6 w-full">
                        {materials.length === 0 ? (
                            <p className="text-gray-500 text-sm">
                                No materials added yet.
                            </p>
                        ) : (
                            <table className="w-full text-xs">
                                <thead>
                                    <tr className="bg-[#F7E8FF] text-[#6B4FA3]">
                                        <th className="p-2">Material ID</th>
                                        <th className="p-2">Fitting Type</th>
                                        <th className="p-2">Drawing</th>
                                        <th className="p-2">Mfg Date</th>
                                        <th className="p-2">QR</th>
                                        <th className="p-2">Edit</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {materials.map((m) => (
                                        <tr key={m.id} className="border-b">
                                            <td className="p-2">{m.materialId}</td>
                                            <td className="p-2">{m.fittingType}</td>
                                            <td className="p-2">{m.drawingNumber}</td>
                                            <td className="p-2">{m.manufacturingDate}</td>

                                            <td className="p-2">
                                                <Link
                                                    href={`/manufacturer/generate-qr?id=${m.id}`}
                                                    className="text-[#A259FF]"
                                                >
                                                    View QR
                                                </Link>
                                            </td>

                                            <td className="p-2">
                                                <Link
                                                    href={`/manufacturer/edit/${m.id}`}
                                                    className="text-blue-600 hover:underline"
                                                >
                                                    Edit
                                                </Link>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
}

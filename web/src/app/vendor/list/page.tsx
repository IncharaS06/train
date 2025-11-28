"use client";

import { useEffect, useState } from "react";
import { db } from "@/shared/firebaseConfig";
import { collection, onSnapshot } from "firebase/firestore";
import Link from "next/link";

export default function MaterialListPage() {
    type Material = { id: string; materialId?: string; fittingType?: string; qrUrl?: string; [key: string]: any };
    const [materials, setMaterials] = useState<Material[]>([]);

    useEffect(() => {
        const unsub = onSnapshot(collection(db, "materials"), (snap) => {
            const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
            setMaterials(data);
        });

        return () => unsub();
    }, []);

    return (
        <div className="min-h-screen bg-[#F7E8FF] p-10">
            <h1 className="text-4xl font-bold text-[#A259FF] mb-8">
                Manufactured Materials
            </h1>

            <div className="grid grid-cols-3 gap-8">
                {materials.map((m: any) => (
                    <Link key={m.id} href={`/vendor/${m.id}`}>
                        <div className="bg-white p-6 rounded-xl shadow-lg hover:scale-105 transition">
                            <p className="font-bold">{m.materialId}</p>
                            <p className="text-sm text-[#6a5a8f]">{m.fittingType}</p>
                            <img src={m.qrUrl} className="w-32 mt-3" />
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
}

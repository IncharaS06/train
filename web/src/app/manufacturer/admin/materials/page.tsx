"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "@/shared/firebaseConfig";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";

import MainHeader from "@/components/Header";
import ManufacturerAdminSidebar from "@/components/ManufacturerAdminSidebar";
import AppLoader from "@/components/AppLoader";   // ✅ ADDED

export default function AdminMaterialsPage() {
    const router = useRouter();

    // --- ALWAYS FIRST HOOK ---
    const [authStatus, setAuthStatus] =
        useState<"checking" | "allowed" | "denied">("checking");

    type Material = {
        id: string;
        materialId?: string;
        fittingType?: string;
        drawingNumber?: string;
        batchNumber?: string;
        purchaseOrderNumber?: string;
        manufacturingDate?: string;
        manufacturerId?: string;
        [key: string]: any;
    };

    // --- DATA HOOKS ---
    const [materials, setMaterials] = useState<Material[]>([]);
    const [filterType, setFilterType] = useState("");
    const [loadingData, setLoadingData] = useState(true);

    // ============================
    // AUTH CHECK
    // ============================
    useEffect(() => {
        const unsub = onAuthStateChanged(auth, async (user) => {
            if (!user) {
                setAuthStatus("denied");
                return;
            }

            const snap = await getDoc(doc(db, "users", user.uid));
            if (snap.exists() && snap.data().role === "manufacturerAdmin") {
                setAuthStatus("allowed");
            } else {
                setAuthStatus("denied");
            }
        });

        return () => unsub();
    }, []);

    // ============================
    // LOAD MATERIALS (after allowed)
    // ============================
    useEffect(() => {
        if (authStatus !== "allowed") return;

        async function loadData() {
            setLoadingData(true);

            const snap = await getDocs(collection(db, "materials"));
            setMaterials(snap.docs.map((d) => ({ id: d.id, ...d.data() })));

            setLoadingData(false);
        }

        loadData();
    }, [authStatus]);

    // ============================
    // FILTER DATA
    // ============================
    const filteredMaterials = useMemo(() => {
        return materials.filter((m) =>
            filterType ? m.fittingType === filterType : true
        );
    }, [materials, filterType]);

    // ============================
    // LOADING & ACCESS STATES
    // ============================

    // 🔥 AUTH CHECKING → Show Train Loader
    if (authStatus === "checking") return <AppLoader />;

    // ❌ NOT ADMIN → redirect
    if (authStatus === "denied") {
        router.replace("/manufacturer/admin-login");
        return null;
    }

    // 🔥 DATA LOADING → Show Train Loader
    if (loadingData) return <AppLoader />;

    // ============================
    // PAGE CONTENT
    // ============================
    return (
        <div className="min-h-screen bg-[#F7E8FF]">
            <MainHeader />

            <div className="flex pt-[90px]">
                <ManufacturerAdminSidebar />

                <main className="ml-64 w-[calc(100%-16rem)] px-10 py-10">
                    <h1 className="text-3xl font-extrabold text-[#A259FF] mb-6">
                        All Materials – Admin View
                    </h1>

                    {/* FILTER */}
                    <select
                        className="border p-2 rounded-xl mb-4 text-sm"
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value)}
                    >
                        <option value="">All Types</option>
                        <option value="Elastic Rail Clip">Elastic Rail Clip</option>
                        <option value="Rail Pad">Rail Pad</option>
                        <option value="Liner">Liner</option>
                        <option value="Sleeper">Sleeper</option>
                    </select>

                    {/* TABLE */}
                    <table className="w-full text-xs bg-white rounded-xl shadow">
                        <thead>
                            <tr className="bg-[#F7E8FF] text-[#6B4FA3]">
                                <th className="py-2 px-2">Material ID</th>
                                <th className="py-2 px-2">Type</th>
                                <th className="py-2 px-2">Drawing</th>
                                <th className="py-2 px-2">Batch</th>
                                <th className="py-2 px-2">PO No</th>
                                <th className="py-2 px-2">Mfg Date</th>
                                <th className="py-2 px-2">Manufacturer</th>
                            </tr>
                        </thead>

                        <tbody>
                            {filteredMaterials.map((m) => (
                                <tr key={m.id} className="border-b">
                                    <td className="py-2 px-2">{m.materialId || "—"}</td>
                                    <td className="py-2 px-2">{m.fittingType || "—"}</td>
                                    <td className="py-2 px-2">{m.drawingNumber || "—"}</td>
                                    <td className="py-2 px-2">{m.batchNumber || "—"}</td>
                                    <td className="py-2 px-2">{m.purchaseOrderNumber || "—"}</td>
                                    <td className="py-2 px-2">{m.manufacturingDate || "—"}</td>
                                    <td className="py-2 px-2">{m.manufacturerId || "—"}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </main>
            </div>
        </div>
    );
}

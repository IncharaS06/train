"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { auth, db } from "@/shared/firebaseConfig";
import {
    collection,
    query,
    where,
    orderBy,
    limit,
    getDocs,
} from "firebase/firestore";

import ManufacturerSidebar from "@/components/ManufacturerSidebar";
import MainHeader from "@/components/Header";

// ⬅️ ADD THIS
import AppLoader from "@/components/AppLoader";

type MaterialRow = {
    id: string;
    materialId: string;
    fittingType: string;
    manufacturingDate?: string;
};

type Stats = {
    total: number;
    thisMonth: number;
    erc: number;
    pad: number;
    liner: number;
    sleeper: number;
};

export default function ManufacturerDashboard() {
    const router = useRouter();

    const [mounted, setMounted] = useState(false);
    const [authChecked, setAuthChecked] = useState(false);
    const [userId, setUserId] = useState<string | null>(null);

    const [stats, setStats] = useState<Stats>({
        total: 0,
        thisMonth: 0,
        erc: 0,
        pad: 0,
        liner: 0,
        sleeper: 0,
    });

    const [recent, setRecent] = useState<MaterialRow[]>([]);
    const [loadingData, setLoadingData] = useState(true);

    // ---------------- MOUNT ----------------
    useEffect(() => setMounted(true), []);

    // ---------------- AUTH CHECK ----------------
    useEffect(() => {
        if (!mounted) return;

        const unsub = auth.onAuthStateChanged((user) => {
            if (!user) {
                setAuthChecked(true);
                router.push("/manufacturer/login");
            } else {
                setUserId(user.uid);
                setAuthChecked(true);
            }
        });

        return () => unsub();
    }, [mounted]);

    // ---------------- LOAD DATA ----------------
    useEffect(() => {
        if (!userId) return;

        async function load() {
            setLoadingData(true);

            try {
                const coll = collection(db, "materials");

                // ALL MATERIALS OF THIS MANUFACTURER
                const qAll = query(coll, where("manufacturerId", "==", userId));
                const snapAll = await getDocs(qAll);

                const now = new Date();
                const monthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

                let total = 0, thisMonth = 0;
                let erc = 0, pad = 0, liner = 0, sleeper = 0;

                snapAll.forEach((docSnap) => {
                    total++;
                    const data: any = docSnap.data();

                    if (data.manufacturingDate?.startsWith(monthPrefix)) {
                        thisMonth++;
                    }

                    const ft = (data.fittingType || "").toLowerCase();
                    if (ft.includes("clip") || ft.includes("elastic")) erc++;
                    else if (ft.includes("pad")) pad++;
                    else if (ft.includes("liner")) liner++;
                    else if (ft.includes("sleep")) sleeper++;
                });

                setStats({ total, thisMonth, erc, pad, liner, sleeper });

                // RECENT MATERIALS
                const qRecent = query(
                    coll,
                    where("manufacturerId", "==", userId),
                    orderBy("createdAt", "desc"),
                    limit(5)
                );

                const snapRecent = await getDocs(qRecent);
                const rows: MaterialRow[] = [];
                snapRecent.forEach((d) => rows.push({ id: d.id, ...(d.data() as any) }));

                setRecent(rows);
            } finally {
                setLoadingData(false);
            }
        }

        load();
    }, [userId]);

    // ---------------- GLOBAL LOADING STATES ----------------
    if (!mounted || !authChecked) return <AppLoader />;

    if (loadingData) return <AppLoader />;

    // ---------------- UI START ----------------
    const totalTypes = stats.erc + stats.pad + stats.liner + stats.sleeper || 1;

    return (
        <div className="min-h-screen bg-[#F7E8FF]">
            <MainHeader />

            <div className="flex pt-[90px]">
                <ManufacturerSidebar />

                <main className="ml-64 w-[calc(100%-16rem)] px-8 py-8">

                    <h1 className="text-3xl font-extrabold text-[#A259FF] mb-6">
                        Manufacturer Analytics
                    </h1>

                    {/* TOP CARDS */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="bg-white rounded-3xl shadow-lg px-5 py-4 border-t-4 border-[#A259FF]">
                            <p className="text-[11px] text-gray-500">Total Components</p>
                            <p className="text-3xl font-bold text-[#4B3A7A]">{stats.total}</p>
                        </div>

                        <div className="bg-white rounded-3xl shadow-lg px-5 py-4 border-t-4 border-[#F97316]">
                            <p className="text-[11px] text-gray-500">This Month</p>
                            <p className="text-3xl font-bold text-[#4B3A7A]">{stats.thisMonth}</p>
                        </div>

                        <Link
                            href="/manufacturer/add-material"
                            className="bg-gradient-to-br from-[#A259FF] to-[#F97316] rounded-3xl shadow-lg px-5 py-4 text-white"
                        >
                            <p className="text-[11px] opacity-80">Quick Action</p>
                            <p className="text-xl font-semibold">Add Material</p>
                        </Link>

                        <Link
                            href="/manufacturer/view"
                            className="bg-white rounded-3xl shadow-lg px-5 py-4 border border-[#E9D5FF]"
                        >
                            <p className="text-[11px] text-gray-500">Components</p>
                            <p className="text-xl font-semibold text-[#4B3A7A]">Browse & Export</p>
                        </Link>
                    </div>

                    {/* RECENT COMPONENTS */}
                    <div className="bg-white rounded-3xl shadow-lg p-6 mt-8">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-sm font-semibold text-[#4B3A7A]">Recent Components</h2>
                            <Link href="/manufacturer/view" className="text-xs text-[#A259FF]">
                                View all →
                            </Link>
                        </div>

                        <table className="w-full text-xs">
                            <thead>
                                <tr className="bg-[#F7E8FF] text-[#6B4FA3]">
                                    <th className="py-2 px-2">Material ID</th>
                                    <th className="py-2 px-2">Fitting Type</th>
                                    <th className="py-2 px-2">Mfg Date</th>
                                    <th className="py-2 px-2">QR</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recent.map((m) => (
                                    <tr key={m.id} className="border-b">
                                        <td className="py-2 px-2">{m.materialId}</td>
                                        <td className="py-2 px-2">{m.fittingType}</td>
                                        <td className="py-2 px-2">{m.manufacturingDate || "-"}</td>
                                        <td className="py-2 px-2">
                                            <Link href={`/manufacturer/generate-qr?id=${m.id}`} className="text-[#A259FF]">
                                                View QR
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                </main>
            </div>
        </div>
    );
}

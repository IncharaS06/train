"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "@/shared/firebaseConfig";
import {
    collection,
    query,
    where,
    getDocs,
    doc,
    getDoc
} from "firebase/firestore";

import MainHeader from "@/components/Header";
import ManufacturerAdminSidebar from "@/components/ManufacturerAdminSidebar";
import AppLoader from "@/components/AppLoader";   // 🚆 Train Loader

export default function ManufacturerAdminEmployeesPage() {
    const router = useRouter();

    // AUTH STATES
    const [checkingAuth, setCheckingAuth] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);

    // DATA
    const [employees, setEmployees] = useState<any[]>([]);
    const [materials, setMaterials] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Filters
    const [search, setSearch] = useState("");

    // -----------------------------------------------------------
    // AUTH CHECK
    // -----------------------------------------------------------
    useEffect(() => {
        const unsub = onAuthStateChanged(auth, async (user) => {
            if (!user) {
                setCheckingAuth(false);
                setIsAdmin(false);
                router.replace("/manufacturer/admin-login");
                return;
            }

            const ref = doc(db, "users", user.uid);
            const snap = await getDoc(ref);

            if (snap.exists() && snap.data().role === "manufacturerAdmin") {
                setIsAdmin(true);
            } else {
                setIsAdmin(false);
                router.replace("/manufacturer/admin-login");
            }

            setCheckingAuth(false);
        });

        return () => unsub();
    }, [router]);

    // -----------------------------------------------------------
    // LOADING EMPLOYEES + MATERIALS
    // -----------------------------------------------------------
    useEffect(() => {
        if (!isAdmin) return;

        async function loadData() {
            setLoading(true);

            const empSnap = await getDocs(
                query(collection(db, "users"), where("role", "==", "manufacturer"))
            );
            const empList = empSnap.docs.map((d) => ({ uid: d.id, ...d.data() }));
            setEmployees(empList);

            const matSnap = await getDocs(collection(db, "materials"));
            const matList = matSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
            setMaterials(matList);

            setLoading(false);
        }

        loadData();
    }, [isAdmin]);

    // -----------------------------------------------------------
    // EMPLOYEE STATS
    // -----------------------------------------------------------
    const employeeRows = employees.map((emp) => {
        const mats = materials.filter((m) => m.manufacturerId === emp.uid);

        const lastDate =
            mats.length > 0
                ? mats
                    .map((m) => m.manufacturingDate)
                    .sort()
                    .reverse()[0]
                : "-";

        return {
            ...emp,
            total: mats.length,
            lastDate,
        };
    });

    // -----------------------------------------------------------
    // FILTER EMPLOYEES
    // -----------------------------------------------------------
    const filtered = employeeRows.filter((e) => {
        const s = search.toLowerCase();
        return (
            e.name?.toLowerCase().includes(s) ||
            e.empId?.toLowerCase().includes(s) ||
            e.email?.toLowerCase().includes(s)
        );
    });

    // -----------------------------------------------------------
    // LOADERS
    // -----------------------------------------------------------
    if (checkingAuth) return <AppLoader />;     // 🚆 Train loader for auth
    if (!isAdmin) return null;
    if (loading) return <AppLoader />;         // 🚆 Train loader for data

    // -----------------------------------------------------------
    // UI
    // -----------------------------------------------------------
    return (
        <div className="min-h-screen bg-[#F7E8FF]">
            <MainHeader />

            <div className="flex pt-[90px]">
                <ManufacturerAdminSidebar />

                <main className="ml-64 px-10 py-10 w-[calc(100%-16rem)]">
                    <h1 className="text-3xl font-extrabold text-[#A259FF]">Employees</h1>
                    <p className="text-xs text-gray-600 mb-6">
                        All Manufacturer Employees
                    </p>

                    {/* Search */}
                    <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search employee by name / emp ID / email"
                        className="w-72 mb-4 border px-3 py-2 rounded-xl text-xs"
                    />

                    <div className="bg-white rounded-3xl shadow-lg p-5">
                        <table className="w-full text-xs">
                            <thead>
                                <tr className="bg-[#F7E8FF] text-[#6B4FA3]">
                                    <th className="py-2 px-2">Name</th>
                                    <th className="py-2 px-2">Emp ID</th>
                                    <th className="py-2 px-2">Email</th>
                                    <th className="py-2 px-2">Total Materials</th>
                                    <th className="py-2 px-2">Last Mfg Date</th>
                                </tr>
                            </thead>

                            <tbody>
                                {filtered.map((emp) => (
                                    <tr key={emp.uid} className="border-b">
                                        <td className="py-2 px-2">{emp.name}</td>
                                        <td className="py-2 px-2">{emp.empId || "-"}</td>
                                        <td className="py-2 px-2">{emp.email}</td>
                                        <td className="py-2 px-2">{emp.total}</td>
                                        <td className="py-2 px-2">{emp.lastDate}</td>
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

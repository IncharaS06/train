"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "@/shared/firebaseConfig";
import {
    collection,
    query,
    where,
    getDocs,
    doc,
    getDoc,
} from "firebase/firestore";

import MainHeader from "@/components/Header";
import ManufacturerAdminSidebar from "@/components/ManufacturerAdminSidebar";
import AppLoader from "@/components/AppLoader";   // ✅ NEW — Train Loader

export default function ManufacturerAdminDashboard() {
    const router = useRouter();

    // -------------------------------------------------------
    // HOOKS — MUST ALWAYS RUN IN SAME ORDER
    // -------------------------------------------------------

    type Employee = {
        uid: string;
        name?: string;
        empId?: string;
        email?: string;
        role?: string;
        [key: string]: any;
    };

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

    const [authChecking, setAuthChecking] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);

    const [employees, setEmployees] = useState<Employee[]>([]);
    const [materials, setMaterials] = useState<Material[]>([]);
    const [loadingData, setLoadingData] = useState(true);

    const [searchEmp, setSearchEmp] = useState("");
    const [filterType, setFilterType] = useState("");

    // -------------------------------------------------------
    // AUTH CHECK
    // -------------------------------------------------------
    useEffect(() => {
        const unsub = onAuthStateChanged(auth, async (user) => {
            if (!user) {
                setIsAdmin(false);
                setAuthChecking(false);
                return;
            }

            const snap = await getDoc(doc(db, "users", user.uid));

            if (snap.exists() && snap.data().role === "manufacturerAdmin") {
                setIsAdmin(true);
            } else {
                setIsAdmin(false);
            }

            setAuthChecking(false);
        });

        return () => unsub();
    }, []);

    // -------------------------------------------------------
    // LOAD DATA (Only AFTER isAdmin known)
    // -------------------------------------------------------
    useEffect(() => {
        if (!isAdmin) return;

        async function loadAll() {
            setLoadingData(true);

            const empSnap = await getDocs(
                query(collection(db, "users"), where("role", "==", "manufacturer"))
            );
            setEmployees(empSnap.docs.map((d) => ({ uid: d.id, ...d.data() })));

            const matSnap = await getDocs(collection(db, "materials"));
            setMaterials(matSnap.docs.map((d) => ({ id: d.id, ...d.data() })));

            setLoadingData(false);
        }

        loadAll();
    }, [isAdmin]);

    // -------------------------------------------------------
    // DERIVED STATS
    // -------------------------------------------------------
    const employeeStats = useMemo(() => {
        const stats = new Map();

        employees.forEach((e) =>
            stats.set(e.uid, {
                employee: e,
                totalMaterials: 0,
                lastMfgDate: null,
            })
        );

        materials.forEach((m) => {
            const s = stats.get(m.manufacturerId);
            if (!s) return;

            s.totalMaterials++;

            if (
                m.manufacturingDate &&
                (!s.lastMfgDate || m.manufacturingDate > s.lastMfgDate)
            ) {
                s.lastMfgDate = m.manufacturingDate;
            }
        });

        return [...stats.values()].sort((a, b) => b.totalMaterials - a.totalMaterials);
    }, [employees, materials]);

    const filteredStats = useMemo(() => {
        const search = searchEmp.toLowerCase();
        return employeeStats.filter((s) =>
            `${s.employee.name} ${s.employee.empId} ${s.employee.email}`
                .toLowerCase()
                .includes(search)
        );
    }, [employeeStats, searchEmp]);

    const filteredMaterials = useMemo(() => {
        return materials.filter((m) => !filterType || m.fittingType === filterType);
    }, [materials, filterType]);

    // -------------------------------------------------------
    // UI RETURN (SAFE)
    // -------------------------------------------------------

    // STILL CHECKING AUTH → show TRAIN loader
    if (authChecking) return <AppLoader />;

    // NOT ADMIN → redirect
    if (!isAdmin) {
        router.replace("/manufacturer/admin-login");
        return null;
    }

    // LOADING MATERIALS OR EMPLOYEES → TRAIN loader
    if (loadingData) return <AppLoader />;

    const totalEmployees = employees.length;
    const totalMaterials = materials.length;

    const totalThisMonth = materials.filter((m) => {
        if (!m.manufacturingDate) return false;
        const now = new Date();
        const prefix = `${now.getFullYear()}-${String(
            now.getMonth() + 1
        ).padStart(2, "0")}`;
        return m.manufacturingDate.startsWith(prefix);
    }).length;

    return (
        <div className="min-h-screen bg-[#F7E8FF]">
            <MainHeader />

            <div className="flex pt-[90px]">
                <ManufacturerAdminSidebar />

                <main className="ml-64 w-[calc(100%-16rem)] px-10 py-10">
                    <h1 className="text-3xl font-extrabold text-[#A259FF] mb-1">
                        Manufacturer Admin Dashboard
                    </h1>

                    <p className="text-xs text-gray-600 mb-6">
                        Monitor all employees and their material activity.
                    </p>

                    {/* SUMMARY CARDS */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <div className="bg-white rounded-3xl shadow-lg px-5 py-4 border-t-4 border-[#A259FF]">
                            <p className="text-[11px] text-gray-500">Employees</p>
                            <p className="text-3xl font-bold">{totalEmployees}</p>
                        </div>

                        <div className="bg-white rounded-3xl shadow-lg px-5 py-4 border-t-4 border-orange-400">
                            <p className="text-[11px] text-gray-500">Materials</p>
                            <p className="text-3xl font-bold">{totalMaterials}</p>
                        </div>

                        <div className="bg-white rounded-3xl shadow-lg px-5 py-4 border-t-4 border-emerald-400">
                            <p className="text-[11px] text-gray-500">This Month</p>
                            <p className="text-3xl font-bold">{totalThisMonth}</p>
                        </div>
                    </div>

                    {/* EMPLOYEE TABLE */}
                    <div className="bg-white rounded-3xl shadow-lg p-5 mb-6">
                        <h2 className="text-sm font-semibold mb-3">
                            Employees & Work Summary
                        </h2>

                        <input
                            className="text-xs px-3 py-2 border rounded-xl w-64 mb-3"
                            placeholder="Search employees…"
                            value={searchEmp}
                            onChange={(e) => setSearchEmp(e.target.value)}
                        />

                        <table className="w-full text-xs">
                            <thead>
                                <tr className="bg-[#F7E8FF] text-[#6B4FA3]">
                                    <th className="py-2 px-2">Name</th>
                                    <th className="py-2 px-2">Emp ID</th>
                                    <th className="py-2 px-2">Email</th>
                                    <th className="py-2 px-2">Materials</th>
                                    <th className="py-2 px-2">Last Mfg</th>
                                </tr>
                            </thead>

                            <tbody>
                                {filteredStats.map((s) => (
                                    <tr key={s.employee.uid} className="border-b">
                                        <td className="py-2 px-2">{s.employee.name}</td>
                                        <td className="py-2 px-2">{s.employee.empId || "-"}</td>
                                        <td className="py-2 px-2">{s.employee.email}</td>
                                        <td className="py-2 px-2">{s.totalMaterials}</td>
                                        <td className="py-2 px-2">{s.lastMfgDate || "-"}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* MATERIAL TABLE */}
                    <div className="bg-white rounded-3xl shadow-lg p-5">
                        <h2 className="text-sm font-semibold mb-3">Materials</h2>

                        <select
                            className="text-xs px-3 py-2 border rounded-xl mb-3"
                            value={filterType}
                            onChange={(e) => setFilterType(e.target.value)}
                        >
                            <option value="">All Types</option>
                            <option value="Elastic Rail Clip">Elastic Rail Clip</option>
                            <option value="Rail Pad">Rail Pad</option>
                            <option value="Liner">Liner</option>
                            <option value="Sleeper">Sleeper</option>
                        </select>

                        <table className="w-full text-xs">
                            <thead>
                                <tr className="bg-[#F7E8FF] text-[#6B4FA3]">
                                    <th className="py-2 px-2">Material ID</th>
                                    <th className="py-2 px-2">Type</th>
                                    <th className="py-2 px-2">Drawing</th>
                                    <th className="py-2 px-2">Batch</th>
                                    <th className="py-2 px-2">PO No</th>
                                    <th className="py-2 px-2">Mfg Date</th>
                                    <th className="py-2 px-2">Employee</th>
                                </tr>
                            </thead>

                            <tbody>
                                {filteredMaterials.map((m) => {
                                    const emp = employees.find((e) => e.uid === m.manufacturerId);
                                    return (
                                        <tr key={m.id} className="border-b">
                                            <td className="py-2 px-2">{m.materialId}</td>
                                            <td className="py-2 px-2">{m.fittingType}</td>
                                            <td className="py-2 px-2">{m.drawingNumber}</td>
                                            <td className="py-2 px-2">{m.batchNumber}</td>
                                            <td className="py-2 px-2">{m.purchaseOrderNumber}</td>
                                            <td className="py-2 px-2">{m.manufacturingDate}</td>
                                            <td className="py-2 px-2">
                                                {emp ? `${emp.name} (${emp.empId || "-"})` : "-"}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </main>
            </div>
        </div>
    );
}
